import katex from '/vendor/katex.mjs'
import { createJoinCard } from './join-card.js'
import { requestJSON, watchRoom, readSaved, writeSaved, isNewerState } from './connection.mjs'
const dashboard = document.querySelector('#dashboard'), setup = document.querySelector('#setup-panel')
const error = document.querySelector('#error')
const form = document.querySelector('#host-form'), setupButton = document.querySelector('#show-setup'), resumeButton = document.querySelector('#resume-room')
let credentials, room, stream, connected = false, busy = false, offset = 0, connectionState = 'connecting', connecting = false
const networkStatus = makeStatus()
function makeStatus() {
  const el = document.createElement('span'); el.className = 'host-network-status'; el.setAttribute('role', 'status')
  document.querySelector('.host-nav-actions').prepend(el); return el
}
const make = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el }
const math = (tex, cls = '') => { const el = make('div', cls); katex.render(tex, el, { throwOnError: false }); return el }
const short = n => n.length > 30 ? `${n.slice(0, 15)}…${n.slice(-8)}` : n
function button(text, action, cls = '', payload = {}) {
  const el = make('button', cls, text); el.disabled = busy || !connected
  el.addEventListener('click', () => act(action, payload)); return el
}
function link(text, href, target = 'proofs-deck') { const el = make('a', 'host-link', text); el.href = href; el.target = target; return el }
function joinCard() {
  return createJoinCard(room)
}
function roster() {
  const section = make('section', 'host-roster'); section.id = 'player-roster'
  section.append(make('p', 'eyebrow', `${room.joined} PLAYERS IN THE ROOM`))
  const names = make('div', 'host-names')
  for (const p of room.participants) names.append(make('span', '', p.name))
  if (!room.joined) names.append(make('p', 'quiet', 'Waiting for the first brave volunteer.'))
  section.append(names); return section
}
function leaderboard() {
  const section = make('section', 'host-leaderboard')
  section.append(make('p', 'eyebrow', 'THE SHARPEST SKEPTICS'))
  const sorted = [...room.participants].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
  for (const [i, p] of sorted.slice(0, 8).entries()) {
    const line = make('div'); line.append(make('span', '', `${i + 1}. ${p.name}`), make('strong', '', `${p.points} / ${room.totalRounds}`)); section.append(line)
  }
  return section
}
function stats() {
  const row = make('div', 'host-stats'); row.id = 'host-statistics'
  for (const [value, label] of [[room.joined, 'players'], [room.hunt.attempts, 'guesses'], [room.hunt.maxDigits, 'digits in the biggest input'], [room.hunt.found, 'found a shared factor']]) {
    const stat = make('div'); stat.append(make('strong', '', value), make('span', '', label)); row.append(stat)
  }
  return row
}
function recent() {
  const section = make('section', 'host-recent'); section.id = 'recent-guesses'
  section.append(make('p', 'eyebrow', 'LATEST GUESSES'))
  for (const guess of room.hunt.recent) {
    const row = make('div', guess.found ? 'found' : '')
    row.append(make('span', 'guess-name', guess.name), make('code', '', `n = ${short(guess.n)}`), make('strong', '', guess.found ? 'FOUND IT' : 'GCD = 1')); section.append(row)
  }
  if (!room.hunt.recent.length) section.append(make('p', 'quiet', 'Try something. Then try something bigger.'))
  return section
}
function renderHunt() {
  const h = room.hunt
  dashboard.append(make('h1', '', 'Break the pattern.'))
  const formulas = make('div', 'host-formulas'); formulas.append(math('A=n^{17}+9'), math('B=(n+1)^{17}+9')); dashboard.append(formulas)
  if (h.phase === 'revealed') {
    const reveal = make('section', 'host-reveal')
    reveal.append(make('p', 'eyebrow', 'THE FIRST NONNEGATIVE COUNTEREXAMPLE'), make('div', 'host-reveal-number', h.reveal.n), make('p', '', 'Both numbers share this factor:'), make('div', 'host-shared-factor', h.reveal.gcd), make('p', 'host-takeaway', '52 digits. One counterexample. Claim disproved.'))
    dashboard.append(reveal, stats())
    const controls = make('div', 'host-controls'); controls.append(link('Back to Slidev · slide 3 ↗', '/#/3'), button('Open Proof or Bluff', 'proof-setup', 'secondary')); dashboard.append(controls)
  } else {
    const grid = make('div', 'host-hunt-grid'), left = make('div')
    left.append(make('p', 'host-task', 'Find a nonnegative integer n such that A and B share a factor greater than 1.'))
    if (h.phase === 'lobby') left.append(make('p', '', 'Any nonnegative whole number. Up to 100 digits.'), roster())
    else left.append(recent())
    const clock = make('div', 'host-clock')
    clock.append(make('p', 'eyebrow', h.phase === 'closed' ? 'TIME IS UP' : 'SECONDS TO BREAK IT'))
    const time = make('div', 'host-countdown'); time.id = 'countdown'; clock.append(time)
    if (h.phase === 'lobby') clock.append(button('Start the 60 seconds', 'hunt-start'))
    if (h.phase === 'paused') clock.append(make('p', 'quiet', 'Timer paused'), button('Resume timer', 'hunt-resume'))
    if (h.phase === 'closed') clock.append(button('Reveal the counterexample', 'hunt-reveal'))
    grid.append(left, clock, joinCard()); dashboard.append(grid, stats())
  }
  const footer = make('div', 'host-controls host-log-controls')
  const download = make('button', 'host-text-button', 'Download guess log'); download.disabled = !room.logging.durable || !connected; download.addEventListener('click', downloadLog); footer.append(download); dashboard.append(footer)
  updateClock()
}
function renderProof() {
  dashboard.append(make('p', 'eyebrow', `ROOM ${room.code} / ${room.phase === 'lobby' ? 'THE CLASS VS. THE LOGIC TRAPS' : `ROUND ${room.round + 1} OF ${room.totalRounds}`}`), make('h1', '', 'Proof or bluff?'))
  if (room.phase === 'lobby') {
    const grid = make('div', 'host-lobby-grid'), left = make('div')
    left.append(make('h2', '', 'Five arguments. Judge every step.'), make('p', '', 'A: valid proof. B: broken proof. Votes stay hidden until locking.'), roster(), button('Start round 1', 'start'))
    grid.append(left, joinCard()); dashboard.append(grid); return
  }
  const scores = make('div', 'host-class-score'); scores.append(make('span', '', `CLASS ${room.score.class}`), make('span', '', `TRAPS ${room.score.traps}`)); dashboard.append(scores)
  if (room.phase === 'finished') {
    const grid = make('div', 'host-finish-grid'), result = make('div')
    result.append(make('div', 'host-final-score', `${room.score.class} / ${room.totalRounds}`), make('h2', '', room.score.class === room.totalRounds ? 'The class has trust issues. Good.' : 'Every trap has a lesson.'), link('Back to Slidev · slide 25 ↗', '/#/25'))
    grid.append(result, leaderboard()); dashboard.append(grid); return
  }
  dashboard.append(math(room.question.claim, 'host-claim'))
  const grid = make('div', 'host-proof-grid'), argument = make('div', 'host-argument'), votes = make('aside', 'host-votes')
  for (const [i, tex] of room.question.lines.entries()) {
    const line = make('div', `host-proof-line${room.answer?.badLine === i ? ' bad' : ''}`); line.append(make('span', 'host-line-number', i + 1), math(tex)); argument.append(line)
  }
  if (room.question.prose) argument.append(make('p', '', room.question.prose))
  const qed = make('span', 'game-qed'); qed.setAttribute('aria-label', 'QED')
  const conclusion = argument.lastElementChild
  ;(room.question.prose ? conclusion : conclusion.lastElementChild).append(qed)
  if (room.phase === 'open') votes.append(make('p', 'eyebrow', 'VOTES RECEIVED'), Object.assign(make('div', 'host-vote-count', `${room.voted} / ${room.joined}`), { id: 'vote-count' }), make('p', '', 'A · Valid proof\nB · Broken proof'), button('Lock voting', 'lock'))
  else {
    for (const [label, count] of [['A · Valid', room.counts.valid], ['B · Broken', room.counts.broken]]) {
      const row = make('div', 'tally-row'); row.append(make('span', '', label), make('strong', '', count)); const bar = make('div', 'tally-bar'), fill = make('span'); fill.style.width = `${room.counts.total ? count / room.counts.total * 100 : 0}%`; bar.append(fill); votes.append(row, bar)
    }
    if (room.phase === 'locked') votes.append(button(room.voted ? 'Reopen voting' : 'Open voting', 'reopen', 'secondary'), make('p', 'quiet', 'Which step makes or breaks it?'), button('Reveal the answer', 'reveal'))
    else votes.append(button(room.round === room.totalRounds - 1 ? 'Final score' : 'Next round', room.round === room.totalRounds - 1 ? 'finish' : 'next'))
  }
  grid.append(argument, votes); dashboard.append(grid)
  if (room.answer) {
    const verdict = make('section', 'host-verdict'); verdict.append(make('h2', '', room.answer.verdict), make('p', '', room.answer.explanation)); dashboard.append(verdict)
  }
}
function activityControls() {
  const bar = make('nav', 'host-activity-controls'); bar.setAttribute('aria-label', 'Room activities')
  for (const [target, label] of [['hunt', 'Number hunt'], ['proof', 'Proof or Bluff']]) {
    const tab = button(label, 'switch-activity', room.activity === target ? '' : 'secondary', { target })
    tab.disabled ||= room.activity === target; tab.setAttribute('aria-current', String(room.activity === target)); bar.append(tab)
  }
  const controls = make('details', 'host-room-tools'), summary = make('summary', '', 'Activity controls')
  controls.append(summary)
  const items = make('div', 'host-tool-items')
  if (room.activity === 'hunt') {
    if (room.hunt.phase === 'open') items.append(button('Pause timer', 'hunt-pause', 'secondary'))
    if (room.hunt.phase === 'paused') items.append(button('Resume timer', 'hunt-resume', 'secondary'))
    items.append(button('Restart 60 seconds', 'hunt-restart', 'secondary'))
    if (room.hunt.phase !== 'revealed') items.append(button('Reveal answer now', 'hunt-reveal', 'secondary'))
    items.append(make('p', 'quiet', 'Restarting the timer keeps all guesses. Switching activities pauses it.'))
  } else {
    const rounds = make('div', 'host-round-picker')
    for (let i = 0; i < room.totalRounds; i++) rounds.append(button(`Round ${i + 1}`, 'select-round', room.round === i && room.phase !== 'lobby' ? '' : 'secondary', { targetRound: i }))
    items.append(rounds)
    if (room.phase !== 'lobby' && room.phase !== 'open') items.append(button('Reopen voting', 'reopen', 'secondary'))
    items.append(make('p', 'quiet', 'Round selection keeps votes. Reopening lets players revise them; that round is scored again when revealed.'))
  }
  controls.append(items); bar.append(controls); return bar
}
function render() {
  if (!room) return
  const toolsOpen = dashboard.querySelector('.host-room-tools')?.open
  dashboard.replaceChildren(); setup.hidden = true; dashboard.hidden = false; setupButton.hidden = false; resumeButton.hidden = false
  dashboard.append(activityControls())
  dashboard.querySelector('.host-room-tools').open = Boolean(toolsOpen)
  if (room.activity === 'hunt') renderHunt(); else renderProof()
}
function updateClock() {
  const el = document.querySelector('#countdown'); if (!el || !room) return
  const seconds = room.hunt.phase === 'lobby' ? 60 : room.hunt.phase === 'paused' ? Math.ceil(room.hunt.remainingMs / 1000) : Math.max(0, Math.ceil((room.hunt.endsAt - Date.now() - offset) / 1000))
  el.textContent = String(seconds).padStart(2, '0'); el.classList.toggle('urgent', seconds <= 10)
}
setInterval(updateClock, 100)
function receive(next) {
  if (!isNewerState(room, next)) return
  const same = room && room.activity === next.activity && room.phase === next.phase && room.round === next.round && room.hunt.phase === next.hunt.phase && room.controlRevision === next.controlRevision
  if (room && room.controlRevision !== next.controlRevision) error.textContent = ''
  room = next; offset = room.serverTime - Date.now()
  if (!setup.hidden) return
  if (!same) render()
  else {
    for (const [id, create] of [['player-roster', roster], ['host-statistics', stats], ['recent-guesses', recent]]) {
      const old = document.getElementById(id); if (old) old.replaceWith(create())
    }
    const count = document.getElementById('vote-count'); if (count) count.textContent = `${room.voted} / ${room.joined}`
    updateClock()
  }
}
function setConnection(status) {
  if (status === connectionState) return
  connectionState = status; connected = status === 'live'
  networkStatus.textContent = connected ? '' : 'Reconnecting… controls paused'
  if (setup.hidden) render()
}
async function act(action, payload = {}) {
  if (busy || !connected) return
  const code = room.code
  const data = { ...payload, action, phase: room.phase, round: room.round, activity: room.activity, huntPhase: room.hunt.phase, controlRevision: room.controlRevision }
  busy = true; error.textContent = ''; render()
  try {
    const next = await requestJSON(`/api/rooms/${code}/host`, { method: 'POST', headers: { Authorization: `Bearer ${credentials.hostToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (room.code === code) receive(next)
  } catch (e) { error.textContent = e.message; void stream?.sync() }
  finally { busy = false; if (setup.hidden) render() }
}
async function connect(saved) {
  if (connecting) return
  connecting = true
  stream?.close(); credentials = saved; room = null; connected = false; connectionState = 'connecting'
  networkStatus.textContent = 'Connecting…'
  try {
    const next = await requestJSON(`/api/rooms/${saved.code}`)
    room = next; offset = room.serverTime - Date.now(); render()
    stream = watchRoom(saved.code, {
      onState: receive,
      onConnection: setConnection,
      onMissing(message) {
        connected = false; room = null; credentials = null; writeSaved('proofs-live-room', null); error.textContent = message
        setup.hidden = false; dashboard.hidden = true; resumeButton.hidden = true
        networkStatus.textContent = 'Room expired'
      },
    })
  } catch (e) {
    if (e.status === 404) { credentials = null; writeSaved('proofs-live-room', null) }
    setup.hidden = false; dashboard.hidden = true; resumeButton.hidden = !credentials
    networkStatus.textContent = 'Not connected'
    throw e
  } finally { connecting = false }
}
async function downloadLog() {
  try {
    const response = await fetch(`/api/rooms/${room.code}/hunt-log`, { headers: { Authorization: `Bearer ${credentials.hostToken}` } })
    if (!response.ok) throw new Error('Could not download the guess log.')
    const url = URL.createObjectURL(await response.blob()), a = make('a'); a.href = url; a.download = `guesses-${room.code}.jsonl`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (e) { error.textContent = e.message }
}
form.addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return
  busy = true; error.textContent = ''; const submit = form.querySelector('button'); submit.disabled = true
  try {
    const next = await requestJSON('/api/rooms', { method: 'POST', headers: { Authorization: `Bearer ${document.querySelector('#host-key').value}` } })
    const saved = { code: next.code, hostToken: next.hostToken }
    const stored = writeSaved('proofs-live-room', saved)
    document.querySelector('#host-key').value = ''
    await connect(saved)
    if (!stored) error.textContent = 'Browser storage is unavailable. Keep this host tab open to retain control of the room.'
  } catch (e) { error.textContent = e.message }
  finally { busy = false; submit.disabled = false; if (setup.hidden) render() }
})
setupButton.addEventListener('click', () => { setup.hidden = false; dashboard.hidden = true })
async function resumeRoom() {
  if (!credentials || room || connecting || busy || document.visibilityState === 'hidden') return
  try { await connect(credentials); error.textContent = '' } catch (e) { error.textContent = e.message }
}
resumeButton.addEventListener('click', () => { if (room) render(); else void resumeRoom() })
window.addEventListener('online', resumeRoom)
window.addEventListener('pageshow', resumeRoom)
document.addEventListener('visibilitychange', resumeRoom)
setInterval(resumeRoom, 5000)
const saved = readSaved('proofs-live-room')
if (/^[A-Z2-9]{6}$/.test(saved?.code || '') && saved?.hostToken) {
  credentials = saved; void resumeRoom()
}
