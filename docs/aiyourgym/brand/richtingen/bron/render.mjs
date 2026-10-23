// Rendert een HTML-bestand naar PNG met Playwright (volle hoogte).
// node docs/aiyourgym/brand/richtingen/bron/render.mjs <html> <png> [breedte] [schaal]
// Playwright wordt globaal gezocht (npm root -g) of via PW_PAD.
import { execSync } from 'node:child_process'
import path from 'node:path'

const pw = process.env.PW_PAD ?? path.join(execSync('npm root -g').toString().trim(), 'playwright/index.mjs')
const { chromium } = await import(pw)
const [, , html, uit, breedte = '1600', schaal = '1'] = process.argv
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium',
  args: ['--no-proxy-server'],
})
const pagina = await browser.newPage({ viewport: { width: +breedte, height: 900 }, deviceScaleFactor: +schaal })
await pagina.goto('file://' + path.resolve(html))
await pagina.evaluate(() => document.fonts.ready)
await pagina.waitForTimeout(300)
await pagina.screenshot({ path: uit, fullPage: true })
await browser.close()
console.log('gerenderd', uit)
