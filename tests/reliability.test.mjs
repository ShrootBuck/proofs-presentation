import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createProofServer } from '../server/server.mjs'

const key = 'reliability-test-key'
async function classroom({ disk = false } = {}) {
  let now = Date.now()
  const directory = disk ? await fs.mkdtemp(path.join(os.tmpdir(), 'proof-reliability-')) : null
  const options = { hostKey: key, clock: () => now, ...(disk ? { statePath: path.join(directory, 'rooms.json') } : {}) }
  let server, origin
  async function boot() {
    server = createProofServer(options)
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${server.address().port}`
  }
  await boot()
  async function request(route, { data, auth, cookie, method = data === undefined ? 'GET' : 'POST' } = {}) {
    const r = await fetch(origin + route, { method, headers: { ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(cookie ? { Cookie: cookie } : {}), 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) })
    return { status: r.status, data: await r.json(), cookie: r.headers.get('set-cookie')?.split(';')[0] }
  }
  const created = await request('/api/rooms', { data: {}, auth: key })
  assert.equal(created.status, 201)
  const { code, hostToken } = created.data, route = `/api/rooms/${code}`
  const state = async cookie => (await request(route, { cookie })).data
  async function act(action, extra = {}, expected = 200) {
    const s = await state()
    const result = await request(route + '/host', { auth: hostToken, data: { action, phase: s.phase, round: s.round, activity: s.activity, huntPhase: s.hunt.phase, controlRevision: s.controlRevision, ...extra } })
    assert.equal(result.status, expected, JSON.stringify(result.data)); return result.data
  }
  const join = async name => { const r = await request(route + '/join', { data: { name } }); assert.equal(r.status, 200); return r.cookie }
  const closeServer = () => { server.closeRoomStreams(); return new Promise(resolve => server.close(resolve)) }
  return { directory, options, request, state, act, join, route, hostToken,
    get origin() { return origin }, advance(ms) { now += ms },
    restart: async () => { await closeServer(); await boot() },
    close: async () => { await closeServer(); if (directory) await fs.rm(directory, { recursive: true, force: true }) },
  }
}

test('late host actions and submissions cannot affect a newer timer or reopened round', async () => {
  const c = await classroom()
  try {
    const cookie = await c.join('Student')
    const original = await c.act('hunt-start')
    await c.act('hunt-restart')
    assert.equal((await c.request(c.route + '/host', { auth: c.hostToken, data: { action: 'hunt-restart', round: 0, phase: 'lobby', controlRevision: original.controlRevision } })).status, 409)
    assert.equal((await c.request(c.route + '/guess', { cookie, data: { n: '3', controlRevision: original.controlRevision } })).status, 409)
    await c.act('proof-setup'); const opened = await c.act('start')
    await c.act('lock'); await c.act('reopen')
    assert.equal((await c.request(c.route + '/vote', { cookie, data: { round: 0, valid: true, controlRevision: opened.controlRevision } })).status, 409)
    assert.equal((await c.state()).voted, 0)
    await c.act('select-round', { targetRound: 1.5 }, 400)
    await c.act('select-round', { targetRound: 100 }, 400)
    await c.act('switch-activity', { target: 'bogus' }, 400)
  } finally { await c.close() }
})

test('lost guess responses can be retried without another receipt, including after restart', async () => {
  const c = await classroom({ disk: true })
  try {
    const cookie = await c.join('Student'); const opened = await c.act('hunt-start')
    const data = { n: '9'.repeat(100), requestId: 'retry-same-input-123', controlRevision: opened.controlRevision }
    const first = await c.request(c.route + '/guess', { cookie, data })
    assert.equal(first.status, 200)
    const retry = await c.request(c.route + '/guess', { cookie, data })
    assert.deepEqual(retry.data, first.data)
    await c.act('proof-setup'); await c.restart()
    const afterRestart = await c.request(c.route + '/guess', { cookie, data })
    assert.deepEqual(afterRestart.data, first.data)
    assert.equal((await c.state()).hunt.attempts, 1)
    assert.equal((await c.request(c.route + '/guess', { cookie, data: { ...data, n: '123' } })).status, 409)
  } finally { await c.close() }
})

test('phone reconnect restores its own vote and guess without leaking another player\'s private state', async () => {
  const c = await classroom({ disk: true })
  try {
    const a = await c.join('Alice'), b = await c.join('Bob')
    await c.act('hunt-start')
    await c.request(c.route + '/guess', { cookie: a, data: { n: '99' } })
    await c.act('proof-setup'); await c.act('start')
    await c.request(c.route + '/vote', { cookie: a, data: { round: 0, valid: false } })
    const revision = (await c.state()).revision
    await c.act('lock'); await c.act('reveal'); await c.act('next')
    await c.restart()
    let s = await c.state(a)
    assert.ok(s.revision > revision)
    assert.equal(s.round, 1); assert.equal(s.myVote, null); assert.equal(s.myHunt.last.n, '99')
    await c.act('select-round', { targetRound: 0 })
    s = await c.state(a); assert.equal(s.myVote, false); assert.equal(s.myName, 'Alice')
    s = await c.state(b); assert.equal(s.myVote, null); assert.equal(s.myHunt, null); assert.equal(s.myName, 'Bob')
    assert.equal('myVote' in await c.state(), false)
    assert.equal((await c.state()).joinedAsPlayer, false)
    assert.equal((await c.state('proofs_voter=invalid.signature')).joinedAsPlayer, false)
    const rejoin = await c.request(c.route + '/join', { cookie: a, data: {} })
    assert.equal(rejoin.data.joined, 2); assert.equal(rejoin.data.myName, 'Alice')
    await c.act('switch-activity', { target: 'hunt' })
    s = await c.state(a); assert.equal(s.hunt.phase, 'paused'); assert.ok(s.hunt.remainingMs > 0)
  } finally { await c.close() }
})

test('failed room saves roll back host actions and votes rather than claiming success', async () => {
  const c = await classroom({ disk: true })
  const blocker = c.options.statePath + '.tmp'
  try {
    const cookie = await c.join('Student')
    const before = await c.state()
    await fs.mkdir(blocker)
    await c.act('hunt-start', {}, 503)
    assert.deepEqual(await c.state(), before)
    await fs.rmdir(blocker)
    await c.act('proof-setup'); await c.act('start')
    await fs.mkdir(blocker)
    const vote = await c.request(c.route + '/vote', { cookie, data: { round: 0, valid: false } })
    assert.equal(vote.status, 503); assert.equal((await c.state()).voted, 0)
    await fs.rmdir(blocker)
    assert.equal((await c.request(c.route + '/vote', { cookie, data: { round: 0, valid: false } })).status, 200)
  } finally { await fs.rm(blocker, { recursive: true, force: true }); await c.close() }
})

test('jumping back then advancing to an already scored proof does not silently reopen it', async () => {
  const c = await classroom()
  try {
    await c.act('proof-setup'); await c.act('select-round', { targetRound: 1 })
    await c.act('reveal'); await c.act('select-round', { targetRound: 0 }); await c.act('reveal')
    const s = await c.act('next'); assert.equal(s.phase, 'revealed'); assert.equal(s.round, 1)
  } finally { await c.close() }
})

test('40 live connections survive 400 durable 100-digit guesses and recover their latest result', { timeout: 30000 }, async () => {
  const c = await classroom({ disk: true }), streams = []
  try {
    const players = await Promise.all(Array.from({ length: 40 }, (_, i) => c.join(`Load ${i}`)))
    for (const cookie of players) {
      const controller = new AbortController()
      const r = await fetch(c.origin + c.route + '/events', { headers: { Cookie: cookie }, signal: controller.signal })
      assert.equal(r.status, 200)
      const reader = r.body.getReader()
      const first = new TextDecoder().decode((await reader.read()).value)
      assert.match(first, /myName/)
      streams.push(controller)
      void (async () => { try { while (!(await reader.read()).done) {} } catch {} })()
    }
    await c.act('hunt-start')
    const timings = []
    for (let wave = 0; wave < 10; wave++) {
      c.advance(600)
      await Promise.all(players.map(async (cookie, i) => {
        const start = performance.now(), n = '9'.repeat(96) + String(wave * 40 + i).padStart(4, '0')
        const r = await c.request(c.route + '/guess', { cookie, data: { n } })
        timings.push(performance.now() - start)
        assert.equal(r.status, 200); assert.equal(r.data.n, n)
        assert.equal(BigInt(r.data.a), BigInt(n) ** 17n + 9n)
      }))
    }
    assert.equal((await c.state()).hunt.attempts, 400)
    for (const controller of streams) controller.abort()
    await c.restart()
    assert.equal((await c.state()).hunt.attempts, 400)
    assert.equal((await c.state(players[0])).myHunt.attempts, 10)
    const records = (await fs.readFile(path.join(c.directory, 'guesses.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse)
    assert.equal(records.length, 800)
    assert.equal(new Set(records.filter(r => r.kind === 'input').map(r => r.sequence)).size, 400)
    timings.sort((a, b) => a - b)
    console.log(`40-player local load: p95 ${Math.round(timings[Math.floor(timings.length * .95)])}ms, max ${Math.round(timings.at(-1))}ms`)
  } finally { for (const controller of streams) controller.abort(); await c.close() }
})
