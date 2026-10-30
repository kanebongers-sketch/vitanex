import { chromium } from 'file:///C:/Users/Kaneb/AppData/Local/Temp/claude/C--Users-Kaneb-vitaal--claude-worktrees-one-person-billion-company-f8c7a3/20b9a956-5f38-45e7-b9d7-9ebd23bccf61/scratchpad/render3d/node_modules/playwright-core/index.mjs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
const v = process.argv[2] === 'v'
const ts = process.argv.slice(3).map(Number)
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: v ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } })
p.on('pageerror', e => console.log('ERR', e))
await p.goto(pathToFileURL(path.resolve('video.html')).href + (v ? '?v=1' : ''))
await p.evaluate(() => window.klaar)
for (const t of ts) { await p.evaluate((t) => window.render(t), t); await p.screenshot({ path: `stills/${v ? 'v' : 'l'}-${t.toFixed(2)}.jpg`, quality: 80 }) }
await b.close()
