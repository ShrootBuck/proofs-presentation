import katex from '/vendor/katex.mjs'
import { normalizeInput } from './integers.mjs'
import { requestJSON, watchRoom, readSaved, writeSaved, isNewerState } from './connection.mjs'
const game = document.querySelector('#game')
const join = document.querySelector('#join-panel')
const error = document.querySelector('#error')
const connection = document.querySelector('#connection')
const changeRoom = document.createElement('button')
changeRoom.type = 'button'; changeRoom.className = 'change-room'; changeRoom.textContent = 'Change room'; changeRoom.hidden = true
document.querySelector('#player-name').after(changeRoom)
let roomCode = location.pathname.split('/')[2] || readSaved('proofs-player-room') || ''
let snapshot, myVote = null, stream, busy = false, myHunt = null, clockOffset = 0, myName = ''
let factorWorker, factorId = 0, factors = null
let connected = false, joining = false, huntDraft = '', pendingGuess = null
const compact = s => s.length > 45 ? `${s.slice(0, 20)}…${s.slice(-12)} (${s.length} digits)` : s
const make = (tag, className, text) => { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el }
const math = (tex, className) => { const el = make('div', className); katex.render(tex, el, { throwOnError: false }); return el }
function renderActivity() {
  if (!snapshot) return
  const state = snapshot
  if (state.activity === 'hunt') { renderHunt(); return }
  game.replaceChildren(); game.hidden = false; join.hidden = true
  game.append(make('p', 'eyebrow', `ROOM ${state.code} / ${state.phase === 'lobby' ? 'LOBBY' : `ROUND ${state.round + 1} OF ${state.totalRounds}`}`))
  if (state.phase === 'lobby') {
    game.append(make('h1', '', "You're in."), make('div', 'waiting-symbol', '∎'), make('p', '', 'Watch the presentation. Your first proof will appear here when the host starts the game.'), make('p', 'quiet', `${state.joined} ${state.joined === 1 ? 'person has' : 'people have'} joined.`))
    return
  }
  if (state.phase === 'finished') {
    game.append(make('h1', '', 'Final verdict'), make('div', 'score', `${state.score.class} / ${state.totalRounds}`), make('h2', '', 'Points for the class'), make('p', '', `${state.score.traps} for the traps. A class point requires a majority of votes to be correct.`), make('p', '', 'Thanks for playing. Put the phone away and challenge the next step.'))
    return
  }
  game.append(make('h2', '', state.question.title), math(state.question.claim, 'claim'))
  for (const [index, line] of state.question.lines.entries()) {
    const row = make('div', `proof-line${state.answer?.badLine === index ? ' bad' : ''}`)
    row.append(make('span', 'num', String(index + 1)), math(line)); game.append(row)
  }
  if (state.question.prose) game.append(make('p', 'proof-prose', state.question.prose))
  const qed = make('span', 'game-qed'); qed.setAttribute('aria-label', 'QED')
  const conclusion = game.lastElementChild
  ;(state.question.prose ? conclusion : conclusion.lastElementChild).append(qed)
  if (state.phase === 'open') {
    const buttons = make('div', 'vote-buttons')
    for (const [valid, letter, label] of [[true, 'A', 'Valid proof'], [false, 'B', 'Broken proof']]) {
      const button = make('button', myVote === valid ? 'selected' : '')
      button.append(make('span', '', letter), make('strong', '', label)); button.setAttribute('aria-pressed', String(myVote === valid)); button.disabled = busy || !connected
      button.addEventListener('click', () => vote(valid)); buttons.append(button)
    }
    game.append(buttons, make('p', 'vote-status', myVote === null ? 'Choose your verdict. Results stay hidden.' : 'Vote saved. You can change it until voting locks.'))
  } else {
    game.append(make('p', 'vote-status', myVote === null ? 'Voting is locked.' : `Your vote: ${myVote ? 'Valid proof' : 'Broken proof'}. Locked.`))
    for (const [label, value] of [['Valid proof', state.counts.valid], ['Broken proof', state.counts.broken]]) {
      const row = make('div', 'tally-row'); row.append(make('span', '', label), make('strong', '', String(value)))
      const bar = make('div', 'tally-bar'); const fill = make('span'); fill.style.width = `${state.counts.total ? value / state.counts.total * 100 : 0}%`; bar.append(fill); game.append(row, bar)
    }
    if (!state.answer) game.append(make('p', 'quiet', 'The class has committed. Which step makes or breaks this proof?'))
  }
  if (state.answer) {
    const verdict = make('div', 'verdict'); verdict.append(make('h2', '', state.answer.verdict), make('p', '', state.answer.explanation))
    if (myVote !== null) verdict.append(make('p', 'vote-status', myVote === state.answer.valid ? 'You caught it.' : 'A good trap. Now you know why.'))
    game.append(verdict)
  }
}
function render() {
  const wasOpen = document.querySelector('#previous-factors')?.open
  renderActivity()
  if (snapshot && myHunt?.last && snapshot.activity === 'hunt' && snapshot.hunt.phase === 'revealed') {
    const history = make('details'); history.id = 'previous-factors'; history.open = Boolean(wasOpen)
    history.append(make('summary', '', 'Your previous factorization'))
    const panels = make('div'); panels.id = 'factor-panels'; history.append(panels); game.append(history); renderFactorPanels()
  }
}
function stopFactors() {
  factorWorker?.terminate(); factorWorker = null; factorId++; factors = null
}
function receive(next) {
  if (!isNewerState(snapshot, next)) return
  const previous = snapshot, oldVote = myVote, oldReceipt = myHunt?.last?.receipt
  const activityChanged = previous?.activity !== next.activity
  snapshot = next; clockOffset = next.serverTime - Date.now()
  if (next.joinedAsPlayer === false) {
    connected = false; stream?.close(); stopFactors()
    snapshot = null; myVote = null; myHunt = null; pendingGuess = null
    game.replaceChildren(); game.hidden = true; join.hidden = false
    changeRoom.hidden = true
    document.querySelector('#display-name').value = myName
    error.textContent = 'Your browser session expired. Enter your name to rejoin.'
    connection.textContent = 'REJOIN'; return
  }
  if ('myVote' in next) myVote = next.myVote
  if ('myHunt' in next && (next.myHunt?.last?.receipt || 0) >= (myHunt?.last?.receipt || 0)) myHunt = next.myHunt
  if (next.myName) { myName = next.myName; document.querySelector('#player-name').textContent = `Playing as ${myName}` }
  changeRoom.hidden = false
  if (activityChanged) {
    error.textContent = ''
    if (next.activity !== 'hunt') stopFactors()
  }
  const newGuess = oldReceipt !== myHunt?.last?.receipt
  if (newGuess || oldVote !== myVote) error.textContent = ''
  if (next.activity === 'hunt' && myHunt?.last && (newGuess || activityChanged)) startFactors(myHunt.last)
  const changed = !previous || previous.controlRevision !== next.controlRevision || activityChanged || oldVote !== myVote || newGuess
  if (changed || game.hidden) render()
  else updateHuntStats()
}
function setConnection(status) {
  if (!snapshot) { connected = false; return }
  connected = status === 'live'
  connection.textContent = connected ? 'LIVE' : 'RECONNECTING'
  // Updating disabled states preserves focus and a partially typed number.
  for (const button of game.querySelectorAll('.vote-buttons button')) button.disabled = busy || !connected
  updateHuntStats()
}
async function vote(valid) {
  if (busy || !connected || snapshot?.activity !== 'proof' || snapshot.phase !== 'open') return
  const code = roomCode, votedRound = snapshot.round, controlRevision = snapshot.controlRevision
  busy = true; error.textContent = ''; render()
  try {
    const state = await requestJSON(`/api/rooms/${code}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ round: votedRound, valid, controlRevision }) })
    if (roomCode === code) receive(state)
  } catch (e) {
    if (roomCode === code && snapshot.activity === 'proof' && snapshot.round === votedRound) error.textContent = e.message
    void stream?.sync()
  } finally { busy = false; render() }
}
async function connect(code, name) {
  if (joining) return
  const normalized = String(code).toUpperCase().trim()
  if (!/^[A-Z2-9]{6}$/.test(normalized)) { error.textContent = 'Use the six-character room code.'; return }
  joining = true; error.textContent = ''; const submit = document.querySelector('#join-form button'); submit.disabled = true
  try {
    const state = await requestJSON(`/api/rooms/${normalized}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    stream?.close(); stopFactors(); snapshot = null; myHunt = null; myVote = null
    roomCode = normalized; huntDraft = ''; pendingGuess = null
    writeSaved('proofs-player-room', roomCode)
    history.replaceState(null, '', `/join/${roomCode}`)
    receive(state); setConnection('connecting')
    stream = watchRoom(roomCode, {
      onState: receive, onConnection: setConnection,
      onMissing(message) {
        stopFactors(); connected = false; snapshot = null; myHunt = null; myVote = null
        game.hidden = true; join.hidden = false; connection.textContent = 'ROOM EXPIRED'
        changeRoom.hidden = true
        document.querySelector('#player-name').textContent = ''; error.textContent = message
        writeSaved('proofs-player-room', null)
      },
    })
  } catch (e) { error.textContent = e.message; connection.textContent = 'NOT CONNECTED'; join.hidden = false }
  finally { joining = false; submit.disabled = false }
}
document.querySelector('#join-form').addEventListener('submit', event => { event.preventDefault(); void connect(document.querySelector('#room-code').value, document.querySelector('#display-name').value) })
changeRoom.addEventListener('click', () => {
  stream?.close(); stopFactors(); snapshot = null; connected = false; roomCode = ''
  myVote = null; myHunt = null; pendingGuess = null; huntDraft = ''
  writeSaved('proofs-player-room', null); history.replaceState(null, '', '/join')
  game.replaceChildren(); game.hidden = true; join.hidden = false; changeRoom.hidden = true
  document.querySelector('#player-name').textContent = ''
  document.querySelector('#room-code').value = ''; document.querySelector('#display-name').value = myName
  error.textContent = ''; connection.textContent = 'READY TO JOIN'; document.querySelector('#room-code').focus()
})
connection.textContent = 'READY TO JOIN'
async function resume() {
  if (!roomCode || snapshot || joining || document.visibilityState === 'hidden') return
  document.querySelector('#room-code').value = roomCode
  try {
    const me = await requestJSON(`/api/rooms/${roomCode}/me`)
    if (me.joined) await connect(roomCode)
    else connection.textContent = 'READY TO JOIN'
  } catch (e) {
    if (e.status === 404) { writeSaved('proofs-player-room', null); error.textContent = e.message; connection.textContent = 'ROOM EXPIRED' }
    else { connection.textContent = 'RECONNECTING'; error.textContent = 'Waiting for a connection. You can also join using the form.' }
  }
}
void resume()
window.addEventListener('online', resume)
window.addEventListener('pageshow', resume)
document.addEventListener('visibilitychange', resume)

function updateHuntStats() {
  if (!snapshot) return
  const clock = document.querySelector('#hunt-clock')
  if (clock) clock.textContent = snapshot.hunt.phase === 'lobby' ? '60' : snapshot.hunt.phase === 'paused' ? String(Math.ceil(snapshot.hunt.remainingMs / 1000)).padStart(2, '0') : String(Math.max(0, Math.ceil((snapshot.hunt.endsAt - Date.now() - clockOffset) / 1000))).padStart(2, '0')
  const stats = document.querySelector('#hunt-stats')
  if (stats) stats.textContent = `${snapshot.hunt.attempts} class guesses · ${snapshot.hunt.found} found a shared factor`
  const submit = document.querySelector('#guess-form button')
  if (submit) submit.disabled = busy || !connected || snapshot.hunt.phase !== 'open' || Date.now() + clockOffset >= snapshot.hunt.endsAt
}
setInterval(updateHuntStats, 100)
function startFactors(result) {
  factorWorker?.terminate(); factors = null; const id = ++factorId
  if (snapshot?.activity !== 'hunt') return
  const unavailable = () => { if (id !== factorId) return; factors = { error: 'Factorization unavailable. The shared-factor test is still exact.' }; renderFactorPanels() }
  try {
    factorWorker = new Worker('/voting/factor-worker.js', { type: 'module' })
    factorWorker.onmessage = ({ data }) => {
      if (data.id !== factorId) return
      const changed = !factors || data.error || data.a?.version !== factors.a?.version || data.b?.version !== factors.b?.version
      factors = data
      if (!data.running) factorWorker.terminate()
      if (changed) renderFactorPanels()
      updateFactorStatus()
    }
    factorWorker.onerror = unavailable
    factorWorker.postMessage({ id, a: result.a, b: result.b })
  } catch { unavailable() }
}
function integerDetails(label, value, key = label) {
  const details = make('details', 'integer-details'), summary = make('summary', '', `${label} = ${compact(value)}`)
  details.dataset.factorKey = key
  details.append(summary, make('p', 'full-integer', value)); return details
}
function factorProduct(terms, remainder = false, abbreviated = false) {
  const line = make('p', 'factor-list')
  for (const [i, term] of terms.entries()) {
    if (i) line.append(document.createTextNode(' × '))
    if (term === '…') { line.append(document.createTextNode('…')); continue }
    const label = abbreviated && term.prime.length > 14 ? `${term.prime.slice(0, 6)}…${term.prime.slice(-4)}` : term.prime
    const value = make('span', '', label)
    if (term.exponent > 1) value.append(make('sup', '', term.exponent))
    line.append(value)
  }
  if (remainder) line.append(document.createTextNode(`${terms.length ? ' × ' : ''}R`))
  return line
}
function updateFactorStatus() {
  const status = document.querySelector('#factor-progress')
  if (!status || !factors || factors.error) return
  status.textContent = factors.running
    ? '● Live factorization'
    : '✓ Factorization complete'
}
function renderFactorPanels() {
  const panels = document.querySelector('#factor-panels'); if (!panels || !myHunt?.last) return
  const open = new Set([...panels.querySelectorAll('details[open]')].map(el => el.dataset.factorKey))
  panels.replaceChildren()
  if (!factors) { panels.append(make('p', 'quiet', 'Starting the factor search on your device…')); return }
  if (factors.error) { panels.append(make('p', 'quiet', factors.error)); return }
  const status = make('p', 'factor-progress'); status.id = 'factor-progress'; panels.append(status)
  const details = make('details', 'factor-more'); details.dataset.factorKey = 'all-details'
  details.append(make('summary', '', 'Full numbers & details'))
  for (const key of ['a', 'b']) {
    const f = factors[key], row = make('div', 'factor-simple-row')
    row.append(make('strong', 'factor-name', `${key.toUpperCase()} =`))
    const short = f.factors.length > 5 ? [...f.factors.slice(0, 3), '…', f.factors.at(-1)] : f.factors
    const product = factorProduct(short, false, true)
    if (!f.complete) {
      if (short.length) product.append(document.createTextNode(' × '))
      product.append(make('span', 'factor-unresolved', 'remaining piece'))
    } else if (!short.length) product.append(document.createTextNode('1'))
    row.append(product); panels.append(row)
    const full = make('section', 'factor-detail-section')
    full.append(integerDetails(key.toUpperCase(), myHunt.last[key], `${key}.value`))
    if (f.factors.length) full.append(factorProduct(f.factors, !f.complete))
    if (!f.complete) {
      full.append(integerDetails('R (remaining piece)', f.remainder, `${key}.remainder`))
      if (f.pending.some(part => part.status === 'probable-prime')) full.append(make('p', 'quiet', 'The remaining piece includes a probable prime, not yet proven.'))
    }
    details.append(full)
  }
  details.append(make('p', 'quiet', 'Shown factors are proven prime. R is everything still unresolved. Runs on your device while you are in the number hunt.'))
  panels.append(details)
  for (const details of panels.querySelectorAll('details')) details.open = open.has(details.dataset.factorKey)
  updateFactorStatus()
}
function renderHunt() {
  const h = snapshot.hunt
  const draft = document.querySelector('#guess-input')?.value ?? huntDraft
  huntDraft = draft
  game.replaceChildren(); game.hidden = false; join.hidden = true
  game.append(make('p','eyebrow',`ROOM ${snapshot.code} / BREAK THE PATTERN`),make('h1','','One shared factor.'))
  game.append(math('A=n^{17}+9', 'hunt-formula'), math('B=(n+1)^{17}+9', 'hunt-formula'),make('p','','Find a nonnegative integer n such that A and B share a factor greater than 1.'))
  if (h.phase === 'revealed') {
    game.append(make('h2','','The first counterexample'),make('div','full-integer reveal-number',h.reveal.n),make('p','','Both numbers are divisible by:'),make('div','full-integer',h.reveal.gcd),make('p','quiet','One counterexample defeats the universal claim. Keep this page open for Proof or Bluff later.'))
    return
  }
  const clock = make('div','phone-clock'); clock.id='hunt-clock'; game.append(clock)
  const stats = make('p','quiet'); stats.id='hunt-stats'; game.append(stats)
  if (h.phase === 'lobby') game.append(make('p','','You are in. The host will start a 60-second countdown. Any nonnegative whole number up to 100 digits is allowed.'))
  if (h.phase === 'open') {
    const form = make('form'); form.id='guess-form'
    const label = make('label','','Your input n'); label.htmlFor='guess-input'
    const input = make('input'); input.id='guess-input'; input.type='text'; input.inputMode='numeric'; input.maxLength=100; input.autocomplete='off'; input.value=draft; input.required=true
    input.addEventListener('input', () => { huntDraft = input.value })
    const submit = make('button','','Test my input'); submit.type='submit'
    form.append(label,input,submit); form.addEventListener('submit',submitGuess); game.append(form,make('p','quiet','Enter digits only. Up to 100 digits, with no rounding.'))
  }
  if (h.phase === 'paused') game.append(make('h2', '', 'Paused'), make('p', '', 'The host will resume the hunt.'))
  if (h.phase === 'closed') game.append(make('h2',"","Time's up."),make('p','','Watch the screen for the reveal.'))
  if (myHunt?.last) {
    const r = myHunt.last
    game.append(make('p','eyebrow',`YOUR GUESS ${myHunt.attempts} · RECEIPT #${r.receipt}`),integerDetails('n',r.n),make('h2','',r.found?'You found a shared factor!':'No shared factor above 1.'),integerDetails('GCD',r.gcd))
    const panels=make('div'); panels.id='factor-panels'; game.append(panels); renderFactorPanels()
  }
  updateHuntStats()
}
async function submitGuess(event) {
  event.preventDefault()
  if (busy || !connected || snapshot?.activity !== 'hunt' || snapshot.hunt.phase !== 'open') return
  let value
  try { value = normalizeInput(document.querySelector('#guess-input').value) }
  catch (e) { error.textContent = e.message; return }
  const code = roomCode, controlRevision = snapshot.controlRevision
  if (!pendingGuess || pendingGuess.n !== value || pendingGuess.controlRevision !== controlRevision) pendingGuess = { n: value, controlRevision, requestId: crypto.randomUUID() }
  busy = true; error.textContent = ''; updateHuntStats()
  try {
    const data = await requestJSON(`/api/rooms/${code}/guess`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pendingGuess) })
    pendingGuess = null
    if (roomCode === code && data.receipt > (myHunt?.last?.receipt || 0)) {
      myHunt = { attempts: data.attempts, last: data }; startFactors(data)
    }
  } catch (e) {
    if (!e.uncertain) pendingGuess = null
    if (roomCode === code && snapshot?.activity === 'hunt') error.textContent = e.message
    void stream?.sync()
  } finally { busy = false; render() }
}
