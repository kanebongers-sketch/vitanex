import { chromium } from 'file:///C:/Users/Kaneb/AppData/Local/Temp/claude/C--Users-Kaneb-vitaal--claude-worktrees-one-person-billion-company-f8c7a3/20b9a956-5f38-45e7-b9d7-9ebd23bccf61/scratchpad/render3d/node_modules/playwright-core/index.mjs'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } })
await p.goto('https://aiyourgym.com', { waitUntil: 'networkidle', timeout: 60000 })
const h = await p.evaluate(() => document.body.scrollHeight)
console.log('h', h, await p.title())
for (let y = 0, i = 0; y < h; y += 1000, i++) {
  await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(900)
  await p.screenshot({ path: `shots/home-${String(i).padStart(2,'0')}.jpg`, quality: 70 })
}
const secs = await p.evaluate(() => [...document.querySelectorAll('section, [class*=mock], [class*=toestel], [class*=telefoon]')].slice(0,80).map(e => e.tagName + '.' + (e.className?.baseVal ?? e.className) + ' ' + Math.round(e.getBoundingClientRect().top + scrollY) + ' ' + Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)))
console.log(secs.join('\n'))
await b.close()
