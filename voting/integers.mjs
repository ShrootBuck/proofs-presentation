// Native BigInt: exact, arbitrary-precision integer arithmetic throughout.
export function gcd(a, b) {
  a = a < 0n ? -a : a; b = b < 0n ? -b : b
  while (b) [a, b] = [b, a % b]
  return a
}
export function evaluateGuess(input) {
  const text = String(input).trim()
  if (!/^\d{1,100}$/.test(text)) throw new Error('Enter a nonnegative whole number, using at most 100 digits. No decimals or exponents.')
  const n = BigInt(text)
  const a = n ** 17n + 9n, b = (n + 1n) ** 17n + 9n
  const common = gcd(a, b)
  return { n: n.toString(), a: a.toString(), b: b.toString(), gcd: common.toString(), found: common > 1n }
}
