import { chromium } from 'file:///C:/Users/Kaneb/AppData/Local/Temp/claude/C--Users-Kaneb-vitaal--claude-worktrees-one-person-billion-company-f8c7a3/20b9a956-5f38-45e7-b9d7-9ebd23bccf61/scratchpad/render3d/node_modules/playwright-core/index.mjs'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
await p.goto('https://aiyourgym.com/', { waitUntil: 'networkidle' })
await p.addStyleTag({ content: '.ayg-held-toestel, .ayg-held [class*=kaart-los], .ayg-held .aygm-oefkaart {display:none!important}' })
await p.waitForTimeout(1500)


// hide schema card in hero: find elements overlapping window that are not window
await p.evaluate(() => { const v = document.querySelector('.ayg-held .aygm-venster'); const r = v.getBoundingClientRect(); document.querySelectorAll('.ayg-held *').forEach(e => { if (v.contains(e) || e.contains(v)) return; const q = e.getBoundingClientRect(); if (q.left > r.left + 400 && q.top > r.bottom - 50 && q.width>100) e.style.visibility='hidden' }) })
await p.locator('.ayg-held .aygm-venster').screenshot({ path: 'ui/dash.png', omitBackground: true })
await p.goto('https://aiyourgym.com/trainingsschemas', { waitUntil: 'networkidle' })
const t = p.locator('.aygm-venster, .aygm-toestel, .aygm-oefening').nth(7)
await t.scrollIntoViewIfNeeded(); await p.waitForTimeout(5000)
await t.screenshot({ path: 'ui/squat-phone.png', omitBackground: true })
const bx = await t.boundingBox(); const im = await t.evaluate(e => [...e.querySelectorAll('img,canvas,video,[class*=beeld]')].map(x => { const r=x.getBoundingClientRect(); return x.tagName+'.'+x.className+' '+(x.currentSrc||'')+' '+Math.round(r.left)+','+Math.round(r.top)+' '+Math.round(r.width)+'x'+Math.round(r.height)}))
console.log(bx, im)
await b.close()
