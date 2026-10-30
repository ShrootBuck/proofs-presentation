import { createFactorSearch } from './factor-search.mjs'
let generation = 0
self.onmessage = async ({ data }) => {
  const current = ++generation, start = performance.now()
  try {
    const a = createFactorSearch(data.a), b = createFactorSearch(data.b)
    let last = -Infinity, versions = ''
    while (current === generation) {
      a.tick(8); b.tick(8)
      const now = performance.now(), nextA = a.snapshot(), nextB = b.snapshot()
      const nextVersions = `${nextA.version}:${nextB.version}`
      const running = !a.complete || !b.complete
      if (!running || now - last > 500 || nextVersions !== versions && now - last > 80) {
        self.postMessage({ id: data.id, a: nextA, b: nextB, elapsed: (now - start) / 1000, running })
        last = now; versions = nextVersions
      }
      if (!running) break
      await new Promise(resolve => setTimeout(resolve, 16))
    }
  } catch { self.postMessage({ id: data.id, error: 'Factorization unavailable. The exact shared-factor result above is unaffected.' }) }
}
