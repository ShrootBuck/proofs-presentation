import http from 'node:http'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'
import { gameRounds } from '../lib/logic.mjs'
import { evaluateGuess, COUNTEREXAMPLE, SHARED_FACTOR, HUNT_DURATION } from '../lib/hunt.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const hash = text => crypto.createHash('sha256').update(text).digest('hex')
const safeEqual = (a, b) => crypto.timingSafeEqual(Buffer.from(hash(a || '')), Buffer.from(hash(b || '')))
const token = () => crypto.randomBytes(32).toString('base64url')
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.json': 'application/json' }
const TTL = 4 * 60 * 60 * 1000

export function createProofServer({ hostKey, publicUrl = 'http://localhost:3040', statePath, allowedOrigins = [], clock = Date.now } = {}) {
  if (!hostKey || hostKey.length < 24) throw new Error('HOST_KEY must contain at least 24 characters.')
  const origin = new URL(publicUrl).origin
  const origins = new Set([origin, ...allowedOrigins])
  const rooms = new Map()
  const streams = new Map()
  const rates = new Map()
  if (statePath && fs.existsSync(statePath)) {
    for (const room of JSON.parse(fs.readFileSync(statePath, 'utf8'))) {
      if (room.version === 2 && room.expiresAt > clock()) rooms.set(room.code, room)
    }
  }
  function persist() {
    if (!statePath) return
    fs.mkdirSync(path.dirname(statePath), { recursive: true })
    fs.writeFileSync(`${statePath}.tmp`, JSON.stringify([...rooms.values()]), { mode: 0o600 })
    fs.renameSync(`${statePath}.tmp`, statePath)
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
  function snapshot(room) {
    const { title, claim, lines, prose } = gameRounds[room.round]
    const visible = ['locked', 'revealed', 'finished'].includes(room.phase)
    const revealed = ['revealed', 'finished'].includes(room.phase)
    const history = room.scored.map((scored, index) => scored ? result(room, index) : null)
    return {
      code: room.code, activity: room.activity, serverTime: clock(),
      hunt: { phase: room.hunt.phase, endsAt: room.hunt.endsAt, attempts: room.hunt.attempts, found: room.hunt.found, recent: room.hunt.recent,
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
    persist()
    const message = `data: ${JSON.stringify(snapshot(room))}\n\n`
    for (const client of streams.get(room.code) || []) client.write(message)
  }
  function json(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify(data))
  }
  function fail(status, message) { throw Object.assign(new Error(message), { status }) }
  async function body(req) {
    let text = ''
    for await (const chunk of req) {
      text += chunk
      if (text.length > 4096) fail(413, 'Request too large.')
    }
    try { return JSON.parse(text || '{}') } catch { fail(400, 'Invalid JSON.') }
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
  function serve(res, directory, relative, cache = false) {
    const base = path.resolve(directory)
    const resolved = path.resolve(base, relative)
    if (!resolved.startsWith(base + path.sep) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) return json(res, 404, { error: 'Not found.' })
    res.writeHead(200, { 'Content-Type': mime[path.extname(resolved)] || 'application/octet-stream', 'Cache-Control': cache ? 'public, max-age=31536000, immutable' : 'no-cache' })
    fs.createReadStream(resolved).pipe(res)
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'same-origin')
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'")
    try {
      const url = new URL(req.url, origin)
      const route = url.pathname
      if (route === '/health') return json(res, 200, { status: 'ok' })
      if (req.method !== 'GET' && req.headers.origin && !origins.has(req.headers.origin)) fail(403, 'Unrecognized origin.')
      if (route.startsWith('/api/') && req.method !== 'GET') {
        const key = `${req.socket.remoteAddress}:${route === '/api/rooms' ? 'create' : 'action'}`
        const limit = route === '/api/rooms' ? 20 : 10000
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
        const room = { version: 2, code, hostHash: hash(hostToken), activity: 'hunt',
          hunt: { phase: 'lobby', endsAt: null, attempts: 0, found: 0, recent: [], players: {} },
          phase: 'lobby', round: 0, votes: gameRounds.map(() => ({})), participants: {}, scored: gameRounds.map(() => false), expiresAt: clock() + TTL }
        rooms.set(code, room); persist()
        return json(res, 201, { ...snapshot(room), hostToken })
      }
      const match = route.match(/^\/api\/rooms\/([A-Z2-9]{6})(?:\/(events|join|vote|guess|host|me|qr\.svg))?$/)
      if (match) {
        const [, code, action] = match
        const room = rooms.get(code)
        if (!room || room.expiresAt < clock()) fail(404, 'Room not found or expired. Ask for the current QR code.')
        if (!action && req.method === 'GET') return json(res, 200, snapshot(room))
        if (action === 'qr.svg' && req.method === 'GET') {
          const svg = await QRCode.toString(`${origin}/join/${code}`, { type: 'svg', errorCorrectionLevel: 'M', margin: 3, color: { dark: '#18201f', light: '#ffffff' } })
          res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=600' }); return res.end(svg)
        }
        if (action === 'events' && req.method === 'GET') {
          if (!streams.has(code)) streams.set(code, new Set())
          const clients = streams.get(code)
          if (clients.size >= 600) fail(429, 'Room connection limit reached.')
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' })
          res.write(`data: ${JSON.stringify(snapshot(room))}\n\n`)
          clients.add(res)
          const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 20000)
          heartbeat.unref()
          req.on('close', () => { clearInterval(heartbeat); clients.delete(res) })
          return
        }
        if (action === 'join' && req.method === 'POST') {
          const id = getVoter(req) || setVoter(res)
          if (!room.participants[id] && Object.keys(room.participants).length >= 250) fail(429, 'This room is full.')
          room.participants[id] = true; broadcast(room)
          return json(res, 200, { ...snapshot(room), myVote: room.votes[room.round][id] ?? null, myHunt: room.hunt.players[id] || null })
        }
        if (action === 'me' && req.method === 'GET') {
          const id = getVoter(req)
          return json(res, 200, { joined: Boolean(id && room.participants[id]), myVote: id ? room.votes[room.round][id] ?? null : null })
        }
        if (action === 'guess' && req.method === 'POST') {
          const id = getVoter(req)
          if (!id || !room.participants[id]) fail(401, 'Join this room before guessing.')
          if (room.activity !== 'hunt' || room.hunt.phase !== 'open' || clock() >= room.hunt.endsAt) fail(409, 'The guessing window is closed.')
          const data = await body(req)
          if (room.hunt.phase !== 'open' || clock() >= room.hunt.endsAt) fail(409, 'The guessing window is closed.')
          const player = room.hunt.players[id] || { attempts: 0, found: false, lastAt: 0, last: null }
          if (clock() - player.lastAt < 250) fail(429, 'Give each guess a moment.')
          if (typeof data.n !== 'string') fail(400, 'Send the integer as text to preserve every digit.')
          let result
          try { result = evaluateGuess(data.n) } catch (e) { fail(400, e.message) }
          player.attempts++; player.lastAt = clock(); player.last = result
          if (result.found && !player.found) { player.found = true; room.hunt.found++ }
          room.hunt.players[id] = player; room.hunt.attempts++
          room.hunt.recent.unshift({ n: result.n, gcd: result.gcd, found: result.found })
          room.hunt.recent = room.hunt.recent.slice(0, 6)
          broadcast(room)
          return json(res, 200, { ...result, attempts: player.attempts })
        }
        if (action === 'vote' && req.method === 'POST') {
          const id = getVoter(req)
          if (!id || !room.participants[id]) fail(401, 'Join this room before voting.')
          const data = await body(req)
          if (room.activity !== 'proof' || room.phase !== 'open' || data.round !== room.round) fail(409, 'Voting is closed for this round.')
          if (typeof data.valid !== 'boolean') fail(400, 'Choose valid or broken.')
          room.votes[room.round][id] = data.valid; broadcast(room)
          return json(res, 200, { myVote: data.valid })
        }
        if (action === 'host' && req.method === 'POST') {
          const authorization = req.headers.authorization?.replace(/^Bearer /, '') || ''
          if (!safeEqual(hash(authorization), room.hostHash)) fail(401, 'Host access required.')
          const data = await body(req)
          if (data.round !== room.round || data.phase !== room.phase) fail(409, 'The round changed. Please try again.')
          if (data.action === 'hunt-start' && room.activity === 'hunt' && room.hunt.phase === 'lobby') {
            room.hunt.phase = 'open'; room.hunt.endsAt = clock() + HUNT_DURATION
          }
          else if (data.action === 'hunt-reveal' && room.activity === 'hunt' && (room.hunt.phase === 'closed' || (room.hunt.phase === 'open' && clock() >= room.hunt.endsAt))) room.hunt.phase = 'revealed'
          else if (data.action === 'proof-setup' && room.activity === 'hunt' && room.hunt.phase !== 'open') room.activity = 'proof'
          else if (room.activity !== 'proof') fail(409, 'That action is not available now.')
          else if (data.action === 'start' && room.phase === 'lobby') room.phase = 'open'
          else if (data.action === 'lock' && room.phase === 'open') room.phase = 'locked'
          else if (data.action === 'reveal' && room.phase === 'locked') { room.phase = 'revealed'; room.scored[room.round] = true }
          else if (data.action === 'next' && room.phase === 'revealed' && room.round < gameRounds.length - 1) { room.round++; room.phase = 'open' }
          else if (data.action === 'finish' && room.phase === 'revealed' && room.round === gameRounds.length - 1) room.phase = 'finished'
          else fail(409, 'That action is not available now.')
          broadcast(room); return json(res, 200, snapshot(room))
        }
        fail(405, 'Method not allowed.')
      }
      if (route.startsWith('/api/')) fail(404, 'Not found.')
      if (req.method !== 'GET' && req.method !== 'HEAD') fail(405, 'Method not allowed.')
      if (route === '/host') return serve(res, path.join(root, 'voting'), 'host.html')
      if (route === '/join' || /^\/join\/[A-Z2-9]{6}$/.test(route)) return serve(res, path.join(root, 'voting'), 'join.html')
      if (route.startsWith('/voting/')) return serve(res, path.join(root, 'voting'), decodeURIComponent(route.slice(8)))
      if (route.startsWith('/vendor/')) return serve(res, path.join(root, 'node_modules/katex/dist'), decodeURIComponent(route.slice(8)), true)
      return serve(res, path.join(root, 'dist'), route === '/' ? 'index.html' : decodeURIComponent(route.slice(1)), route.startsWith('/assets/'))
    } catch (error) {
      if (!res.headersSent) json(res, error.status || 500, { error: error.status ? error.message : 'Server error. Please try again.' })
      else res.end()
      if (!error.status) console.error(error)
    }
  })
  // Server clock closes the hunt even if the host tab goes to sleep.
  const huntClock = setInterval(() => {
    for (const room of rooms.values()) if (room.hunt.phase === 'open' && clock() >= room.hunt.endsAt) {
      room.hunt.phase = 'closed'; broadcast(room)
    }
  }, 250)
  huntClock.unref()
  const cleanup = setInterval(() => {
    let changed = false
    for (const [code, room] of rooms) if (room.expiresAt < clock()) {
      for (const client of streams.get(code) || []) client.end()
      streams.delete(code); rooms.delete(code); changed = true
    }
    for (const [key, rate] of rates) if (clock() - rate.start > 60000) rates.delete(key)
    if (changed) persist()
  }, 60000)
  cleanup.unref()
  server.on('close', () => { clearInterval(cleanup); clearInterval(huntClock) })
  return server
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3040)
  const server = createProofServer({ hostKey: process.env.HOST_KEY, publicUrl: process.env.PUBLIC_URL || `http://localhost:${port}`, statePath: process.env.STATE_PATH, allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [] })
  server.listen(port, process.env.BIND || '0.0.0.0', () => console.log(`Proof voting listening on port ${port}`))
}
