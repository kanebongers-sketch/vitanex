import { chromium } from 'file:///C:/Users/Kaneb/AppData/Local/Temp/claude/C--Users-Kaneb-vitaal--claude-worktrees-one-person-billion-company-f8c7a3/20b9a956-5f38-45e7-b9d7-9ebd23bccf61/scratchpad/render3d/node_modules/playwright-core/index.mjs'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
const p = await ctx.newPage()
const fonts = new Set()
p.on('response', r => { const u = r.url(); if (/\.(woff2?|ttf)(\?|$)/.test(u)) fonts.add(u) })
for (const [naam, u] of [['home', '/'], ['over', '/overstappen'], ['app', '/ledenapp'], ['schema', '/trainingsschemas'], ['func', '/functies']]) {
  await p.goto('https://aiyourgym.com' + u, { waitUntil: 'networkidle', timeout: 60000 })
  const h = await p.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < h; y += 600) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(200) }
  const loc = p.locator('.aygm-venster, .aygm-toestel, .aygm-oefening')
  const n = await loc.count()
  for (let i = 0; i < n; i++) {
    const e = loc.nth(i)
    const bb = await e.boundingBox()
    if (!bb || bb.width < 200 || bb.height < 200) continue
    await e.scrollIntoViewIfNeeded(); await p.waitForTimeout(1200)
    await e.screenshot({ path: `ui/${naam}-${i}.png`, omitBackground: true, animations: 'disabled' })
    console.log(naam, i, Math.round(bb.width), Math.round(bb.height))
  }
}
console.log([...fonts].join('\n'))
await b.close()
