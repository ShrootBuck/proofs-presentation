import { gcd } from './integers.mjs'
const primes = []
for (let n = 2; n <= 10000; n++) if (!primes.some(p => p * p <= n && n % p === 0)) primes.push(n)
function powmod(a, n, m) { let r = 1n; for (; n; n >>= 1n, a = a * a % m) if (n & 1n) r = r * a % m; return r }
// These seven bases deterministically decide primality below 2^64.
export function isPrime64(n) {
  if (n < 2n || n >= (1n << 64n)) return false
  for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) { if (n === p) return true; if (n % p === 0n) return false }
  let d = n - 1n, s = 0
  while (!(d & 1n)) { d >>= 1n; s++ }
  return [2n, 325n, 9375n, 28178n, 450775n, 9780504n, 1795265022n].every(a => {
    if (a % n === 0n) return true
    let x = powmod(a % n, d, n)
    if (x === 1n || x === n - 1n) return true
    for (let i = 1; i < s; i++) { x = x * x % n; if (x === n - 1n) return true }
    return false
  })
}
export function factorInteger(value, budgetMs = 120) {
  const start = performance.now(), deadline = start + budgetMs
  let rest = BigInt(value)
  const verified = [], unresolved = []
  for (const p of primes) {
    const q = BigInt(p)
    while (rest % q === 0n && rest > 1n) { verified.push(q); rest /= q }
    if (q * q > rest || performance.now() > deadline) break
  }
  function split(n) {
    if (n === 1n) return
    if (performance.now() > deadline || n >= (1n << 64n)) { unresolved.push(n); return }
    if (isPrime64(n)) { verified.push(n); return }
    // Bounded Pollard rho; timeout means unknown, never "prime".
    for (let c = 1n; c < 8n; c++) {
      let x = 2n, y = 2n, d = 1n, steps = 0
      const f = z => (z * z + c) % n
      while (d === 1n) {
        x = f(x); y = f(f(y)); d = gcd(x - y, n)
        if (++steps % 32 === 0 && performance.now() > deadline) { unresolved.push(n); return }
      }
      if (d !== n) { split(d); split(n / d); return }
    }
    unresolved.push(n)
  }
  split(rest)
  verified.sort((a, b) => a < b ? -1 : a > b ? 1 : 0)
  return { factors: verified.map(String), remainder: unresolved.reduce((a, b) => a * b, 1n).toString(), complete: unresolved.length === 0 }
}
