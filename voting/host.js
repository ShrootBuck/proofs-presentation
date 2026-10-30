import katex from '/vendor/katex.mjs'
import { createJoinCard } from './join-card.js'
const dashboard = document.querySelector('#dashboard'), setup = document.querySelector('#setup-panel')
const error = document.querySelector('#error')
const form = document.querySelector('#host-form'), setupButton = document.querySelector('#show-setup'), resumeButton = document.querySelector('#resume-room')
let credentials, room, stream, connected = false, busy = false, offset = 0
const make = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el }
const math = (tex, cls = '') => { const el = make('div', cls); katex.render(tex, el, { throwOnError: false }); return el }
const short = n => n.length > 30 ? `${n.slice(0, 15)}…${n.slice(-8)}` : n
function button(text, action, cls = '') {
  const el = make('button', cls, text); el.disabled = busy || !connected
  el.addEventListener('click', () => act(action)); return el
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
    if (h.phase === 'closed') clock.append(button('Reveal the counterexample', 'hunt-reveal'))
    if (h.phase === 'open') clock.append(make('p', 'quiet', 'The clock runs on the server. No refresh loopholes.'))
    grid.append(left, clock, joinCard()); dashboard.append(grid, stats())
  }
  const footer = make('div', 'host-controls host-log-controls')
  const download = make('button', 'host-text-button', 'Download guess log'); download.disabled = !room.logging.durable; download.addEventListener('click', downloadLog); footer.append(download); dashboard.append(footer)
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
    result.append(make('div', 'host-final-score', `${room.score.class} / ${room.totalRounds}`), make('h2', '', room.score.class === room.totalRounds ? 'The class has trust issues. Good.' : 'Every trap has a lesson.'), link('Back to Slidev · slide 24 ↗', '/#/24'))
    grid.append(result, leaderboard()); dashboard.append(grid); return
  }
  dashboard.append(math(room.question.claim, 'host-claim'))
  const grid = make('div', 'host-proof-grid'), argument = make('div', 'host-argument'), votes = make('aside', 'host-votes')
  for (const [i, tex] of room.question.lines.entries()) {
    const line = make('div', `host-proof-line${room.answer?.badLine === i ? ' bad' : ''}`); line.append(make('span', 'host-line-number', i + 1), math(tex)); argument.append(line)
  }
  if (room.question.prose) argument.append(make('p', '', room.question.prose))
  if (room.phase === 'open') votes.append(make('p', 'eyebrow', 'VOTES RECEIVED'), Object.assign(make('div', 'host-vote-count', `${room.voted} / ${room.joined}`), { id: 'vote-count' }), make('p', '', 'A · Valid proof\nB · Broken proof'), button('Lock voting', 'lock'))
  else {
    for (const [label, count] of [['A · Valid', room.counts.valid], ['B · Broken', room.counts.broken]]) {
      const row = make('div', 'tally-row'); row.append(make('span', '', label), make('strong', '', count)); const bar = make('div', 'tally-bar'), fill = make('span'); fill.style.width = `${room.counts.total ? count / room.counts.total * 100 : 0}%`; bar.append(fill); votes.append(row, bar)
    }
    if (room.phase === 'locked') votes.append(make('p', 'quiet', 'Which step makes or breaks it?'), button('Reveal the answer', 'reveal'))
    else votes.append(button(room.round === room.totalRounds - 1 ? 'Final score' : 'Next round', room.round === room.totalRounds - 1 ? 'finish' : 'next'))
  }
  grid.append(argument, votes); dashboard.append(grid)
  if (room.answer) {
    const verdict = make('section', 'host-verdict'); verdict.append(make('h2', '', room.answer.verdict), make('p', '', room.answer.explanation)); dashboard.append(verdict)
  }
}
function render() {
  if (!room) return
  dashboard.replaceChildren(); setup.hidden = true; dashboard.hidden = false; setupButton.hidden = false; resumeButton.hidden = false
  if (room.activity === 'hunt') renderHunt(); else renderProof()
}
function updateClock() {
  const el = document.querySelector('#countdown'); if (!el || !room) return
  const seconds = room.hunt.phase === 'lobby' ? 60 : Math.max(0, Math.ceil((room.hunt.endsAt - Date.now() - offset) / 1000))
  el.textContent = String(seconds).padStart(2, '0'); el.classList.toggle('urgent', seconds <= 10)
}
setInterval(updateClock, 100)
async function act(action) {
  if (busy || !connected) return
  busy = true; error.textContent = ''; render()
  try {
    const response = await fetch(`/api/rooms/${room.code}/host`, { method: 'POST', headers: { Authorization: `Bearer ${credentials.hostToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action, phase: room.phase, round: room.round }) })
    const next = await response.json(); if (!response.ok) throw new Error(next.error); room = next; offset = next.serverTime - Date.now()
  } catch (e) { error.textContent = e.message } finally { busy = false; render() }
}
async function connect(saved) {
  credentials = saved; stream?.close(); connected = false
  const response = await fetch(`/api/rooms/${saved.code}`), next = await response.json()
  if (!response.ok) throw new Error(next.error)
  room = next; offset = next.serverTime - Date.now(); render()
  stream = new EventSource(`/api/rooms/${saved.code}/events`)
  stream.onopen = () => { connected = true; render() }
  stream.onerror = () => { connected = false; render() }
  stream.onmessage = event => {
    const next = JSON.parse(event.data), same = room.activity === next.activity && room.phase === next.phase && room.round === next.round && room.hunt.phase === next.hunt.phase
    room = next; offset = room.serverTime - Date.now()
    if (!setup.hidden) return
    if (!same) { render(); return }
    for (const [id, create] of [['player-roster', roster], ['host-statistics', stats], ['recent-guesses', recent]]) {
      const old = document.getElementById(id); if (old) old.replaceWith(create())
    }
    const count = document.getElementById('vote-count'); if (count) count.textContent = `${room.voted} / ${room.joined}`
  }
}
async function downloadLog() {
  try {
    const response = await fetch(`/api/rooms/${room.code}/hunt-log`, { headers: { Authorization: `Bearer ${credentials.hostToken}` } })
    if (!response.ok) throw new Error('Could not download the guess log.')
    const url = URL.createObjectURL(await response.blob()), a = make('a'); a.href = url; a.download = `guesses-${room.code}.jsonl`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (e) { error.textContent = e.message }
}
form.addEventListener('submit', async event => {
  event.preventDefault(); error.textContent = ''; const submit = form.querySelector('button'); submit.disabled = true
  try {
    const response = await fetch('/api/rooms', { method: 'POST', headers: { Authorization: `Bearer ${document.querySelector('#host-key').value}` } })
    const next = await response.json(); if (!response.ok) throw new Error(next.error)
    const saved = { code: next.code, hostToken: next.hostToken }; localStorage.setItem('proofs-live-room', JSON.stringify(saved)); document.querySelector('#host-key').value = ''; await connect(saved)
  } catch (e) { error.textContent = e.message } finally { submit.disabled = false }
})
setupButton.addEventListener('click', () => { setup.hidden = false; dashboard.hidden = true })
resumeButton.addEventListener('click', render)
try {
  const saved = JSON.parse(localStorage.getItem('proofs-live-room') || 'null')
  if (saved?.hostToken) connect(saved).catch(e => { error.textContent = e.message; setup.hidden = false; dashboard.hidden = true })
} catch {}
