import { reactive } from 'vue'
import { watchRoom, requestJSON, readSaved, isNewerState } from '../voting/connection.mjs'

const live = reactive({ room: null as any, credentials: null as any, connected: false, error: '', busy: false, clockOffset: 0 })
let initialized = false
let stream: ReturnType<typeof watchRoom> | null = null
let generation = 0

function receive(data: any) {
  if (!isNewerState(live.room, data)) return
  live.room = data
  live.clockOffset = data.serverTime - Date.now()
}

function connect() {
  if (typeof window === 'undefined') return
  const credentials = readSaved('proofs-live-room')
  const query = new URLSearchParams(location.hash.split('?')[1] || '')
  const requested = query.get('room') || credentials?.code
  const code = typeof requested === 'string' && /^[A-Z2-9]{6}$/.test(requested) ? requested : null
  const hostToken = credentials?.code === code ? credentials.hostToken : null
  if (live.credentials?.code === code && live.credentials?.hostToken === hostToken && stream) return
  const current = ++generation
  stream?.close(); stream = null; live.connected = false; live.room = null; live.error = ''
  live.credentials = code ? { code, hostToken } : null
  if (!code) return
  stream = watchRoom(code, {
    onState(data: any) { if (current === generation) receive(data) },
    onConnection(status: string) {
      if (current !== generation) return
      live.connected = status === 'live'
      if (live.connected) {
        if (live.error === 'Reconnecting to the voting server…') live.error = ''
      } else live.error = 'Reconnecting to the voting server…'
    },
    onMissing(message: string) {
      if (current !== generation) return
      live.connected = false; live.room = null; stream = null; live.error = message
    },
  })
}

export function useLiveRoom() {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true; connect()
    window.addEventListener('storage', event => { if (event.key === 'proofs-live-room') connect() })
    window.addEventListener('hashchange', connect)
  }
  async function act(action: string) {
    if (live.busy || !live.connected || !live.room || !live.credentials?.hostToken) return
    const current = generation, room = live.room, credentials = live.credentials
    live.busy = true; live.error = ''
    try {
      const data = await requestJSON(`/api/rooms/${room.code}/host`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${credentials.hostToken}` }, body: JSON.stringify({ action, round: room.round, phase: room.phase, activity: room.activity, huntPhase: room.hunt.phase, controlRevision: room.controlRevision }) })
      if (current === generation) receive(data)
    } catch (error: any) {
      if (current === generation) { live.error = error.message; void stream?.sync() }
    } finally { live.busy = false }
  }
  return { live, act }
}

if (import.meta.hot) import.meta.hot.dispose(() => stream?.close())
