import { chromium } from 'file:///C:/Users/Kaneb/AppData/Local/Temp/claude/C--Users-Kaneb-vitaal--claude-worktrees-one-person-billion-company-f8c7a3/20b9a956-5f38-45e7-b9d7-9ebd23bccf61/scratchpad/render3d/node_modules/playwright-core/index.mjs'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } })
for (const u of ['/overstappen', '/ledenapp', '/trainingsschemas', '/functies']) {
  await p.goto('https://aiyourgym.com' + u, { waitUntil: 'networkidle', timeout: 60000 })
  const h = await p.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < h; y += 700) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(250) }
  const els = await p.evaluate(() => [...document.querySelectorAll('[class*=aygm-]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 250 && r.height > 250 }).map(e => { const r = e.getBoundingClientRect(); return (typeof e.className==='string'?e.className:'') + ' @' + Math.round(r.top + scrollY) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) }))
  console.log('==', u, h); console.log([...new Set(els)].slice(0, 40).join('\n'))
}
await b.close()
