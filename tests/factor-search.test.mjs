import test from 'node:test'
import assert from 'node:assert/strict'
import { Worker } from 'node:worker_threads'
import { createFactorSearch } from '../voting/factor-search.mjs'
import { isPrime64 } from '../voting/factor.mjs'
function verify(original, state) {
  const primes = state.factors.reduce((product, f) => product * BigInt(f.prime) ** BigInt(f.exponent), 1n)
  assert.equal(primes * BigInt(state.remainder), original)
  assert.equal(state.pending.reduce((p, item) => p * BigInt(item.value), 1n), BigInt(state.remainder))
  for (const factor of state.factors) assert.ok(isPrime64(BigInt(factor.prime)))
}
test('every progressive factorization remains exact, including a composite beyond 64 bits', () => {
  for (const input of [72n, 1000003n * 1000033n, 2n ** 67n - 1n, (1000000007n * 1000000009n) ** 2n]) {
    const search = createFactorSearch(input), started = performance.now()
    while (!search.complete && performance.now() - started < 5000) { search.tick(4); verify(input, search.snapshot()) }
    assert.equal(search.complete, true)
    verify(input, search.snapshot())
  }
})
test('the worker continues beyond the old time budget and replaces its search on a new input', { timeout: 8000 }, async () => {
  const worker = new Worker(new URL('./fixtures/factor-worker-node.mjs', import.meta.url))
  const messages = []
  worker.on('message', message => messages.push(message))
  const waitFor = predicate => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { worker.off('message', listen); reject(new Error('Worker progress did not arrive')) }, 6000)
    function listen(message) { if (predicate(message)) { clearTimeout(timeout); worker.off('message', listen); resolve(message) } }
    worker.on('message', listen)
    worker.once('error', reject)
  })
  try {
    const later = waitFor(m => m.id === 1 && m.elapsed > 1.2)
    worker.postMessage({ id: 1, a: String(2n ** 127n - 1n), b: '72' })
    const progress = await later
    assert.equal(progress.running, true)
    assert.equal(progress.a.complete, false)
    assert.equal(progress.a.pending[0].status, 'probable-prime')
    assert.equal(progress.b.complete, true)
    verify(2n ** 127n - 1n, progress.a); verify(72n, progress.b)
    const replacement = waitFor(m => m.id === 2 && !m.running)
    worker.postMessage({ id: 2, a: '72', b: '50' })
    const done = await replacement
    verify(72n, done.a); verify(50n, done.b)
    assert.deepEqual(done.a.factors, [{ prime: '2', exponent: 3 }, { prime: '3', exponent: 2 }])
    await new Promise(resolve => setTimeout(resolve, 80))
    const firstNew = messages.findIndex(m => m.id === 2)
    assert.ok(messages.slice(firstNew).every(m => m.id === 2))
  } finally { await worker.terminate() }
})
