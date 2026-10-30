import test from 'node:test'
import assert from 'node:assert/strict'
import { requestJSON, watchRoom, isNewerState } from '../voting/connection.mjs'

test('requests time out instead of leaving controls disabled forever, and are never auto-replayed', async () => {
  let calls = 0
  await assert.rejects(requestJSON('/example', { method: 'POST' }, { timeout: 10, fetcher: (_, { signal }) => {
    calls++
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))
  } }), error => error.uncertain === true)
  assert.equal(calls, 1)
})
test('request errors distinguish rejected actions from uncertain network outcomes', async () => {
  await assert.rejects(requestJSON('/example', {}, { fetcher: async () => new Response(JSON.stringify({ error: 'Voting closed' }), { status: 409 }) }), error => error.status === 409 && error.message === 'Voting closed')
  await assert.rejects(requestJSON('/example', {}, { fetcher: async () => new Response('<html>Proxy error</html>', { status: 502 }) }), error => error.status === 502 && error.uncertain === true)
  assert.equal(isNewerState({ code: 'ABC234', revision: 5 }, { code: 'ABC234', revision: 4 }), false)
})
function fixture() {
  const page = new EventTarget(); page.visibilityState = 'visible'
  const win = new EventTarget(), sources = [], states = [], connections = []
  let data = { code: 'ABC234', revision: 1, activity: 'hunt', myVote: null }, polls = 0, tick, missing
  class Source {
    constructor() { sources.push(this) }
    close() { this.closed = true }
    send(state) { this.onmessage?.({ data: JSON.stringify(state) }) }
  }
  const room = watchRoom('ABC234', { onState: state => states.push(state), onConnection: status => connections.push(status), onMissing: error => { missing = error } }, {
    document: page, window: win, EventSource: Source,
    setInterval: callback => { tick = callback; return 1 }, clearInterval: () => { tick = null },
    request: async () => { polls++; if (data instanceof Error) throw data; return data },
  })
  return { page, win, room, sources, states, connections, update: value => { data = value }, tick: () => tick?.(), get polls() { return polls }, get missing() { return missing } }
}
const settle = () => new Promise(resolve => setImmediate(resolve))
test('a phone waking after activity changes restores current activity and personal state', async () => {
  const f = fixture()
  try {
    await settle()
    f.page.visibilityState = 'hidden'; f.page.dispatchEvent(new Event('visibilitychange'))
    const polls = f.polls; f.tick(); await settle(); assert.equal(f.polls, polls)
    f.update({ code: 'ABC234', revision: 8, activity: 'proof', round: 3, myVote: false, myName: 'Player' })
    f.page.visibilityState = 'visible'; f.page.dispatchEvent(new Event('visibilitychange'))
    await settle()
    assert.equal(f.sources[0].closed, true)
    assert.equal(f.states.at(-1).activity, 'proof')
    assert.equal(f.states.at(-1).round, 3)
    assert.equal(f.states.at(-1).myVote, false)
    assert.equal(f.connections.at(-1), 'live')
    // An HTTP response/event that started before the new round cannot rewind it.
    f.sources.at(-1).send({ code: 'ABC234', revision: 2, activity: 'hunt' })
    assert.equal(f.states.at(-1).revision, 8)
  } finally { f.room.close() }
})
test('polling recovers when SSE stops delivering, offline does not submit anything, and expiry ends reconnects', async () => {
  const f = fixture()
  try {
    await settle(); f.win.dispatchEvent(new Event('offline'))
    assert.equal(f.connections.at(-1), 'reconnecting')
    f.update({ code: 'ABC234', revision: 10, activity: 'proof' }); f.tick(); await settle()
    assert.equal(f.states.at(-1).revision, 10)
    f.update(Object.assign(new Error('Room expired'), { status: 404 })); f.tick(); await settle()
    assert.equal(f.missing, 'Room expired')
    assert.equal(f.sources.at(-1).closed, true)
    const calls = f.polls; f.win.dispatchEvent(new Event('online')); f.tick(); await settle(); assert.equal(f.polls, calls)
  } finally { f.room.close() }
})
