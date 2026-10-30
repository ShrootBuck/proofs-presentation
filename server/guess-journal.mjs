import fs from 'node:fs'
import path from 'node:path'

// One input record is synced before arithmetic; its completion is synced before
// acknowledgement. An incomplete last input stays available for diagnosis and
// is never automatically recomputed after a crash.
export function createGuessJournal(filePath, { limit = 32 * 1024 * 1024, recover = () => {} } = {}) {
  let sequence = 0, bytes = 0, fd = null, ready = true
  if (filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    if (fs.existsSync(filePath)) {
      bytes = fs.statSync(filePath).size
      if (bytes > limit) ready = false
      else {
        const buffer = fs.readFileSync(filePath)
        const end = buffer.lastIndexOf(10) + 1
        if (end < buffer.length) { fs.truncateSync(filePath, end); bytes = end }
        let input = null
        for (const line of buffer.subarray(0, end).toString('utf8').split('\n')) {
          if (!line) continue
          let entry
          try { entry = JSON.parse(line) } catch { ready = false; break }
          sequence = Math.max(sequence, entry.sequence || 0)
          if (entry.kind === 'input') input = entry
          if (entry.kind === 'result' && input?.sequence === entry.sequence && input.room === entry.room) { recover(input, entry); input = null }
        }
      }
    }
    fd = fs.openSync(filePath, 'a', 0o600)
  }
  const unavailable = () => Object.assign(new Error('The guess log is unavailable or full. The host needs to archive it before continuing.'), { status: 503 })
  function write(record) {
    if (!filePath) return
    if (!ready) throw unavailable()
    const line = Buffer.from(JSON.stringify(record) + '\n')
    try {
      if (bytes + line.length > limit) throw unavailable()
      let offset = 0
      while (offset < line.length) offset += fs.writeSync(fd, line, offset, line.length - offset)
      fs.fsyncSync(fd)
      bytes += line.length
    } catch { ready = false; throw unavailable() }
  }
  return {
    status: () => ({ durable: Boolean(filePath), ready: ready && (!filePath || bytes + 2048 <= limit) }),
    begin(input) {
      if (!ready || filePath && bytes + 2048 > limit) throw unavailable()
      const record = { kind: 'input', sequence: ++sequence, ...input }
      write(record); return record
    },
    finish(input, result) { write({ kind: 'result', sequence: input.sequence, room: input.room, gcd: result.gcd, found: result.found }) },
    readRoom(code) {
      if (!filePath || bytes > limit) return ''
      return fs.readFileSync(filePath, 'utf8').split('\n').filter(line => {
        try { return JSON.parse(line).room === code } catch { return false }
      }).join('\n') + '\n'
    },
    close() { if (fd !== null) { fs.closeSync(fd); fd = null } },
  }
}
