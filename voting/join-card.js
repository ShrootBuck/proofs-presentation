const make = (tag, cls, text) => {
  const el = document.createElement(tag)
  if (cls) el.className = cls
  if (text !== undefined) el.textContent = text
  return el
}

let imageMode = 'artwork'
try { if (sessionStorage.getItem('proofs-join-image') === 'normal') imageMode = 'normal' } catch {}

function updateImage(image) {
  image.src = `/qr/${imageMode}.png`
  image.alt = imageMode === 'artwork' ? 'Scan this artwork to join the classroom activities' : 'Scan this QR code to join the classroom activities'
}

function setImageMode(mode) {
  imageMode = mode
  try { sessionStorage.setItem('proofs-join-image', mode) } catch {}
  document.querySelectorAll('.host-join-image').forEach(updateImage)
  document.querySelectorAll('.host-qr-toggle').forEach(button => { button.textContent = mode === 'artwork' ? 'Show normal QR' : 'Show artwork' })
}

function joinImage() {
  const image = make('img', 'host-join-image')
  updateImage(image)
  image.addEventListener('error', () => { if (imageMode === 'artwork') setImageMode('normal') })
  return image
}

function toggleButton() {
  const button = make('button', 'secondary host-qr-toggle', imageMode === 'artwork' ? 'Show normal QR' : 'Show artwork')
  button.type = 'button'
  button.addEventListener('click', () => setImageMode(imageMode === 'artwork' ? 'normal' : 'artwork'))
  return button
}

function joinDetails(room) {
  const details = make('div', 'host-join-details')
  const address = make('a', 'host-join-address', `${new URL(room.joinUrl).host}/join`)
  address.href = '/join'; address.target = 'proofs-student'
  details.append(make('p', 'eyebrow', 'ROOM CODE'), make('div', 'host-room-code', room.code), address, make('p', 'quiet', 'Enter this code and your name. Keep the page open for both activities.'))
  return details
}

function enlarge(room) {
  const dialog = make('dialog', 'host-join-dialog')
  dialog.setAttribute('aria-labelledby', 'join-dialog-title')
  const stage = make('div', 'host-join-stage'), image = joinImage(), details = joinDetails(room)
  const title = make('h2', '', 'Join the room.'); title.id = 'join-dialog-title'
  details.prepend(make('p', 'eyebrow', 'SCAN THE IMAGE'), title)
  const close = make('button', 'host-qr-close', 'Back to activity')
  close.type = 'button'; close.addEventListener('click', () => dialog.close())
  details.append(toggleButton(), close)
  stage.append(image, details); dialog.append(stage); document.body.append(dialog)
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close() })
  dialog.showModal()
}

export function createJoinCard(room) {
  const card = make('aside', 'host-join'), preview = make('button', 'host-qr-preview')
  preview.type = 'button'; preview.setAttribute('aria-label', 'Enlarge join image')
  preview.append(joinImage()); preview.addEventListener('click', () => enlarge(room))
  const details = joinDetails(room), controls = make('div', 'host-qr-controls')
  const expand = make('button', 'host-text-button', 'Enlarge')
  expand.type = 'button'; expand.addEventListener('click', () => enlarge(room))
  controls.append(toggleButton(), expand); details.append(controls)
  card.append(preview, details)
  return card
}
