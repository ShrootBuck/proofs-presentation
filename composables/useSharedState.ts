import { reactive, watch } from 'vue'

const stores = new Map<string, object>()

/** Same-browser audience and presenter windows share the live demos. */
export function useSharedState<T extends object>(name: string, defaults: T): T {
  const key = `prove-it-v1:${name}`
  if (stores.has(key)) return stores.get(key) as T
  let saved = {}
  try { saved = JSON.parse(localStorage.getItem(key) || '{}') } catch {}
  const state = reactive({ ...defaults, ...saved }) as T
  stores.set(key, state)
  let receiving = false
  watch(state, () => {
    if (receiving) return
    try { localStorage.setItem(key, JSON.stringify(state)) } catch {}
  }, { deep: true, flush: 'sync' })
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== key) return
      try {
        receiving = true
        Object.assign(state, defaults, JSON.parse(event.newValue || '{}'))
      } finally { receiving = false }
    })
  }
  return state
}
