import test from 'node:test'
import assert from 'node:assert/strict'
import { fork } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { exerciseClassroom } from '../scripts/classroom-load.mjs'

test('80 simultaneous phones complete both games on a separate server with a 128 MiB JS heap', { timeout: 60000 }, async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'proof-load-'))
  const hostKey = 'classroom-load-test-secret'
  const child = fork(new URL('./fixtures/classroom-server.mjs', import.meta.url), [], {
    execArgv: ['--max-old-space-size=128'], env: { ...process.env, HOST_KEY: hostKey, STATE_PATH: path.join(directory, 'rooms.json') }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  })
  child.stderr.on('data', chunk => process.stderr.write(chunk))
  try {
    const [{ origin }] = await once(child, 'message')
    const report = await exerciseClassroom({ origin, hostKey, players: 80, waves: 10 })
    const metrics = once(child, 'message'), exit = once(child, 'exit'); child.send('stop')
    const [resource] = await metrics
    const [code] = await exit; assert.equal(code, 0)
    assert.ok(resource.peakRssMiB < 256, `RSS ${resource.peakRssMiB} MiB`)
    assert.ok(report.timings.health.maxMs < 2500, `Health took ${report.timings.health.maxMs}ms`)
    console.log('80-player separate-process load:', JSON.stringify({ ...report, ...resource }))
  } finally { if (child.exitCode === null) child.kill('SIGKILL'); await fs.rm(directory, { recursive: true, force: true }) }
})
