import { gcd } from './integers.mjs'
import { isPrime64 } from './factor.mjs'

const sieve = []
for (let n = 2; n <= 10000; n++) {
  if (!sieve.some(p => p * p <= n && n % p === 0)) sieve.push(n)
}
const smallPrimes = sieve.map(BigInt)
function* powmod(a, n, m) {
  let value = 1n, steps = 0
  for (; n; n >>= 1n, a = a * a % m) {
    if (n & 1n) value = value * a % m
    if (++steps % 16 === 0) yield
  }
  return value
}
function* probablePrime(n) {
  let d = n - 1n, s = 0
  while (!(d & 1n)) { d >>= 1n; s++ }
  for (const a of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    let x = yield* powmod(a, d, n)
    if (x === 1n || x === n - 1n) continue
    let passed = false
    for (let r = 1; r < s; r++) {
      x = x * x % n
      if (x === n - 1n) { passed = true; break }
      yield
    }
    if (!passed) return false
  }
  return true
}
function sqrt(n) {
  let x = 1n << BigInt(Math.ceil(n.toString(2).length / 2))
  for (;;) { const next = (x + n / x) / 2n; if (next >= x) return x; x = next }
}
// Each retry has bounded state and yields frequently. A hard cofactor can keep
// searching indefinitely without growing a queue of trial candidates.
function* rho(n, attempt) {
  const c = (attempt * attempt + 1n) % (n - 1n) + 1n
  let x = (attempt + 2n) % n, y = x
  const f = z => (z * z + c) % n
  for (let step = 0; step < 20000; step++) {
    x = f(x); y = f(f(y))
    const factor = gcd(x - y, n)
    if (factor > 1n) return factor === n ? null : factor
    yield
  }
  return null
}

export function createFactorSearch(input) {
  const value = BigInt(input)
  if (value < 2n) throw new Error('Factor searches require an integer at least 2.')
  const verified = new Map(), jobs = []
  let cursor = 0, version = 0, steps = 0
  const record = p => { verified.set(p, (verified.get(p) || 0) + 1); version++ }
  function* search(job) {
    for (const p of smallPrimes) {
      while (job.value % p === 0n) { job.value /= p; record(p) }
      if (p * p > job.value) break
      yield
    }
    if (job.value === 1n) return []
    if (job.value < (1n << 64n) && isPrime64(job.value)) { record(job.value); return [] }
    const root = sqrt(job.value)
    if (root * root === job.value) return [root, root]
    job.status = job.value < (1n << 64n) || !(yield* probablePrime(job.value)) ? 'composite' : 'probable-prime'
    version++
    for (let attempt = 1n; ; attempt++) {
      const factor = yield* rho(job.value, attempt)
      if (factor) return [factor, job.value / factor]
      yield
    }
  }
  function add(n) {
    const job = { value: n, status: 'checking' }
    job.iterator = search(job); jobs.push(job)
  }
  add(value)
  return {
    tick(budgetMs = 8) {
      const deadline = performance.now() + budgetMs
      while (jobs.length && performance.now() < deadline) {
        cursor %= jobs.length
        const result = jobs[cursor].iterator.next(); steps++
        if (result.done) { jobs.splice(cursor, 1); for (const n of result.value) add(n); version++ }
        else cursor++
      }
    },
    get complete() { return jobs.length === 0 },
    snapshot() {
      const factors = [...verified].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([prime, exponent]) => ({ prime: String(prime), exponent }))
      const pending = jobs.map(j => ({ value: String(j.value), status: j.status }))
      return { factors, pending, remainder: jobs.reduce((p, j) => p * j.value, 1n).toString(), complete: !jobs.length, version, steps }
    },
  }
}
