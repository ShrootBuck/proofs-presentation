// Requests may finish on the server even when the phone loses the response.
// Never automatically replay a mutation; resync first and let the user retry.
export async function requestJSON(url, options = {}, { timeout = 12000, fetcher = fetch } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetcher(url, { ...options, cache: 'no-store', signal: controller.signal })
    const data = await response.json().catch(() => null)
    if (!response.ok) throw Object.assign(new Error(data?.error || `Request failed (${response.status}). Try again.`), { status: response.status, uncertain: response.status >= 500 })
    if (!data || typeof data !== 'object') throw new Error('Invalid response')
    return data
  } catch (error) {
    if (error.status) throw error
    throw Object.assign(new Error('Connection interrupted. Reconnecting to check whether your action saved.'), { uncertain: true })
  } finally { clearTimeout(timer) }
}

export const readSaved = key => { try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null } }
export const writeSaved = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false } }
export const isNewerState = (current, next) => !current || current.code !== next.code || (next.revision ?? 0) >= (current.revision ?? 0)

export function watchRoom(code, { onState, onConnection, onMissing }, env = {}) {
  const request = env.request || requestJSON
  const Source = env.EventSource || EventSource
  const page = env.document || document, win = env.window || window
  const interval = env.setInterval || setInterval, clear = env.clearInterval || clearInterval
  let source, stopped = false, pending = null, latest = null
  const report = status => { if (!stopped) onConnection(status) }
  function accept(state) {
    if (stopped || !isNewerState(latest, state)) return
    latest = state; onState(state); report('live')
  }
  async function sync() {
    if (stopped || pending) return pending
    pending = (async () => {
      try { accept(await request(`/api/rooms/${code}`)) }
      catch (error) {
        if (stopped) return
        if (error.status === 404) { stop(); onMissing(error.message) }
        else report('reconnecting')
      } finally { pending = null }
    })()
    return pending
  }
  function openStream() {
    source?.close()
    if (stopped) return
    try {
      source = new Source(`/api/rooms/${code}/events`)
      source.onmessage = event => { try { accept(JSON.parse(event.data)) } catch { void sync() } }
      source.onopen = () => { void sync() }
      source.onerror = () => { report('reconnecting'); void sync() }
    } catch { report('reconnecting') }
  }
  function wake() {
    if (page.visibilityState === 'hidden' || stopped) return
    report('connecting'); openStream(); void sync()
  }
  const offline = () => report('reconnecting')
  const poll = interval(() => { if (page.visibilityState !== 'hidden') void sync() }, 5000)
  page.addEventListener('visibilitychange', wake)
  win.addEventListener('pageshow', wake); win.addEventListener('online', wake); win.addEventListener('offline', offline)
  function stop() {
    stopped = true; source?.close(); clear(poll)
    page.removeEventListener('visibilitychange', wake)
    win.removeEventListener('pageshow', wake); win.removeEventListener('online', wake); win.removeEventListener('offline', offline)
  }
  report('connecting'); openStream(); void sync()
  return { sync, close: stop }
}
