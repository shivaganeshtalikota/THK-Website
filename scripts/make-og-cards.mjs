/**
 * Build the link-preview cards (og:image) — the picture WhatsApp, Facebook,
 * X, LinkedIn and Telegram show when somebody shares a link to the site.
 *
 * WHY HEADLESS CHROME AND NOT PILLOW
 * Half of these cards are in Telugu, and Pillow here is built without raqm, so
 * it cannot shape Telugu: conjuncts and vowel signs come out reordered or
 * broken (see scripts/make-poster-cards.py). A browser shapes it correctly, and
 * it sets the type in the site's own fonts — Playfair Display, Inter, Anek
 * Telugu and Noto Sans Telugu — straight from public/fonts.
 *
 * WHAT IT MAKES (1200x630 JPEG, the size every platform documents)
 *   og/talikota-hari-krishna.jpg                    every English page
 *   og/talikota-hari-krishna-te.jpg                 every Telugu page
 *   og/kanaka-durga-temple-board-member.jpg         the temple board page
 *   og/kanaka-durga-temple-board-member-te.jpg      its Telugu twin
 *   og-image.jpg                                    a copy of the first, for
 *                                                   links shared before the
 *                                                   cards moved to /og/
 *
 * The file names carry the words people search for. The URL changing is also
 * what makes WhatsApp and Facebook fetch the new picture: both cache a card by
 * its image URL, so replacing the bytes at the old address leaves every earlier
 * share showing the old card.
 *
 * Run:  node scripts/make-og-cards.mjs
 * Needs Chrome (set CHROME_PATH if it is not in the default place). The output
 * is committed, like the photo derivatives, so the build does not need Chrome.
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const ROOT = resolve(import.meta.dirname, '..')
const PUBLIC = join(ROOT, 'public')
const W = 1200
const H = 630

const CHROME =
  process.env.CHROME_PATH ||
  {
    win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  }[process.platform] ||
  'google-chrome'

const HOST = 'talikotaharikrishna.com'

/*
 * The photographs. The bonam frame is the default because it carries both of
 * his roles at once: the golden bonam he is carrying was offered to Sri Kanaka
 * Durga Ammavaru of Vijayawada, and he is in the party's yellow. The temple
 * card uses the gopuram frame, where the building is the subject.
 */
const BONAM = { src: '/photos/bonalu-bangaru-bonam.jpg', focus: '47% 42%', zoom: 1.3 }
const GOPURAM = { src: '/photos/kuchipudi-natya-kshetram-2048.webp', focus: '46% 38%', zoom: 1.18 }

