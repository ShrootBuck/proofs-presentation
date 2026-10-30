import { reactive } from 'vue'

const live = reactive({ room: null as any, credentials: null as any, connected: false, error: '', busy: false, clockOffset: 0 })
let initialized = false
let stream: EventSource | null = null

function connect() {
  if (typeof window === 'undefined') return
  let credentials = null
  try { credentials = JSON.parse(localStorage.getItem('proofs-live-room') || 'null') } catch {}
  const query = new URLSearchParams(location.hash.split('?')[1] || '')
  const code = query.get('room') || credentials?.code
  if (live.credentials?.code === code && stream) return
  stream?.close(); stream = null; live.connected = false; live.room = null; live.error = ''
  live.credentials = code ? { code, hostToken: credentials?.code === code ? credentials.hostToken : null } : null
  if (!code || !/^[A-Z2-9]{6}$/.test(code)) return
  fetch(`/api/rooms/${code}`).then(async response => {
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Voting server unavailable. Open host setup or use show of hands.')
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    live.room = data
    live.clockOffset = data.serverTime - Date.now()
    stream = new EventSource(`/api/rooms/${code}/events`)
    stream.onopen = () => { live.connected = true; live.error = '' }
    stream.onerror = () => { live.connected = false; live.error = 'Reconnecting to the voting server…' }
    stream.onmessage = event => { live.room = JSON.parse(event.data); live.clockOffset = live.room.serverTime - Date.now(); live.connected = true; live.error = '' }
  }).catch(error => { live.error = error.message })
}

export function useLiveRoom() {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true; connect()
    window.addEventListener('storage', event => { if (event.key === 'proofs-live-room') connect() })
    window.addEventListener('hashchange', connect)
  }
  async function act(action: string) {
    if (live.busy || !live.room || !live.credentials?.hostToken) return
    live.busy = true; live.error = ''
    try {
      const response = await fetch(`/api/rooms/${live.room.code}/host`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${live.credentials.hostToken}` }, body: JSON.stringify({ action, round: live.room.round, phase: live.room.phase }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      live.room = data
    } catch (error: any) { live.error = error.message } finally { live.busy = false }
  }
  return { live, act }
}
