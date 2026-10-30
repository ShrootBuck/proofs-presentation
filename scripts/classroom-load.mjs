import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { gameRounds } from '../lib/logic.mjs'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const summary = values => {
  const sorted = [...values].sort((a, b) => a - b)
  return { samples: sorted.length, p95Ms: Math.round(sorted[Math.floor(sorted.length * .95)] || 0), maxMs: Math.round(sorted.at(-1) || 0) }
}

// Always creates an isolated rehearsal room. Never operates an existing class.
export async function exerciseClassroom({ origin, hostKey, players = 80, waves = 10, onProgress = () => {} }) {
  assert.ok(Number.isInteger(players) && players >= 1 && players <= 120, 'Use 1 to 120 simulated players.')
  assert.ok(Number.isInteger(waves) && waves >= 1 && waves <= 20, 'Use 1 to 20 waves.')
  const timings = { join: [], guess: [], vote: [], host: [], health: [] }
  const connections = new Set(), cookies = []
  const start = performance.now()
  let code, hostToken, monitor, checking = false, healthError, streamErrors = [], stopping = false
  let events = 0, maxEventBytes = 0
  async function request(route, { data, auth, cookie, expected = 200, metric } = {}) {
    const began = performance.now()
    const response = await fetch(origin + route, {
      method: data === undefined ? 'GET' : 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: data === undefined ? undefined : JSON.stringify(data),
    })
    const result = await response.json()
    if (metric) timings[metric].push(performance.now() - began)
    assert.equal(response.status, expected, `${route}: ${result.error || response.status}`)
    return { result, cookie: response.headers.get('set-cookie')?.split(';')[0] }
  }
  const route = () => `/api/rooms/${code}`
  const state = async cookie => (await request(route(), { cookie })).result
  async function act(action, extra = {}) {
    const s = await state()
    return (await request(route() + '/host', { auth: hostToken, metric: 'host', data: {
      action, phase: s.phase, round: s.round, activity: s.activity, huntPhase: s.hunt.phase, controlRevision: s.controlRevision, ...extra,
    } })).result
  }
  async function openStream(cookie) {
    const controller = new AbortController(); connections.add(controller)
    const timeout = setTimeout(() => controller.abort(), 15000)
    let response
    try { response = await fetch(origin + route() + '/events', { headers: { Cookie: cookie }, signal: controller.signal }) }
    finally { clearTimeout(timeout) }
    assert.equal(response.status, 200)
    const reader = response.body.getReader(), decoder = new TextDecoder()
    void (async () => {
      let pending = ''
      try {
        while (true) {
          const chunk = await reader.read()
          if (chunk.done) { if (!stopping && !controller.signal.aborted) streamErrors.push('Live stream closed unexpectedly'); break }
          pending += decoder.decode(chunk.value, { stream: true })
          let end
          while ((end = pending.indexOf('\n\n')) >= 0) {
            const message = pending.slice(0, end); pending = pending.slice(end + 2)
            const line = message.split('\n').find(line => line.startsWith('data: '))
            if (!line) continue
            const s = JSON.parse(line.slice(6)); assert.equal(s.code, code); assert.ok(s.myName)
            events++; maxEventBytes = Math.max(maxEventBytes, Buffer.byteLength(message))
          }
        }
      } catch (error) { if (!controller.signal.aborted && !stopping) streamErrors.push(error.message) }
    })()
  }
  const disconnect = () => { for (const controller of connections) controller.abort(); connections.clear() }
  try {
    const created = (await request('/api/rooms', { data: {}, auth: hostKey, expected: 201 })).result
    ;({ code, hostToken } = created)
    assert.equal(created.logging.durable, true); assert.equal(created.logging.ready, true)
    monitor = setInterval(async () => {
      if (checking) return
      checking = true
      try { await request('/health', { metric: 'health' }) } catch (error) { healthError = error } finally { checking = false }
    }, 200)
    cookies.push(...await Promise.all(Array.from({ length: players }, async (_, i) => {
      const joined = await request(route() + '/join', { data: { name: `Load ${i + 1}` }, metric: 'join' })
      assert.ok(joined.cookie); return joined.cookie
    })))
    assert.equal((await state()).joined, players)
    await Promise.all(cookies.map(openStream))
    onProgress(`${players} players joined with ${connections.size} live streams.`)
    const opened = await act('hunt-start')
    for (let wave = 0; wave < waves; wave++) {
      if (healthError) throw healthError
      await Promise.all(cookies.map(async (cookie, i) => {
        const n = '9'.repeat(94) + String(wave * players + i).padStart(6, '0')
        const data = { n, requestId: `load-${wave}-${String(i).padStart(4, '0')}`, controlRevision: opened.controlRevision }
        const guess = (await request(route() + '/guess', { cookie, data, metric: 'guess' })).result
        assert.equal(guess.n, n); assert.equal(guess.attempts, wave + 1)
        assert.equal(BigInt(guess.a), BigInt(n) ** 17n + 9n)
        if (wave === 0 && i === 0) assert.deepEqual((await request(route() + '/guess', { cookie, data })).result, guess)
      }))
      // Exercise the clients' fallback reads alongside the event streams.
      if (wave % 3 === 2) await Promise.all(cookies.map(state))
      // Wait after acknowledgement, because queued requests can arrive in a
      // different order on the next wave. Respect the server's 500 ms cooldown.
      if (wave < waves - 1) await sleep(520)
    }
    assert.equal((await state()).hunt.attempts, players * waves)
    const paused = await act('hunt-pause'); assert.equal(paused.hunt.phase, 'paused')
    await act('hunt-resume'); await act('proof-setup'); await act('start')
    disconnect(); await Promise.all(cookies.map(openStream))
    onProgress(`${players * waves} exact 100-digit guesses saved; all phones reconnected.`)
    for (let round = 0; round < gameRounds.length; round++) {
      const opened = await state()
      await Promise.all(cookies.map(async cookie => {
        const voted = (await request(route() + '/vote', { cookie, data: { round, valid: gameRounds[round].valid, controlRevision: opened.controlRevision }, metric: 'vote' })).result
        assert.equal(voted.myVote, gameRounds[round].valid); assert.equal(voted.answer, null); assert.equal(voted.counts, null)
      }))
      const locked = await act('lock'); assert.equal(locked.counts.total, players)
      await request(route() + '/vote', { cookie: cookies[0], data: { round, valid: !gameRounds[round].valid, controlRevision: opened.controlRevision }, expected: 409 })
      const revealed = await act('reveal'); assert.equal(revealed.score.class, round + 1)
      if (round < gameRounds.length - 1) await act('next')
    }
    const finished = await act('finish')
    assert.ok(finished.participants.every(p => p.points === 5))
    assert.equal((await state(cookies[0])).myHunt.attempts, waves)
    const log = await fetch(origin + route() + '/hunt-log', { headers: { Authorization: `Bearer ${hostToken}` }, signal: AbortSignal.timeout(15000) })
    assert.equal(log.status, 200)
    const records = (await log.text()).trim().split('\n').map(JSON.parse)
    assert.equal(records.length, players * waves * 2)
    assert.equal(new Set(records.filter(r => r.kind === 'input').map(r => r.sequence)).size, players * waves)
    if (healthError) throw healthError
    assert.deepEqual(streamErrors, [])
    assert.ok(events >= players * 2)
    onProgress('All five rounds, scores, stale-vote rejection, and durable receipts passed.')
    return { checkedAt: new Date().toISOString(), origin, room: code, players, guesses: players * waves, votes: players * 5,
      durableRecords: records.length, liveStreams: players, reconnects: players, events, maxEventBytes,
      seconds: Number(((performance.now() - start) / 1000).toFixed(1)), timings: Object.fromEntries(Object.entries(timings).map(([key, values]) => [key, summary(values)])) }
  } finally { stopping = true; clearInterval(monitor); disconnect() }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const origin = process.env.LOAD_ORIGIN || 'http://127.0.0.1:3040'
  if (!process.env.HOST_KEY) throw new Error('HOST_KEY is required; keep it in the environment.')
  const report = await exerciseClassroom({ origin, hostKey: process.env.HOST_KEY, players: Number(process.env.LOAD_PLAYERS || 80), waves: Number(process.env.LOAD_WAVES || 10), onProgress: text => console.error(text) })
  console.log(JSON.stringify(report, null, 2))
}
