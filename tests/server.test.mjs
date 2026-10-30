import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createProofServer } from '../server/server.mjs'

const hostKey = 'local-test-key-for-proof-voting-only-2026'
async function start(options = {}) {
  const server = createProofServer({ hostKey, publicUrl: 'http://localhost:3040', ...options })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  const request = async (route, { method = 'GET', data, cookie, auth, headers = {} } = {}) => {
    const response = await fetch(origin + route, { method, headers: { ...headers, ...(data ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }, body: data ? JSON.stringify(data) : undefined })
    const type = response.headers.get('content-type') || ''
    return { status: response.status, cookie: response.headers.get('set-cookie')?.split(';')[0], data: type.includes('json') ? await response.json() : await response.text() }
  }
  return { server, request, close: () => new Promise(resolve => server.close(resolve)) }
}

test('a 40-browser classroom completes all rounds with hidden answers, locked votes, and correct scores', async () => {
  const app = await start()
  try {
    assert.equal((await app.request('/api/rooms', { method: 'POST', auth: 'wrong' })).status, 401)
    assert.equal((await app.request('/api/rooms', { method: 'POST', auth: hostKey, headers: { Origin: 'https://untrusted.example' } })).status, 403)
    const creation = await app.request('/api/rooms', { method: 'POST', auth: hostKey })
    assert.equal(creation.status, 201)
    const { code, hostToken } = creation.data
    const route = `/api/rooms/${code}`
    let state = (await app.request(route)).data
    assert.equal('hostToken' in state, false)
    assert.equal(state.question, null)
    assert.equal(state.answer, null)
    const voters = await Promise.all(Array.from({ length: 40 }, () => app.request(route + '/join', { method: 'POST' })))
    assert.equal(new Set(voters.map(v => v.cookie)).size, 40)
    assert.equal((await app.request(route)).data.joined, 40)
    await app.request(route + '/join', { method: 'POST', cookie: voters[0].cookie })
    assert.equal((await app.request(route)).data.joined, 40)
    const host = async action => {
      const current = (await app.request(route)).data
      const response = await app.request(route + '/host', { method: 'POST', auth: hostToken, data: { action, round: current.round, phase: current.phase } })
      assert.equal(response.status, 200); return response.data
    }
    assert.equal((await app.request(route + '/host', { method: 'POST', data: { action: 'start', round: 0, phase: 'lobby' } })).status, 401)
    await host('proof-setup')
    await host('start')
    assert.equal((await app.request(route + '/vote', { method: 'POST', data: { round: 0, valid: false } })).status, 401)
    await Promise.all(voters.map(v => app.request(route + '/vote', { method: 'POST', cookie: v.cookie, data: { round: 0, valid: false } })))
    state = (await app.request(route)).data
    assert.equal(state.voted, 40); assert.equal(state.counts, null); assert.equal(state.answer, null)
    assert.equal('valid' in state.question, false)
    await app.request(route + '/vote', { method: 'POST', cookie: voters[0].cookie, data: { round: 0, valid: true } })
    state = await host('lock')
    assert.deepEqual(state.counts, { valid: 1, broken: 39, total: 40 })
    assert.equal(state.answer, null)
    assert.equal((await app.request(route + '/vote', { method: 'POST', cookie: voters[0].cookie, data: { round: 0, valid: false } })).status, 409)
    state = await host('reveal')
    assert.equal(state.answer.valid, false); assert.deepEqual(state.score, { class: 1, traps: 0 })
    assert.equal((await app.request(route + '/host', { method: 'POST', auth: hostToken, data: { action: 'reveal', phase: 'locked', round: 0 } })).status, 409)
    await host('next')
    assert.equal((await app.request(route + '/vote', { method: 'POST', cookie: voters[1].cookie, data: { round: 0, valid: true } })).status, 409)
    await Promise.all(voters.map((v, i) => app.request(route + '/vote', { method: 'POST', cookie: v.cookie, data: { round: 1, valid: i < 20 } })))
    await host('lock'); state = await host('reveal')
    assert.deepEqual(state.score, { class: 1, traps: 1 }, 'a tied vote does not establish a correct majority')
    await host('next'); await host('lock'); state = await host('reveal')
    assert.equal(state.history[2].winner, 'none', 'empty rounds award no points')
    await host('next'); await host('lock'); await host('reveal')
    await host('next'); await host('lock'); await host('reveal')
    state = await host('finish')
    assert.equal(state.phase, 'finished')
    const qr = await app.request(route + '/qr.svg'); assert.equal(qr.status, 200); assert.match(qr.data, /<svg/)
    assert.equal((await app.request('/api/rooms/ABC234')).status, 404)
  } finally { await app.close() }
})

test('room state and host authorization survive a server restart', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'proof-votes-'))
  const statePath = path.join(directory, 'rooms.json')
  let app = await start({ statePath })
  try {
    const creation = await app.request('/api/rooms', { method: 'POST', auth: hostKey })
    const { code, hostToken } = creation.data
    const voter = await app.request(`/api/rooms/${code}/join`, { method: 'POST' })
    await app.close(); app = await start({ statePath })
    assert.equal((await app.request(`/api/rooms/${code}`)).data.joined, 1)
    assert.equal((await app.request(`/api/rooms/${code}/me`, { cookie: voter.cookie })).data.joined, true)
    assert.equal((await app.request(`/api/rooms/${code}/host`, { method: 'POST', auth: hostToken, data: { action: 'proof-setup', round: 0, phase: 'lobby' } })).status, 200)
  } finally { await app.close(); await fs.rm(directory, { recursive: true, force: true }) }
})

