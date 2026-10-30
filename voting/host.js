const form = document.querySelector('#host-form')
const error = document.querySelector('#error')
const result = document.querySelector('#room-result')
function showRoom(room) {
  result.hidden = false
  result.replaceChildren()
  const label = document.createElement('p'); label.textContent = 'Your room is ready.'
  const code = document.createElement('div'); code.className = 'big-code'; code.textContent = room.code
  const qr = document.createElement('img'); qr.className = 'qr'; qr.src = `/api/rooms/${room.code}/qr.svg`; qr.alt = 'Scan to join the game'
  const deck = document.createElement('a'); deck.className = 'button'; deck.href = '/#/1'; deck.textContent = 'Open the presentation'
  const presenter = document.createElement('a'); presenter.className = 'button secondary'; presenter.href = '/#/presenter/1'; presenter.target = '_blank'; presenter.textContent = 'Open presenter view'
  const game = document.createElement('a'); game.className = 'button secondary'; game.href = '/#/2'; game.textContent = 'Preview the opening hunt'
  const hint = document.createElement('p'); hint.className = 'quiet'; hint.textContent = `Public join link: ${room.joinUrl}`
  result.append(label, code, qr, deck, presenter, game, hint)
}
try {
  const saved = JSON.parse(localStorage.getItem('proofs-live-room') || 'null')
  if (saved) fetch(`/api/rooms/${saved.code}`).then(r => r.ok ? r.json() : null).then(room => { if (room) showRoom(room) })
} catch {}
form.addEventListener('submit', async event => {
  event.preventDefault(); error.textContent = ''
  const button = form.querySelector('button'); button.disabled = true
  try {
    const response = await fetch('/api/rooms', { method: 'POST', headers: { Authorization: `Bearer ${document.querySelector('#host-key').value}` } })
    const room = await response.json(); if (!response.ok) throw new Error(room.error)
    localStorage.setItem('proofs-live-room', JSON.stringify({ code: room.code, hostToken: room.hostToken }))
    document.querySelector('#host-key').value = ''
    showRoom(room)
  } catch (e) { error.textContent = e.message } finally { button.disabled = false }
})
