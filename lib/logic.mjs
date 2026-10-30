export function isPrime(n) {
  if (!Number.isSafeInteger(n) || n < 2) return false
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false
  return true
}

export function primePolynomial(n) {
  return n * n + n + 41
}

export function factorPair(n) {
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return [d, n / d]
  return null
}

export const implies = (p, q) => !p || q

export const gameRounds = [
  {
    title: 'A small problem with arithmetic',
    claim: '1=2',
    lines: [
      'a=b=1',
      'a^2=ab',
      'a^2-b^2=ab-b^2',
      '(a-b)(a+b)=b(a-b)',
      'a+b=b \\quad\\Longrightarrow\\quad 2=1',
    ],
    valid: false,
    badLine: 4,
    verdict: 'Division by zero',
    explanation: 'Since a = b, the canceled factor a − b is zero. The last step is illegal.',
  },
  {
    title: 'Three in a row',
    claim: '3\\mid(n^3-n)\\quad\\text{for every integer }n',
    lines: [
      'n^3-n=n(n^2-1)',
      'n(n^2-1)=(n-1)n(n+1)',
    ],
    prose: 'These are three consecutive integers. One is a multiple of 3, so their product is a multiple of 3.',
    valid: true,
    badLine: -1,
    verdict: 'The proof holds',
    explanation: 'Three consecutive integers cover all three remainders modulo 3. This also works for zero and negative integers.',
  },
  {
    title: 'Induction with a missing ingredient',
    claim: 'n=n+1\\quad\\text{for every integer }n\\geq1',
    lines: [
      '\\text{Assume }k=k+1.',
      '\\text{Add 1: }k+1=k+2.',
      '\\text{Therefore, }n=n+1\\text{ for all }n\\geq1.',
    ],
    valid: false,
    badLine: 2,
    verdict: 'No base case',
    explanation: 'The conditional step is valid, but P(1) says 1 = 2. A chain of implications cannot start itself.',
  },
  {
    title: 'A true answer, a wrong direction',
    claim: 'n^2\\text{ even}\\;\\Longrightarrow\\;n\\text{ even}\\quad(n\\in\\mathbb Z)',
    lines: [
      '\\text{Let }n\\text{ be even, so }n=2k.',
      'n^2=4k^2=2(2k^2)\\text{ is even.}',
      '\\text{Therefore, if }n^2\\text{ is even, }n\\text{ is even.}',
    ],
    valid: false, badLine: 2, verdict: 'The converse is not the proof',
    explanation: 'The claim is true, but this proves the reverse direction. Starting by assuming n is even does not establish that it must be even.',
  },
  {
    title: 'An existence proof with a twist',
    claim: '\\exists\\text{ irrational }a,b>0\\text{ such that }a^b\\in\\mathbb Q',
    lines: [
      'x=(\\sqrt2)^{\\sqrt2}.',
      'x\\in\\mathbb Q:\\quad a=b=\\sqrt2.',
      'x\\notin\\mathbb Q:\\quad a=x,\\;b=\\sqrt2.',
      'x^{\\sqrt2}=(\\sqrt2)^{\\sqrt2\\cdot\\sqrt2}=2.',
    ],
    prose: 'Either x is rational or it is irrational. In both cases, the required a and b exist.',
    valid: true, badLine: -1, verdict: 'Both cases give a witness',
    explanation: 'We do not need to decide which case holds. The cases exhaust the possibilities, and each supplies irrational a and b with a rational power.',
  },

]
