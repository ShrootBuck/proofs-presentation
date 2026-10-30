import katex from '/vendor/katex.mjs'
const game = document.querySelector('#game')
const join = document.querySelector('#join-panel')
const error = document.querySelector('#error')
const connection = document.querySelector('#connection')
let roomCode = location.pathname.split('/')[2] || ''
let snapshot, myVote = null, stream, busy = false, myHunt = null, clockOffset = 0, myName = ''
let factorWorker, factorId = 0, factors = null
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
  if (state.phase === 'open') {
    const buttons = make('div', 'vote-buttons')
    for (const [valid, letter, label] of [[true, 'A', 'Valid proof'], [false, 'B', 'Broken proof']]) {
      const button = make('button', myVote === valid ? 'selected' : '')
      button.append(make('span', '', letter), make('strong', '', label)); button.setAttribute('aria-pressed', String(myVote === valid)); button.disabled = busy
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
  if (snapshot && myHunt?.last && (snapshot.activity === 'proof' || snapshot.hunt.phase === 'revealed')) {
    const history = make('details'); history.id = 'previous-factors'; history.open = Boolean(wasOpen)
    history.append(make('summary', '', 'Your previous factorization'))
    const panels = make('div'); panels.id = 'factor-panels'; history.append(panels); game.append(history); renderFactorPanels()
  }
}
async function vote(valid) {
  if (busy) return; busy = true; error.textContent = ''; render()
  try {
    const response = await fetch(`/api/rooms/${roomCode}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ round: snapshot.round, valid }) })
    const data = await response.json(); if (!response.ok) throw new Error(data.error)
    myVote = data.myVote
  } catch (e) { error.textContent = e.message } finally { busy = false; render() }
}
async function connect(code, name) {
  error.textContent = ''; roomCode = code.toUpperCase().trim()
  if (!/^[A-Z2-9]{6}$/.test(roomCode)) { error.textContent = 'Use the six-character room code.'; return }
  try {
    const response = await fetch(`/api/rooms/${roomCode}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }); const state = await response.json()
    if (!response.ok) throw new Error(state.error)
    snapshot = state; myName = state.myName; document.querySelector('#player-name').textContent = `Playing as ${myName}`; myVote = state.myVote; myHunt = state.myHunt; clockOffset = state.serverTime - Date.now(); if (myHunt?.last) startFactors(myHunt.last); render(); history.replaceState(null, '', `/join/${roomCode}`)
    stream?.close(); stream = new EventSource(`/api/rooms/${roomCode}/events`)
    stream.onopen = () => { connection.textContent = 'LIVE'; error.textContent = '' }
    stream.onerror = () => { connection.textContent = 'RECONNECTING'; error.textContent = 'Connection interrupted. Reconnecting automatically.' }
    stream.onmessage = async event => {
      const next = JSON.parse(event.data)
      if (snapshot?.round !== next.round) myVote = null
      const previous = snapshot; snapshot = next; clockOffset = next.serverTime - Date.now();
      if (next.activity === 'hunt' && previous?.activity === 'hunt' && next.hunt.phase === previous.hunt.phase) updateHuntStats()
      else render()
    }
  } catch (e) { error.textContent = e.message; connection.textContent = 'NOT CONNECTED'; join.hidden = false }
}
document.querySelector('#join-form').addEventListener('submit', event => { event.preventDefault(); connect(document.querySelector('#room-code').value, document.querySelector('#display-name').value) })
connection.textContent = 'READY TO JOIN'
if (roomCode) {
  document.querySelector('#room-code').value = roomCode
  fetch(`/api/rooms/${roomCode}/me`).then(r => r.json()).then(me => { if (me.joined) connect(roomCode) }).catch(() => {})
}

