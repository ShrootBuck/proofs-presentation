import { createProofServer } from '../../server/server.mjs'
import { monitorEventLoopDelay } from 'node:perf_hooks'

const delay = monitorEventLoopDelay({ resolution: 20 }); delay.enable()
const server = createProofServer({ hostKey: process.env.HOST_KEY, statePath: process.env.STATE_PATH })
let peakRss = 0
const timer = setInterval(() => { peakRss = Math.max(peakRss, process.memoryUsage().rss) }, 100)
server.listen(0, '127.0.0.1', () => process.send({ origin: `http://127.0.0.1:${server.address().port}` }))
process.on('message', message => {
  if (message !== 'stop') return
  clearInterval(timer); server.closeRoomStreams()
  process.send({ peakRssMiB: Math.round(peakRss / 1024 / 1024), eventLoopP99Ms: Math.round(delay.percentile(99) / 1e6), eventLoopMaxMs: Math.round(delay.max / 1e6) })
  server.close(() => process.exit(0))
})