const CARDS = [
  {
    out: 'og/talikota-hari-krishna.jpg',
    lang: 'en',
    photo: BONAM,
    eyebrow: 'Sri Kanaka Durga Temple · Vijayawada',
    name: ['Talikota', 'Hari Krishna'],
    role: 'Trust Board Member',
    org: ['Sri Durga Malleswara Swamy Varla Devasthanam, Indrakeeladri'],
    extra: { lang: 'te', text: 'శ్రీ కనకదుర్గ ఆలయ ధర్మకర్తల మండలి సభ్యులు' },
    footer: 'Telugu Desam Party · Hyderabad',
  },
  {
    out: 'og/talikota-hari-krishna-te.jpg',
    lang: 'te',
    photo: BONAM,
    eyebrow: 'శ్రీ కనకదుర్గ ఆలయం · ఇంద్రకీలాద్రి, విజయవాడ',
    name: ['తాళికోట', 'హరికృష్ణ'],
    role: 'ధర్మకర్తల మండలి సభ్యులు',
    org: ['శ్రీ దుర్గా మల్లేశ్వర స్వామి వార్ల దేవస్థానం, ఇంద్రకీలాద్రి'],
    extra: { lang: 'en', text: 'Talikota Hari Krishna · Trust Board Member, Sri Kanaka Durga Temple' },
    footer: 'తెలుగుదేశం పార్టీ · హైదరాబాద్',
  },
  {
    out: 'og/kanaka-durga-temple-board-member.jpg',
    lang: 'en',
    photo: GOPURAM,
    eyebrow: 'Indrakeeladri · Vijayawada',
    title: ['Kanaka Durga', 'Temple Board'],
    role: 'Talikota Hari Krishna, Board Member',
    org: ['One of 16 members appointed by the A.P. government', 'Sworn in on 11 October 2025'],
    extra: { lang: 'en', text: 'Sri Durga Malleswara Swamy Varla Devasthanam' },
    footer: 'Vijayawada, Andhra Pradesh',
  },
  {
    out: 'og/kanaka-durga-temple-board-member-te.jpg',
    lang: 'te',
    photo: GOPURAM,
    eyebrow: 'ఇంద్రకీలాద్రి · విజయవాడ',
    title: ['కనకదుర్గ ఆలయ', 'ధర్మకర్తల మండలి'],
    role: 'తాళికోట హరికృష్ణ, సభ్యులు',
    org: ['ఆంధ్రప్రదేశ్ ప్రభుత్వం నియమించిన 16 మంది సభ్యులలో ఒకరు', '11 అక్టోబర్ 2025న ప్రమాణ స్వీకారం'],
    extra: { lang: 'en', text: 'Talikota Hari Krishna · Kanaka Durga Temple Trust Board Member' },
    footer: 'శ్రీ దుర్గా మల్లేశ్వర స్వామి వార్ల దేవస్థానం',
  },
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function cardHtml(c) {
  const te = c.lang === 'te'
  // Telugu display type is Anek Telugu (the poster face); body Telugu is Noto
  // Sans Telugu. English display is Playfair Display, body Inter.
  const display = te ? `'Anek Telugu', 'Noto Sans Telugu', sans-serif` : `'Playfair Display', Georgia, serif`
  const body = te ? `'Noto Sans Telugu', Inter, sans-serif` : `Inter, system-ui, sans-serif`
  const big = c.name || c.title
  // A title ("Kanaka Durga Temple / Trust Board") is longer than a name, so it
  // sets smaller.
  const bigSize = c.name ? (te ? 96 : 92) : te ? 70 : 76
  const photo = c.photo
  return `<!doctype html><html lang="${c.lang}"><head><meta charset="utf-8">
<style>
${readFileSync(join(ROOT, 'src', 'styles', 'fonts.css'), 'utf8')}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#0A0A09}
.card{position:relative;width:${W}px;height:${H}px;display:flex}
.text{position:relative;width:690px;height:100%;padding:58px 56px 0 64px;display:flex;flex-direction:column;color:#fff}
.eyebrow{font:600 ${te ? 20 : 17}px/1.3 ${body};letter-spacing:${te ? '0.02em' : '0.16em'};text-transform:uppercase;color:#FFD700}
.big{margin-top:${c.name ? 26 : 30}px;font-family:${display};font-weight:800;font-size:${bigSize}px;line-height:${te ? 1.12 : 1.0};letter-spacing:${te ? '0' : '-0.02em'};color:#fff}
.big span{display:block;white-space:nowrap}
.rule{margin-top:${te ? 22 : 28}px;width:112px;height:6px;background:#FFD700}
.role{margin-top:26px;font:600 ${te ? 30 : 31}px/1.25 ${body};color:#fff}
.org{margin-top:8px;font:400 ${te ? 21 : 21}px/1.4 ${body};color:rgba(255,255,255,.74);max-width:560px}
.extra{margin-top:14px;font:500 ${c.extra.lang === 'te' ? 21 : 17}px/1.35 ${c.extra.lang === 'te' ? `'Noto Sans Telugu', sans-serif` : 'Inter, sans-serif'};color:#F7C948}
.foot{position:absolute;left:64px;right:56px;bottom:0;height:64px;border-top:1px solid rgba(255,255,255,.16);display:flex;align-items:center;justify-content:space-between;gap:24px;white-space:nowrap;font:500 ${te ? 17 : 16}px/1 ${body};color:rgba(255,255,255,.66)}
.foot b{flex:none;font:700 15px/1 Inter,sans-serif;letter-spacing:.14em;color:#FFD700}
.bar{width:8px;height:100%;background:#FFD700}
.photo{position:relative;flex:1;height:100%;overflow:hidden;background:#141413}
.photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${photo.focus};transform:scale(${photo.zoom || 1});transform-origin:${photo.focus}}
</style></head><body><div class="card">
<div class="text">
  <p class="eyebrow">${esc(c.eyebrow)}</p>
  <h1 class="big">${big.map((l) => `<span>${esc(l)}</span>`).join('')}</h1>
  <div class="rule"></div>
  <p class="role">${esc(c.role)}</p>
  <p class="org">${c.org.map(esc).join('<br>')}</p>
  <p class="extra" lang="${c.extra.lang}">${esc(c.extra.text)}</p>
  <div class="foot"><span>${esc(c.footer)}</span><b>${HOST.toUpperCase()}</b></div>
</div>
<div class="bar"></div>
<div class="photo"><img src="${photo.src}" alt=""></div>
</div></body></html>`
}

// ---- a static server over public/, so /fonts and /photos resolve ------------
const TYPES = { '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png' }
const pages = new Map()
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (pages.has(path)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end(pages.get(path))
  }
  const file = join(PUBLIC, path)
  if (!file.startsWith(PUBLIC) || !existsSync(file)) {
    res.writeHead(404)
    return res.end()
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
  res.end(readFileSync(file))
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
CARDS.forEach((c, i) => pages.set(`/__card${i}.html`, cardHtml(c)))

// ---- Chrome, driven over the DevTools protocol -------------------------------
const PORT = 9400 + Math.floor(Math.random() * 400)
const PROFILE = join(tmpdir(), `thk-og-${process.pid}`)
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let wsUrl
for (let i = 0; i < 150 && !wsUrl; i++) {
  await sleep(200)
  try {
    wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl
  } catch {
    // not up yet
  }
}
if (!wsUrl) throw new Error(`Chrome did not start (${CHROME}). Set CHROME_PATH.`)
const ws = new WebSocket(wsUrl)
await new Promise((r) => ws.addEventListener('open', r))
let seq = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
  }
})
const send = (method, params = {}) =>
  new Promise((r) => {
    const id = ++seq
    pending.set(id, r)
    ws.send(JSON.stringify({ id, method, params }))
  })