function updateHuntStats() {
  const clock = document.querySelector('#hunt-clock')
  if (clock) clock.textContent = snapshot.hunt.phase === 'lobby' ? '60' : String(Math.max(0, Math.ceil((snapshot.hunt.endsAt - Date.now() - clockOffset) / 1000))).padStart(2, '0')
  const stats = document.querySelector('#hunt-stats')
  if (stats) stats.textContent = `${snapshot.hunt.attempts} class guesses · ${snapshot.hunt.found} found a shared factor`
  const submit = document.querySelector('#guess-form button')
  if (submit) submit.disabled = busy || Date.now() + clockOffset >= snapshot.hunt.endsAt
}
setInterval(updateHuntStats, 100)
function startFactors(result) {
  factorWorker?.terminate(); factors = null; const id = ++factorId
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
function factorProduct(terms, remainder = false) {
  const line = make('p', 'factor-list')
  for (const [i, term] of terms.entries()) {
    if (i) line.append(document.createTextNode(' × '))
    if (term === '…') { line.append(document.createTextNode('…')); continue }
    const value = make('span', '', term.prime)
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
    ? `Factoring on your device · ${Math.floor(factors.elapsed)}s · still searching`
    : `Both factorizations complete · ${factors.elapsed.toFixed(1)}s`
}
function renderFactorPanels() {
  const panels = document.querySelector('#factor-panels'); if (!panels || !myHunt?.last) return
  const open = new Set([...panels.querySelectorAll('details[open]')].map(el => el.dataset.factorKey))
  panels.replaceChildren()
  if (!factors) { panels.append(make('p', 'quiet', 'Starting the factor search on your device…')); return }
  if (factors.error) { panels.append(make('p', 'quiet', factors.error)); return }
  const status = make('p', 'factor-progress'); status.id = 'factor-progress'; panels.append(status)
  panels.append(make('p', 'quiet', 'The search keeps running. A new guess replaces it; closing this tab stops it.'))
  for (const key of ['a', 'b']) {
    const f = factors[key], card = make('section', 'factor-card')
    card.append(integerDetails(key.toUpperCase(), myHunt.last[key], `${key}.value`))
    card.append(make('p', 'factor-label', f.complete ? 'Complete prime factorization' : 'Proven prime factors × remaining piece'))
    const short = f.factors.length > 10 ? [...f.factors.slice(0, 4), '…', f.factors.at(-1)] : f.factors
    card.append(factorProduct(short, !f.complete))
    if (f.factors.length > 10) {
      const all = make('details'); all.dataset.factorKey = `${key}.all`
      all.append(make('summary', '', `Show all ${f.factors.length} prime terms`), factorProduct(f.factors)); card.append(all)
    }
    if (!f.complete) {
      card.append(integerDetails('R', f.remainder, `${key}.remainder`))
      for (const [i, part] of f.pending.entries()) {
        const label = part.status === 'probable-prime' ? 'Probable prime — not proven; search continues' : part.status === 'composite' ? 'Composite — looking for a factor' : 'Checking this remaining piece'
        card.append(make('p', 'factor-label', label))
        if (f.pending.length > 1) card.append(integerDetails(`Piece ${i + 1}`, part.value, `${key}.piece.${part.value}`))
      }
      card.append(make('p', 'quiet', 'The full prime-factor product × R equals the original number exactly.'))
    }
    panels.append(card)
  }
  for (const details of panels.querySelectorAll('details')) details.open = open.has(details.dataset.factorKey)
  updateFactorStatus()
}
function renderHunt() {
  const h = snapshot.hunt
  const draft = document.querySelector('#guess-input')?.value || ''
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
    const submit = make('button','','Test my input'); submit.type='submit'
    form.append(label,input,submit); form.addEventListener('submit',submitGuess); game.append(form,make('p','quiet','Enter digits only. Up to 100 digits, with no rounding.'))
  }
  if (h.phase === 'closed') game.append(make('h2',"","Time's up."),make('p','','Watch the screen for the reveal.'))
  if (myHunt?.last) {
    const r = myHunt.last
    game.append(make('p','eyebrow',`YOUR GUESS ${myHunt.attempts} · RECEIPT #${r.receipt}`),integerDetails('n',r.n),make('h2','',r.found?'You found a shared factor!':'No shared factor above 1.'),integerDetails('GCD',r.gcd))
    const panels=make('div'); panels.id='factor-panels'; game.append(panels); renderFactorPanels()
  }
  updateHuntStats()
}
async function submitGuess(event) {
  event.preventDefault(); if (busy) return
  const value=document.querySelector('#guess-input').value
  busy=true; error.textContent=''; updateHuntStats()
  try {
    const response=await fetch(`/api/rooms/${roomCode}/guess`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({n:value})})
    const data=await response.json(); if(!response.ok) throw new Error(data.error)
    myHunt={attempts:data.attempts,last:data}; startFactors(data)
  } catch(e) { error.textContent=e.message } finally { busy=false; render() }
}
