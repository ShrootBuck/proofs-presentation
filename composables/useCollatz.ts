import { reactive } from 'vue'

const state = reactive({ verified: '0', error: false })
let worker: Worker | undefined
export function startCollatz() {
  if (worker || typeof window === 'undefined') return
  try {
    worker = new Worker(new URL('../workers/collatz.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }) => { state.verified = data.verified }
    worker.onerror = () => { state.error = true; worker?.terminate() }
  } catch { state.error = true }
}
export function useCollatz() { return state }
if (import.meta.hot) import.meta.hot.dispose(() => worker?.terminate())
