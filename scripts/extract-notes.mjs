import fs from 'node:fs/promises'
const markdown = await fs.readFile(new URL('../slides.md', import.meta.url), 'utf8')
const notes = [...markdown.matchAll(/<!--\n([\s\S]*?)\n-->/g)].map((match, index) => `## Slide ${index + 1}\n\n${match[1]}`)
const output = `# Prove It: presenter script\n\nZayd Krunz · Capstone Differential Equations\n\nThe script below is also embedded in Slidev's presenter notes. Read the prose aloud. Bracketed directions and reference lists are not spoken. [click] means advance one animation step with Right Arrow or Space. On interactive slides, use the visible buttons.\n\n${notes.join('\n\n---\n\n')}\n`
await fs.writeFile(new URL('../presenter-script.md', import.meta.url), output)
const spoken = notes.slice(0, 26).join(' ').replace(/\[[\s\S]*?\]/g, '').replace(/TIME:[^\n]*/g, '').replace(/## Slide \d+/g, '')
console.log(`Extracted ${notes.length} note sections; approximately ${spoken.trim().split(/\s+/).length} spoken words.`)
