import http from 'node:http'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'
import { gameRounds } from '../lib/logic.mjs'
import { evaluateGuess, COUNTEREXAMPLE, SHARED_FACTOR, HUNT_DURATION } from '../lib/hunt.mjs'
import { normalizeInput } from '../voting/integers.mjs'
import { createGuessJournal } from './guess-journal.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const hash = text => crypto.createHash('sha256').update(text).digest('hex')
const safeEqual = (a, b) => crypto.timingSafeEqual(Buffer.from(hash(a || '')), Buffer.from(hash(b || '')))
const token = () => crypto.randomBytes(32).toString('base64url')
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.json': 'application/json' }
const TTL = 4 * 60 * 60 * 1000

export function createProofServer({ hostKey, publicUrl = 'http://localhost:3040', statePath, allowedOrigins = [], clock = Date.now, journalLimit } = {}) {
  if (!hostKey || hostKey.length < 10) throw new Error('HOST_KEY must contain at least 10 characters.')
  const origin = new URL(publicUrl).origin
  const origins = new Set([origin, ...allowedOrigins])
  const rooms = new Map()
  const streams = new Map()
  const rates = new Map()
  const voteRates = new Map()
  let persistTimer = null
  const pendingBroadcasts = new Map()
  if (statePath && fs.existsSync(statePath)) {
    for (const room of JSON.parse(fs.readFileSync(statePath, 'utf8'))) {
      if (room.version === 3 && room.expiresAt > clock()) {
        room.revision ||= 0; room.controlRevision ||= 0
        rooms.set(room.code, room)
      }
    }
  }
  function persist() {
    clearTimeout(persistTimer); persistTimer = null
    if (!statePath) return
    fs.mkdirSync(path.dirname(statePath), { recursive: true })
    const fd = fs.openSync(`${statePath}.tmp`, 'w', 0o600)
    try { fs.writeFileSync(fd, JSON.stringify([...rooms.values()])); fs.fsyncSync(fd) } finally { fs.closeSync(fd) }
    fs.renameSync(`${statePath}.tmp`, statePath)
  }
  function recordGuess(room, input, result) {
    const player = room.hunt.players[input.player] || { attempts: 0, found: false, lastAt: 0, last: null }
    player.attempts++; player.lastAt = input.receivedAt
    player.last = { ...result, receipt: input.sequence, requestId: input.requestId || null }
    if (result.found && !player.found) { player.found = true; room.hunt.found++ }
    room.hunt.players[input.player] = player; room.hunt.attempts++
    room.hunt.maxDigits = Math.max(room.hunt.maxDigits || 0, result.n.length)
    room.hunt.lastSequence = input.sequence
    room.hunt.recent.unshift({ n: result.n, gcd: result.gcd, found: result.found, name: input.name, receipt: input.sequence })
    room.hunt.recent = room.hunt.recent.slice(0, 6)
    room.revision = (room.revision || 0) + 1
    return player
  }
  const journal = createGuessJournal(statePath ? path.join(path.dirname(statePath), 'guesses.jsonl') : null, {
    limit: journalLimit,
    recover(input) {
      const room = rooms.get(input.room)
      if (room?.participants[input.player] && input.sequence > (room.hunt.lastSequence || 0)) recordGuess(room, input, evaluateGuess(input.n))
    },
  })
  function deferGuessSave(room) {
    if (statePath && !persistTimer) {
      persistTimer = setTimeout(() => { try { persist() } catch (error) { console.error('Room snapshot failed:', error.code) } }, 500)
      persistTimer.unref()
    }
    scheduleBroadcast(room)
  }
  // A classroom can submit together. Persist each acknowledgement, but send
  // at most ten roster/tally updates per second instead of one per student.
  function scheduleBroadcast(room) {
    if (!pendingBroadcasts.has(room.code)) {
      const timer = setTimeout(() => { pendingBroadcasts.delete(room.code); broadcast(room) }, 100)
      timer.unref(); pendingBroadcasts.set(room.code, timer)
    }
  }
  function counts(room, round = room.round) {
    const values = Object.values(room.votes[round])
    return { valid: values.filter(Boolean).length, broken: values.filter(v => !v).length, total: values.length }
  }
  function result(room, round) {
    const tally = counts(room, round)
    const correct = gameRounds[round].valid ? tally.valid : tally.broken
    return { ...tally, correct, winner: !tally.total ? 'none' : correct > tally.total / 2 ? 'class' : 'traps' }
  }
  function snapshot(room, voterId, shared) {
    if (shared) return { ...shared, joinedAsPlayer: Boolean(voterId && room.participants[voterId]),
      ...(voterId ? { myName: room.participants[voterId]?.name || null, myVote: room.votes[room.round][voterId] ?? null, myHunt: room.hunt.players[voterId] || null } : {}) }
    const { title, claim, lines, prose } = gameRounds[room.round]
    const visible = ['locked', 'revealed', 'finished'].includes(room.phase)
    const revealed = ['revealed', 'finished'].includes(room.phase)
    const history = room.scored.map((scored, index) => scored ? result(room, index) : null)
    return {
      code: room.code, activity: room.activity, revision: room.revision || 0, controlRevision: room.controlRevision || 0, serverTime: clock(),
      joinedAsPlayer: Boolean(voterId && room.participants[voterId]),
      ...(voterId ? { myName: room.participants[voterId]?.name || null, myVote: room.votes[room.round][voterId] ?? null, myHunt: room.hunt.players[voterId] || null } : {}),
      logging: journal.status(),
      participants: Object.entries(room.participants).map(([id, p]) => ({ name: p.name, attempts: room.hunt.players[id]?.attempts || 0,
        points: room.scored.reduce((sum, scored, i) => sum + (scored && room.votes[i][id] === gameRounds[i].valid ? 1 : 0), 0),
        voted: typeof room.votes[room.round][id] === 'boolean' })),
      hunt: { phase: room.hunt.phase, endsAt: room.hunt.endsAt, remainingMs: room.hunt.remainingMs || 0, attempts: room.hunt.attempts, found: room.hunt.found, recent: room.hunt.recent, maxDigits: room.hunt.maxDigits || 0,
        reveal: room.hunt.phase === 'revealed' ? { n: COUNTEREXAMPLE, gcd: SHARED_FACTOR } : null },
      phase: room.phase, round: room.round, totalRounds: gameRounds.length,
      joined: Object.keys(room.participants).length, voted: counts(room).total,
      question: room.phase === 'lobby' ? null : { title, claim, lines, prose },
      counts: visible ? counts(room) : null,
      answer: revealed ? { valid: gameRounds[room.round].valid, verdict: gameRounds[room.round].verdict, explanation: gameRounds[room.round].explanation, badLine: gameRounds[room.round].badLine } : null,
      history,
      score: { class: history.filter(r => r?.winner === 'class').length, traps: history.filter(r => r?.winner === 'traps').length },
      joinUrl: `${origin}/join/${room.code}`, expiresAt: room.expiresAt,
    }
  }
  function broadcast(room) {
    clearTimeout(pendingBroadcasts.get(room.code)); pendingBroadcasts.delete(room.code)
    const clients = streams.get(room.code)
    if (!clients?.size) return
    const shared = snapshot(room)
    for (const client of clients) {
      if (client.destroyed || client.writableEnded) { clients.delete(client); continue }
      if (client.writableLength > 64 * 1024) client.destroy()
      else client.write(`data: ${JSON.stringify(snapshot(room, client.voterId, shared))}\n\n`)
    }
  }
  // Save before broadcasting success. A failed disk write must not leave an
  // unacknowledged action active in memory (especially a timer or vote lock).
  function mutate(room, update, control = false) {
    const before = structuredClone(room)
    try {
      update()
      room.revision = (room.revision || 0) + 1
      if (control) room.controlRevision = (room.controlRevision || 0) + 1
      persist()
    } catch (error) {
      for (const key of Object.keys(room)) delete room[key]
      Object.assign(room, before)
      if (error.status) throw error
      console.error('Room save failed:', error.code)
      fail(503, 'Could not save this action. Try again; the room has not changed.')
    }
    if (control) broadcast(room)
    else scheduleBroadcast(room)
  }
  function checkControl(room, data) {
    if (data.controlRevision !== undefined && data.controlRevision !== (room.controlRevision || 0)) fail(409, 'The activity changed. Your screen will refresh; try again.')
  }
  function json(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }
  function fail(status, message) { throw Object.assign(new Error(message), { status }) }
  async function body(req) {
    if (Number(req.headers['content-length'] || 0) > 4096) fail(413, 'Request too large.')
    const timeout = setTimeout(() => req.destroy(), 5000)
    timeout.unref()
    const chunks = []
    let bytes = 0
    try {
      for await (const chunk of req) {
        bytes += chunk.length
        if (bytes > 4096) fail(413, 'Request too large.')
        chunks.push(chunk)
      }
    } finally { clearTimeout(timeout) }
    try {
      const data = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
      if (!data || typeof data !== 'object' || Array.isArray(data)) fail(400, 'Expected a JSON object.')
      return data
    } catch { fail(400, 'Invalid JSON object.') }
  }
  function getVoter(req) {
    const cookie = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('proofs_voter='))?.slice(13)
    if (!cookie) return null
    const [id, signature] = cookie.split('.')
    if (!id || !signature) return null
    const expected = crypto.createHmac('sha256', hostKey).update(id).digest('base64url')
    return safeEqual(signature, expected) ? id : null
  }
  function setVoter(res) {
    const id = crypto.randomUUID()
    const signature = crypto.createHmac('sha256', hostKey).update(id).digest('base64url')
    res.setHeader('Set-Cookie', `proofs_voter=${id}.${signature}; HttpOnly; SameSite=Strict; Path=/; Max-Age=14400${origin.startsWith('https:') ? '; Secure' : ''}`)
    return id
  }
  function serve(res, directory, relative) {
    const base = path.resolve(directory)
    const resolved = path.resolve(base, relative)
    if (!resolved.startsWith(base + path.sep) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) return json(res, 404, { error: 'Not found.' })
    res.writeHead(200, { 'Content-Type': mime[path.extname(resolved)] || 'application/octet-stream' })
    fs.createReadStream(resolved).on('error', () => res.destroy()).pipe(res)
  }
  const server = http.createServer({ connectionsCheckingInterval: 1000 }, async (req, res) => {
    // Apply to every response, including assets, errors, QR images, and SSE.
    res.setHeader('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate, no-transform')
    res.setHeader('CDN-Cache-Control', 'no-store')
    res.setHeader('Cloudflare-CDN-Cache-Control', 'no-store')
    res.setHeader('Surrogate-Control', 'no-store')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'same-origin')
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'")
    try {
      const url = new URL(req.url, origin)
      const route = url.pathname
      if (route === '/health') return json(res, 200, { status: 'ok' })
      if (req.method !== 'GET' && req.headers.origin && !origins.has(req.headers.origin)) fail(403, 'Unrecognized origin.')
      if (route.startsWith('/api/') && req.method !== 'GET') {
        const bucket = route === '/api/rooms' ? 'create' : route.endsWith('/host') ? 'host' : route.endsWith('/join') ? 'join' : 'action'
        const key = `${req.socket.remoteAddress}:${bucket}`
        if (!rates.has(key) && rates.size >= 2000) fail(429, 'The server is busy. Try again shortly.')
        // Classroom Wi-Fi/proxies share an address. Student traffic must never
        // spend the host's control budget or prevent a reconnecting phone joining.
        const limit = { create: 20, host: 120, join: 1000, action: 10000 }[bucket]
        const rate = rates.get(key) || { start: clock(), count: 0 }
        if (clock() - rate.start > 60000) { rate.start = clock(); rate.count = 0 }
        if (++rate.count > limit) fail(429, 'Too many requests. Try again shortly.')
        rates.set(key, rate)
      }
      if (route === '/api/rooms' && req.method === 'POST') {
        const authorization = req.headers.authorization?.replace(/^Bearer /, '') || ''
        if (!safeEqual(authorization, hostKey)) fail(401, 'Incorrect host key.')
        if (rooms.size >= 30) fail(429, 'Too many active rooms. Rooms expire after four hours.')
        let code
        do { code = Array.from(crypto.randomBytes(6), b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('') } while (rooms.has(code))
        const hostToken = token()
        const room = { version: 3, code, hostHash: hash(hostToken), activity: 'hunt',
          hunt: { phase: 'lobby', endsAt: null, attempts: 0, found: 0, recent: [], players: {} },
          phase: 'lobby', round: 0, votes: gameRounds.map(() => ({})), participants: {}, scored: gameRounds.map(() => false), expiresAt: clock() + TTL }
        room.revision = 0; room.controlRevision = 0
        rooms.set(code, room)
        try { persist() } catch { rooms.delete(code); fail(503, 'Could not save the new room. Try again.') }
        return json(res, 201, { ...snapshot(room), hostToken })
      }
      const match = route.match(/^\/api\/rooms\/([A-Z2-9]{6})(?:\/(events|join|vote|guess|host|me|hunt-log|qr\.svg))?$/)
      if (match) {
        const [, code, action] = match
        const room = rooms.get(code)
        if (!room || room.expiresAt < clock()) fail(404, 'Room not found or expired. Ask for the current QR code.')
        if (!action && req.method === 'GET') return json(res, 200, snapshot(room, getVoter(req)))
        if (action === 'qr.svg' && req.method === 'GET') {
          const svg = await QRCode.toString(`${origin}/join/${code}`, { type: 'svg', errorCorrectionLevel: 'M', margin: 3, color: { dark: '#18201f', light: '#ffffff' } })
          res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); return res.end(svg)
        }
        if (action === 'events' && req.method === 'GET') {
          if (!streams.has(code)) streams.set(code, new Set())
          const clients = streams.get(code)
          if (clients.size >= 300 || [...streams.values()].reduce((sum, set) => sum + set.size, 0) >= 400) fail(429, 'Room connection limit reached.')
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' })
          res.voterId = getVoter(req)
          res.write(`retry: ${2000 + Math.floor(Math.random() * 2000)}\ndata: ${JSON.stringify(snapshot(room, res.voterId))}\n\n`)
          clients.add(res)
          const heartbeat = setInterval(() => {
            if (res.writableLength > 64 * 1024) res.destroy()
            else res.write(': heartbeat\n\n')
          }, 15000)
          heartbeat.unref()
          req.on('close', () => { clearInterval(heartbeat); clients.delete(res) })
          return
        }
        if (action === 'join' && req.method === 'POST') {
          const data = await body(req)
          const id = getVoter(req) || setVoter(res)
          if (!room.participants[id]) {
            if (Object.keys(room.participants).length >= 250) fail(429, 'This room is full.')
            const name = typeof data.name === 'string' ? data.name.normalize('NFKC').trim().replace(/\s+/g, ' ') : ''
            if (!/^[\p{L}\p{N} ._'’-]{1,24}$/u.test(name)) fail(400, 'Enter a first name or nickname, up to 24 characters.')
            if (Object.values(room.participants).some(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) fail(409, 'That name is already in this room. Add an initial or choose a nickname.')
            mutate(room, () => { room.participants[id] = { name, joinedAt: clock() } })
          }
          return json(res, 200, { ...snapshot(room, id), myName: room.participants[id].name, myVote: room.votes[room.round][id] ?? null, myHunt: room.hunt.players[id] || null })
        }
        if (action === 'me' && req.method === 'GET') {
          const id = getVoter(req)
          return json(res, 200, { joined: Boolean(id && room.participants[id]), myName: room.participants[id]?.name || null, round: room.round, revision: room.revision, myVote: id ? room.votes[room.round][id] ?? null : null, myHunt: room.hunt.players[id] || null })
        }
        if (action === 'guess' && req.method === 'POST') {
          const id = getVoter(req)
          if (!id || !room.participants[id]) fail(401, 'Join this room before guessing.')
          const data = await body(req)
          if (data.requestId !== undefined && (typeof data.requestId !== 'string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(data.requestId))) fail(400, 'Invalid request identifier.')
          const last = room.hunt.players[id]
          if (data.requestId && last?.last?.requestId === data.requestId) {
            let retryInput
            try { retryInput = normalizeInput(data.n) } catch (error) { fail(400, error.message) }
            if (typeof data.n !== 'string' || retryInput !== last.last.n) fail(409, 'This request identifier was already used.')
            return json(res, 200, { ...last.last, attempts: last.attempts })
          }
          checkControl(room, data)
          if (room.activity !== 'hunt' || room.hunt.phase !== 'open' || clock() >= room.hunt.endsAt) fail(409, 'The guessing window is closed.')
          const player = room.hunt.players[id] || { attempts: 0, found: false, lastAt: 0, last: null }
          if (clock() - player.lastAt < 500) fail(429, 'Give each guess half a second.')
          if (room.hunt.attempts >= 6000) fail(429, 'This room has reached its guess limit.')
          if (typeof data.n !== 'string') fail(400, 'Send the integer as text to preserve every digit.')
          let n
          try { n = normalizeInput(data.n) } catch (e) { fail(400, e.message) }
          const input = journal.begin({ room: code, player: id, name: room.participants[id].name, n, requestId: data.requestId || null, receivedAt: clock() })
          const result = evaluateGuess(n)
          journal.finish(input, result)
          const updated = recordGuess(room, input, result)
          deferGuessSave(room)
          return json(res, 200, { ...updated.last, attempts: updated.attempts })
        }
        if (action === 'hunt-log' && req.method === 'GET') {
          const authorization = req.headers.authorization?.replace(/^Bearer /, '') || ''
          if (!safeEqual(hash(authorization), room.hostHash)) fail(401, 'Host access required.')
          res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'Content-Disposition': `attachment; filename="guesses-${code}.jsonl"` })
          return res.end(journal.readRoom(code))
        }
        if (action === 'vote' && req.method === 'POST') {
          const id = getVoter(req)
          if (!id || !room.participants[id]) fail(401, 'Join this room before voting.')
          const data = await body(req)
          checkControl(room, data)
          if (room.activity !== 'proof' || room.phase !== 'open' || data.round !== room.round) fail(409, 'Voting is closed for this round.')
          if (typeof data.valid !== 'boolean') fail(400, 'Choose valid or broken.')
          // Duplicate clicks/retries are already saved. Rapid alternating votes
          // get a per-player budget, so one phone cannot monopolize disk writes.
          if (room.votes[room.round][id] === data.valid) return json(res, 200, snapshot(room, id))
          const rateKey = `${code}:${id}`
          let rate = voteRates.get(rateKey)
          if (!rate || rate.revision !== room.controlRevision || clock() - rate.start >= 1000) rate = { start: clock(), revision: room.controlRevision, count: 0 }
          if (rate.count >= 4) fail(429, 'Give your vote a moment to save before changing it again.')
          mutate(room, () => { room.votes[room.round][id] = data.valid })
          rate.count++; voteRates.set(rateKey, rate)
          return json(res, 200, snapshot(room, id))
        }
        if (action === 'host' && req.method === 'POST') {
          const authorization = req.headers.authorization?.replace(/^Bearer /, '') || ''
          if (!safeEqual(hash(authorization), room.hostHash)) fail(401, 'Host access required.')
          const data = await body(req)
          checkControl(room, data)
          if (data.round !== room.round || data.phase !== room.phase) fail(409, 'The round changed. Please try again.')
          if ((data.activity !== undefined && data.activity !== room.activity) || (data.huntPhase !== undefined && data.huntPhase !== room.hunt.phase)) fail(409, 'The activity changed. Please try again.')
          mutate(room, () => {
          if (data.action === 'switch-activity' || data.action === 'proof-setup') {
            const target = data.action === 'proof-setup' ? 'proof' : data.target
            if (!['hunt', 'proof'].includes(target)) fail(400, 'Choose a valid activity.')
            if (target === 'proof' && room.hunt.phase === 'open') {
              room.hunt.remainingMs = Math.max(0, room.hunt.endsAt - clock())
              room.hunt.phase = room.hunt.remainingMs > 0 ? 'paused' : 'closed'
              room.hunt.endsAt = null
            }
            room.activity = target
          }
          else if (['hunt-start', 'hunt-restart', 'hunt-resume'].includes(data.action) && room.activity === 'hunt') {
            if (data.action === 'hunt-start' && room.hunt.phase !== 'lobby') fail(409, 'The hunt has already started.')
            if (data.action === 'hunt-resume' && room.hunt.phase !== 'paused') fail(409, 'The hunt is not paused.')
            if (!journal.status().ready) fail(503, 'Archive the full guess log before starting another hunt.')
            const duration = data.action === 'hunt-resume' ? room.hunt.remainingMs : HUNT_DURATION
            room.hunt.phase = 'open'; room.hunt.endsAt = clock() + duration; room.hunt.remainingMs = 0
          }
          else if (data.action === 'hunt-pause' && room.activity === 'hunt' && room.hunt.phase === 'open') {
            room.hunt.remainingMs = Math.max(0, room.hunt.endsAt - clock())
            room.hunt.phase = room.hunt.remainingMs > 0 ? 'paused' : 'closed'; room.hunt.endsAt = null
          }
          else if (data.action === 'hunt-reveal' && room.activity === 'hunt') { room.hunt.phase = 'revealed'; room.hunt.endsAt = null; room.hunt.remainingMs = 0 }
          else if (room.activity !== 'proof') fail(409, 'That action is not available now.')
          else if (data.action === 'select-round') {
            if (!Number.isInteger(data.targetRound) || data.targetRound < 0 || data.targetRound >= gameRounds.length) fail(400, 'Choose a valid round.')
            room.round = data.targetRound
            room.phase = room.scored[room.round] ? 'revealed' : 'locked'
          }
          else if (data.action === 'reopen' && room.phase !== 'lobby') { room.scored[room.round] = false; room.phase = 'open' }
          else if (data.action === 'start'  && room.phase === 'lobby') room.phase = 'open'
          else if (data.action === 'lock' && room.phase === 'open') room.phase = 'locked'
          else if (data.action === 'reveal' && room.phase === 'locked') { room.phase = 'revealed'; room.scored[room.round] = true }
          else if (data.action === 'next' && room.phase === 'revealed' && room.round < gameRounds.length - 1) { room.round++; room.phase = room.scored[room.round] ? 'revealed' : 'open' }
          else if (data.action === 'finish' && room.phase === 'revealed' && room.round === gameRounds.length - 1) room.phase = 'finished'
          else fail(409, 'That action is not available now.')
          }, true)
          return json(res, 200, snapshot(room))
        }
        fail(405, 'Method not allowed.')
      }
      if (route.startsWith('/api/')) fail(404, 'Not found.')
      if (req.method !== 'GET' && req.method !== 'HEAD') fail(405, 'Method not allowed.')
      if (route === '/host') return serve(res, path.join(root, 'voting'), 'host.html')
      if (route === '/join' || /^\/join\/[A-Z2-9]{6}$/.test(route)) return serve(res, path.join(root, 'voting'), 'join.html')
      if (route === '/qr/artwork.png' || route === '/qr/normal.png') return serve(res, fs.existsSync(path.join(root, 'public/qr')) ? path.join(root, 'public/qr') : path.join(root, 'dist/qr'), path.basename(route))
      if (route.startsWith('/voting/')) return serve(res, path.join(root, 'voting'), decodeURIComponent(route.slice(8)))
      if (route.startsWith('/vendor/')) return serve(res, path.join(root, 'node_modules/katex/dist'), decodeURIComponent(route.slice(8)))
      return serve(res, path.join(root, 'dist'), route === '/' ? 'index.html' : decodeURIComponent(route.slice(1)))
    } catch (error) {
      if (req.aborted || res.destroyed) return
      if (!res.headersSent) json(res, error.status || 500, { error: error.status ? error.message : 'Server error. Please try again.' })
      else res.end()
      if (!error.status) console.error(error)
    }
  })
  server.maxConnections = 512
  server.maxHeadersCount = 64
  server.maxRequestsPerSocket = 500
  server.requestTimeout = 10000
  server.headersTimeout = 10000
  server.keepAliveTimeout = 5000
  // Server clock closes the hunt even if the host tab goes to sleep.
  const huntClock = setInterval(() => {
    for (const room of rooms.values()) if (room.hunt.phase === 'open' && clock() >= room.hunt.endsAt) {
      try { mutate(room, () => { room.hunt.phase = 'closed'; room.hunt.remainingMs = 0 }, true) } catch (error) { console.error('Unable to save hunt deadline:', error.code) }
    }
  }, 250)
  huntClock.unref()
  const cleanup = setInterval(() => {
    let changed = false
    for (const [code, room] of rooms) if (room.expiresAt < clock()) {
      clearTimeout(pendingBroadcasts.get(code)); pendingBroadcasts.delete(code)
      for (const client of streams.get(code) || []) client.end()
      streams.delete(code); rooms.delete(code); changed = true
    }
    for (const [key, rate] of rates) if (clock() - rate.start > 60000) rates.delete(key)
    for (const [key, rate] of voteRates) if (clock() - rate.start > 60000) voteRates.delete(key)
    if (changed) { try { persist() } catch (error) { console.error('Room cleanup save failed:', error.code) } }
  }, 60000)
  cleanup.unref()
  server.closeRoomStreams = () => { for (const clients of streams.values()) for (const client of clients) client.end() }
  server.on('close', () => {
    clearInterval(cleanup); clearInterval(huntClock)
    for (const timer of pendingBroadcasts.values()) clearTimeout(timer)
    try { persist() } catch (error) { console.error('Final room save failed:', error.code) } finally { journal.close() }
  })
  return server
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3040)
  const server = createProofServer({ hostKey: process.env.HOST_KEY, publicUrl: process.env.PUBLIC_URL || `http://localhost:${port}`, statePath: process.env.STATE_PATH, allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [] })
  let stopping = false
  const shutdown = () => {
    if (stopping) return
    stopping = true
    server.closeRoomStreams()
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 8000).unref()
  }
  process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown)
  server.listen(port, process.env.BIND || '0.0.0.0', () => console.log(`Proof voting listening on port ${port}`))
}
