// Verify a contiguous prefix with exact arithmetic and constant-size state.
// Reaching a smaller, already-verified start is enough to certify this start.
let verified = 1n
let candidate = 2n
let value = candidate
let lastReport = 0
function tick() {
  const deadline = performance.now() + 12
  do {
    for (let i = 0; i < 256; i++) {
      if (value <= verified) {
        verified = candidate
        candidate += 1n
        value = candidate
      } else {
        value = value % 2n === 0n ? value / 2n : 3n * value + 1n
      }
    }
  } while (performance.now() < deadline)
  if (performance.now() - lastReport >= 250) {
    postMessage({ verified: verified.toString() })
    lastReport = performance.now()
  }
  // Yield between batches; no overall timeout or guessed progress.
  setTimeout(tick, 20)
}
tick()
