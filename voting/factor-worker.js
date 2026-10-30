import { factorInteger } from './factor.mjs'
self.onmessage = ({ data }) => {
  try { self.postMessage({ id: data.id, a: factorInteger(data.a), b: factorInteger(data.b) }) }
  catch { self.postMessage({ id: data.id, error: 'Factorization unavailable. The exact shared-factor result above is unaffected.' }) }
}
