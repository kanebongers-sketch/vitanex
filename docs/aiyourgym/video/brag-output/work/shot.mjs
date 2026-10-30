import { chromium } from 'file:///C:/Users/Kaneb/AppData/Local/Temp/claude/C--Users-Kaneb-vitaal--claude-worktrees-one-person-billion-company-f8c7a3/20b9a956-5f38-45e7-b9d7-9ebd23bccf61/scratchpad/render3d/node_modules/playwright-core/index.mjs'
import { pathToFileURL } from 'node:url'
const [f, out, w = 1400, h = 600] = process.argv.slice(2)
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: +w, height: +h } })
await p.goto(pathToFileURL(f).href); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
await p.screenshot({ path: out }); await b.close()
