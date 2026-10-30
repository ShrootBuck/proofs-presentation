import test from 'node:test'
import assert from 'node:assert/strict'
import { isPrime, primePolynomial, factorPair, implies, gameRounds } from '../lib/logic.mjs'

test('the optional Euler-polynomial demo has forty prime outputs, followed by 41 squared', () => {
  assert.equal(Array.from({ length: 40 }, (_, n) => isPrime(primePolynomial(n))).every(Boolean), true)
  assert.equal(primePolynomial(39), 1601)
  assert.equal(primePolynomial(40), 41 ** 2)
  assert.deepEqual(factorPair(primePolynomial(40)), [41, 41])
  assert.equal(isPrime(primePolynomial(40)), false)
  for (const n of [-1, 0, 1, 4, 9, 49, 1681]) assert.equal(isPrime(n), false)
  for (const n of [2, 3, 5, 41, 1601]) assert.equal(isPrime(n), true)
})

test('the implication lab rejects exactly the true / false combination', () => {
  const rows = [[true, true], [true, false], [false, true], [false, false]]
  assert.deepEqual(rows.map(([p, q]) => implies(p, q)), [true, false, true, true])
  for (const [p, q] of rows) assert.equal(implies(p, q), implies(!q, !p))
})

test('the game contains the intended verdicts, and highlights an actual line', () => {
  assert.deepEqual(gameRounds.map(round => round.valid), [false, true, false, false, true])
  for (const round of gameRounds.filter(round => !round.valid)) {
    assert.ok(round.badLine >= 0 && round.badLine < round.lines.length)
  }
})

import { evaluateGuess, COUNTEREXAMPLE, SHARED_FACTOR } from '../lib/hunt.mjs'
import { factorInteger, isPrime64 } from '../voting/factor.mjs'

test('the published 52-digit counterexample is verified exactly, including neighboring inputs', () => {
  const result = evaluateGuess(COUNTEREXAMPLE)
  assert.equal(result.gcd, SHARED_FACTOR)
  assert.equal(BigInt(result.a) % BigInt(result.gcd), 0n)
  assert.equal(BigInt(result.b) % BigInt(result.gcd), 0n)
  for (const n of ['0', '1', '100000000000000000000000000000000000000000000', String(BigInt(COUNTEREXAMPLE)-1n), String(BigInt(COUNTEREXAMPLE)+1n)]) assert.equal(evaluateGuess(n).gcd,'1')
  assert.equal(evaluateGuess('0007').n, '7')
  for (const input of ['-1', '1.5', '1e52', '9'.repeat(101), '', 'Infinity']) assert.throws(()=>evaluateGuess(input))
})
test('prime factors are certified and multiply back exactly, even when factorization is incomplete', () => {
  for (const n of [2n, 97n, 18446744073709551557n]) assert.equal(isPrime64(n),true)
  for (const n of [1n, 341550071728321n, 3825123056546413051n, 18446744073709551615n]) assert.equal(isPrime64(n),false)
  for (const value of ['10','131081',String(2n**20n*3n**4n),String(1000003n*1000033n),evaluateGuess(COUNTEREXAMPLE).a]) {
    const f=factorInteger(value)
    assert.equal(f.factors.reduce((a,b)=>a*BigInt(b),BigInt(f.remainder)),BigInt(value))
    assert.ok(f.factors.every(p=>isPrime64(BigInt(p))))
    if(f.complete) assert.equal(f.remainder,'1')
  }
  assert.equal(factorInteger(evaluateGuess(COUNTEREXAMPLE).a).complete,false)
})