test('40 phones share an exact, timed hunt, then keep the same room for five proofs', async () => {
  let now = Date.now()
  const app = await start({ clock: () => now })
  try {
    const room = (await app.request('/api/rooms',{method:'POST',auth:hostKey})).data
    const route = `/api/rooms/${room.code}`
    const host = async action => { const state=(await app.request(route)).data; return app.request(route+'/host',{method:'POST',auth:room.hostToken,data:{action,round:state.round,phase:state.phase}}) }
    const voters=await Promise.all(Array.from({length:40},()=>app.request(route+'/join',{method:'POST'})))
    const guess=(n, cookie=voters[0].cookie)=>app.request(route+'/guess',{method:'POST',cookie,data:{n}})
    assert.equal((await guess('1')).status,409)
    assert.equal((await host('hunt-reveal')).status,409)
    assert.equal((await host('hunt-start')).status,200)
    const attempts=await Promise.all(voters.map((v,i)=>guess(String(i+1),v.cookie)))
    assert.ok(attempts.every(r=>r.status===200 && r.data.gcd==='1'))
    assert.equal((await guess('2')).status,429)
    now+=300
    assert.equal((await guess('1e52')).status,400)
    const secret='8424432925592889329288197322308900672459420460792433'
    const answer=await guess(secret)
    assert.equal(answer.data.found,true)
    let state=(await app.request(route)).data
    assert.equal(state.hunt.attempts,41); assert.equal(state.hunt.found,1); assert.equal(state.hunt.reveal,null)
    assert.equal((await host('proof-setup')).status,409)
    now+=60000
    assert.equal((await guess('42')).status,409)
    assert.equal((await host('hunt-reveal')).status,200)
    state=(await app.request(route)).data
    assert.equal(state.hunt.reveal.n,secret)
    await host('proof-setup')
    assert.equal((await app.request(route)).data.joined,40)
    await host('start')
    for(let round=0;round<5;round++) {
      const valid=[false,true,false,false,true][round]
      const voted=await app.request(route+'/vote',{method:'POST',cookie:voters[0].cookie,data:{round,valid}})
      assert.equal(voted.status,200)
      await host('lock'); await host('reveal')
      if(round<4) await host('next')
    }
    await host('finish'); state=(await app.request(route)).data
    assert.equal(state.totalRounds,5); assert.equal(state.score.class,5)
  } finally {await app.close()}
})

test('restarting the server preserves guesses and the original hunt deadline', async () => {
  let now = Date.now()
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'proof-hunt-'))
  const options = { statePath: path.join(directory, 'rooms.json'), clock: () => now }
  let app = await start(options)
  try {
    const room = (await app.request('/api/rooms', { method: 'POST', auth: hostKey })).data
    const route = `/api/rooms/${room.code}`
    const voter = await app.request(route + '/join', { method: 'POST' })
    const opened = await app.request(route + '/host', { method: 'POST', auth: room.hostToken, data: { action: 'hunt-start', round: 0, phase: 'lobby' } })
    const deadline = opened.data.hunt.endsAt
    const guess = await app.request(route + '/guess', { method: 'POST', cookie: voter.cookie, data: { n: '999999999999999999999999999999' } })
    assert.equal(guess.status, 200)
    now += 30000
    await app.close(); app = await start(options)
    const joined = await app.request(route + '/join', { method: 'POST', cookie: voter.cookie })
    assert.equal(joined.data.hunt.endsAt, deadline)
    assert.equal(joined.data.hunt.attempts, 1)
    assert.equal(joined.data.myHunt.last.a, guess.data.a)
    now = deadline
    assert.equal((await app.request(route + '/guess', { method: 'POST', cookie: voter.cookie, data: { n: '42' } })).status, 409)
    const reveal = await app.request(route + '/host', { method: 'POST', auth: room.hostToken, data: { action: 'hunt-reveal', round: 0, phase: 'lobby' } })
    assert.equal(reveal.status, 200)
    assert.equal(reveal.data.hunt.phase, 'revealed')
  } finally { await app.close(); await fs.rm(directory, { recursive: true, force: true }) }
})