const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value

try {
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })
  mkdirSync(join(PUBLIC, 'og'), { recursive: true })
  for (const [i, c] of CARDS.entries()) {
    await send('Page.navigate', { url: `${base}/__card${i}.html` })
    await sleep(300)
    // Every font face and the photograph, loaded — a card captured a moment
    // early is set in a fallback face.
    const ready = await ev(`(async () => {
      await document.fonts.ready
      const img = document.querySelector('img')
      if (!img.complete) await new Promise((r) => { img.onload = img.onerror = r })
      const lines = (el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight))
      const foot = document.querySelector('.foot')
      if (foot.scrollWidth > foot.clientWidth + 1) return { img: 1, fonts: [], over: ['footer: ' + foot.textContent] }
      const wrapped = [...document.querySelectorAll('.eyebrow, .role, .extra')].filter((el) => lines(el) > 1)
      if (wrapped.length) return { img: 1, fonts: [], over: wrapped.map((el) => 'wraps: ' + el.textContent) }
      const over = [...document.querySelectorAll('.big span, .role, .org, .extra, .eyebrow')].filter((el) => el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().right > 690 - 40)
      return { img: img.naturalWidth, fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight), over: over.map((el) => el.textContent) }
    })()`)
    if (!ready.img) throw new Error(`${c.out}: photograph did not load`)
    if (ready.over.length) throw new Error(`${c.out}: text runs past the panel: ${ready.over.join(' | ')}`)
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: W, height: H, scale: 1 } })
    writeFileSync(join(PUBLIC, c.out), Buffer.from(shot.result.data, 'base64'))
    console.log(`  ${c.out}  (${new Set(ready.fonts).size} font faces)`)
  }
  copyFileSync(join(PUBLIC, CARDS[0].out), join(PUBLIC, 'og-image.jpg'))
  console.log('  og-image.jpg  (copy of the English card)')
} finally {
  ws.close()
  chrome.kill()
  server.close()
  await sleep(300)
  rmSync(PROFILE, { recursive: true, force: true })
}
