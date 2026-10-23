// Schrijft het vergelijkingsblad richtingen.html (statisch, opent zonder server).
// node docs/aiyourgym/brand/richtingen/bron/blad.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const UIT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const R = [
  {
    map: '1-monogram',
    nr: '01',
    soort: 'Monogram',
    naam: 'De ligatuur',
    idee: 'De rechterpoot van de A loopt door als arm en stam van de Y: AI Your Gym in één getekend teken, met één helling en één dikte.',
    premium: 'Geen illustratie maar typografie, zoals Linear en Stripe: strak, stil en op elke maat herkenbaar, van favicon tot gevel.',
    letter: 'Instrument Sans Bold (OFL)',
    kleuren: [['#1fa77a', 'Smaragd'], ['#14875f', 'Diep smaragd (teken op licht)'], ['#0f1412', 'Inkt']],
    kop: 'lockup-licht.svg',
    kaartVoor: 'icoon.svg',
  },
  {
    map: '2-ritme',
    nr: '02',
    soort: 'Beweging en ritme',
    naam: 'Het turfje',
    idee: 'Vier staven en een vijfde streep die ze doorkruist: zo telt elke sporter zijn herhalingen, en de streep stijgt, zoals progressie.',
    premium: 'Een teken dat iedereen al kent, teruggebracht tot vijf strakke vlakken met een uitsparing; zonder figuur en zonder grafiek-cliché.',
    letter: 'Bricolage Grotesque Bold (OFL)',
    kleuren: [['#1fa77a', 'Smaragd'], ['#14875f', 'Diep smaragd (streep op licht)'], ['#0f1412', 'Inkt']],
    kop: 'lockup-licht.svg',
    kaartVoor: 'icoon.svg',
  },
  {
    map: '3-woordmerk',
    nr: '03',
    soort: 'Woordmerk',
    naam: 'De schijf',
    idee: 'AI YOUR GYM in ruim gespatieerde geometrische kapitalen; de O van Your is een halterschijf in smaragd, en die schijf alleen is het icoon.',
    premium: 'Het merk is het woord zelf, zoals bij Equinox en Whoop: rust, ruimte en één detail dat je van ver herkent.',
    letter: 'Outfit Bold (OFL)',
    kleuren: [['#1fa77a', 'Smaragd'], ['#14875f', 'Diep smaragd (schijf op licht)'], ['#0f1412', 'Inkt']],
    kop: 'woordmerk-licht.svg',
    kaartVoor: 'icoon.svg',
  },
  {
    map: '4-embleem',
    nr: '04',
    soort: 'Embleem',
    naam: 'Het rooster',
    idee: 'Een vierkante plaat in vier vakken, A I boven Y G: lesrooster, stempel en app-icoon tegelijk, met het vak van de Y (Your) in smaragd.',
    premium: 'Een gesloten, Zwitsers strakke vorm die overal staat, van gevelbord tot stempel; gedurfde variant in diep clubgroen met mint.',
    letter: 'Big Shoulders Bold (OFL)',
    kleuren: [['#1fa77a', 'Smaragd'], ['#0f1412', 'Inkt'], ['#0d3a2b', 'Clubgroen (gedurfd)'], ['#46d9a0', 'Mint (gedurfd)']],
    kop: 'lockup-licht.svg',
    kaartVoor: 'icoon.svg',
    extra: true,
  },
]

const img = (r, f, stijl = '', alt = '') => `<img src="${r.map}/${f}" alt="${alt}" style="${stijl}">`

/** Neutrale app-iconen op het beginscherm (geen echte merken). */
const NEUTRAAL = ['#3a4a5c', '#5b6b5a', '#7a5f4e', '#4d4d63', '#6a7480', '#2f5b5f', '#80705a', '#56606e', '#41504a', '#6e5d6e', '#53627a', '#7b7b72', '#5c5348', '#3f5a73', '#6b7a68']
function telefoon(r) {
  let vakken = ''
  for (let i = 0; i < 20; i++) {
    if (i === 9) {
      vakken += `<div class="app">${img(r, 'icoon.svg', '', 'AI Your Gym')}<span>AI Your Gym</span></div>`
    } else {
      vakken += `<div class="app"><i style="background:${NEUTRAAL[i % NEUTRAAL.length]}"></i><span>App</span></div>`
    }
  }
  const dock = [0, 1, 2, 3].map((i) => `<i style="background:${NEUTRAAL[(i * 4 + 3) % NEUTRAAL.length]}"></i>`).join('')
  return `<div class="telefoon"><div class="scherm"><div class="tijd">09:41</div><div class="apps">${vakken}</div><div class="dock">${dock}</div></div></div>`
}

function websiteKop(r) {
  return `<div class="site"><div class="nav">${img(r, r.kop, 'height:' + (r.map === '3-woordmerk' ? 15 : 24) + 'px', 'AI Your Gym')}<span class="links">Functies</span><span class="knop">Demo</span></div>
  <div class="held"><p class="kicker">Clubsoftware</p><p class="kopregel">Je sportschool, strak geregeld.</p></div></div>`
}

function kaartje(r) {
  const voor = r.map === '3-woordmerk'
    ? `<div class="kaart donker centraal">${img(r, 'woordmerk-donker.svg', 'width:70%')}</div>`
    : `<div class="kaart donker centraal">${img(r, 'beeldmerk-' + (r.map === '4-embleem' ? 'donker' : 'donker') + '.svg', 'height:74px')}</div>`
  const achter = `<div class="kaart licht"><div>${img(r, r.map === '3-woordmerk' ? 'beeldmerk-licht.svg' : r.map === '4-embleem' ? 'beeldmerk-licht.svg' : 'beeldmerk-licht.svg', 'height:26px')}</div>
    <div class="persoon"><b>Kane Bongers</b><span>Oprichter</span><span class="url">aiyourgym.com</span></div></div>`
  return `<div class="kaarten">${voor}${achter}</div>`
}

/** Op 16 pixels heeft het embleem een eigen, op het pixelraster getekende versie. */
const f16 = (r) => (r.map === '4-embleem' ? 'favicon-16.svg' : 'favicon.svg')

function tab(r, donker) {
  return `<div class="tab${donker ? ' d' : ''}">${img(r, f16(r), 'width:16px;height:16px', '')}<span>AI Your Gym</span><em>×</em></div>`
}

const kolom = (fn) => R.map((r) => `<div class="cel">${fn(r)}</div>`).join('')
const rij = (label, fn, klasse = '') => `<section class="rij ${klasse}"><h2>${label}</h2><div class="raster">${kolom(fn)}</div></section>`

const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Logorichtingen AI Your Gym</title>
<style>
  :root { --smaragd:#1fa77a; --inkt:#0f1412; --kalk:#f2f0e9; --vlak:#fbfaf6; --lijn:#d6d2c5; --tekst-2:#545a55; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--kalk); color:var(--inkt); font:15px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif; }
  main { padding:56px 48px 80px; max-width:1600px; margin:0 auto; }
  .label { font-size:12px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--tekst-2); margin:0; }
  h1 { font-size:56px; line-height:1; letter-spacing:-.035em; margin:12px 0 14px; }
  .intro { font-size:18px; color:var(--tekst-2); max-width:880px; margin:0; }
  .raster { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:24px; }
  .rij { margin-top:44px; }
  .rij h2 { font-size:12px; font-weight:650; letter-spacing:.14em; text-transform:uppercase; color:var(--tekst-2); margin:0 0 12px; padding-top:12px; border-top:1.5px solid var(--inkt); }
  .kop .cel { padding-top:6px; }
  .nr { font:600 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace; color:var(--tekst-2); }
  .soort { font-size:12px; font-weight:650; letter-spacing:.12em; text-transform:uppercase; color:#14875f; margin:14px 0 2px; }
  .naam { font-size:30px; font-weight:700; letter-spacing:-.025em; margin:0 0 10px; line-height:1.05; }
  .uitleg p { margin:0 0 8px; font-size:14.5px; }
  .uitleg .zacht { color:var(--tekst-2); }
  .vlak { border-radius:14px; display:grid; place-items:center; height:200px; border:1px solid var(--lijn); background:var(--vlak); padding:24px; }
  .vlak.d { background:var(--inkt); border-color:var(--inkt); }
  .vlak.groot { height:300px; }
  .vlak img { max-width:100%; }
  .iconen { display:flex; align-items:flex-end; gap:18px; flex-wrap:wrap; }
  .iconen figure { margin:0; text-align:center; font-size:11.5px; color:var(--tekst-2); }
  .iconen figure img, .iconen figure .ios { display:block; margin:0 auto 6px; }
  .ios { width:180px; height:180px; border-radius:40px; overflow:hidden; box-shadow:0 1px 0 rgb(0 0 0 / .06), 0 10px 24px -14px rgb(0 0 0 / .45); }
  .ios img { width:100%; height:100%; display:block; }
  .kleintjes { display:grid; grid-template-columns:auto auto; gap:8px 12px; align-items:center; }
  .kleintjes div { display:flex; gap:10px; align-items:center; padding:10px; border-radius:10px; background:#fff; border:1px solid var(--lijn); }
  .kleintjes div.d { background:#202523; border-color:#202523; }
  .tab { display:flex; align-items:center; gap:8px; height:34px; padding:0 12px; width:210px; background:#fff; border-radius:9px 9px 0 0; font-size:12.5px; color:#2b302d; border:1px solid var(--lijn); border-bottom:0; margin-top:10px; }
  .tab.d { background:#2a2e2c; color:#e8e6df; border-color:#2a2e2c; }
  .tab span { flex:1; } .tab em { font-style:normal; opacity:.5; }
  .site { border-radius:14px; overflow:hidden; border:1px solid var(--lijn); background:var(--vlak); }
  .nav { display:flex; align-items:center; gap:14px; padding:16px 16px; border-bottom:1px solid #e6e2d6; }
  .nav .links { margin-left:auto; font-size:13px; color:#3b403c; }
  .nav .knop { background:var(--smaragd); color:var(--inkt); font-weight:650; font-size:13px; padding:7px 14px; border-radius:999px; }
  .held { background:var(--inkt); color:var(--kalk); padding:22px 18px 26px; }
  .held .kicker { margin:0 0 6px; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#2db886; font-weight:650; }
  .held .kopregel { margin:0; font-size:24px; line-height:1.08; font-weight:700; letter-spacing:-.02em; }
  .kaarten { display:grid; gap:14px; }
  .kaart { aspect-ratio:85/55; border-radius:6px; padding:18px; box-shadow:0 1px 0 rgb(0 0 0 / .05), 0 14px 30px -18px rgb(0 0 0 / .5); }
  .kaart.donker { background:var(--inkt); }
  .kaart.licht { background:#fbfaf6; display:flex; flex-direction:column; justify-content:space-between; }
  .kaart.centraal { display:grid; place-items:center; }
  .persoon { display:flex; flex-direction:column; font-size:12px; color:#3b403c; line-height:1.45; }
  .persoon b { font-size:14px; color:var(--inkt); }
  .persoon .url { color:#14875f; font-weight:600; margin-top:6px; }
  .telefoon { width:276px; margin:0 auto; padding:10px; border-radius:44px; background:#1b1d1c; box-shadow:0 30px 50px -28px rgb(0 0 0 / .6); }
  .scherm { border-radius:35px; overflow:hidden; padding:14px 14px 12px; height:540px; position:relative;
    background:radial-gradient(120% 80% at 20% 10%, #33413b 0%, #1a2320 45%, #0f1412 100%); }
  .tijd { color:#f2f0e9; font-weight:600; font-size:13px; text-align:center; margin:2px 0 18px; }
  .apps { display:grid; grid-template-columns:repeat(4,1fr); gap:16px 8px; }
  .app { display:flex; flex-direction:column; align-items:center; gap:4px; }
  .app img, .app i { width:48px; height:48px; border-radius:11px; display:block; }
  .app i { opacity:.55; }
  .app span { font-size:9.5px; color:#e8e6df; white-space:nowrap; }
  .dock { position:absolute; left:12px; right:12px; bottom:12px; display:flex; justify-content:space-around; padding:10px; border-radius:24px; background:rgb(255 255 255 / .12); }
  .dock i { width:48px; height:48px; border-radius:11px; opacity:.55; }
  .stalen { display:flex; flex-direction:column; gap:6px; font-size:13px; }
  .stalen span { display:inline-block; width:18px; height:18px; border-radius:5px; vertical-align:-4px; margin-right:8px; box-shadow:inset 0 0 0 1px rgb(0 0 0 / .12); }
  .stalen code, .bestanden code { font:12px ui-monospace,SFMono-Regular,Menlo,monospace; color:var(--tekst-2); }
  .bestanden { font-size:12.5px; color:var(--tekst-2); }
  .duo { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .duo .vlak { height:150px; }
  footer { margin-top:56px; padding-top:16px; border-top:1.5px solid var(--inkt); color:var(--tekst-2); font-size:13.5px; max-width:1000px; }
</style>
</head>
<body>
<main>
  <p class="label">Keuzeblad · 23 oktober 2026 · het huidige logo blijft ongewijzigd</p>
  <h1>Vier richtingen voor AI Your Gym</h1>
  <p class="intro">Geen figuur meer, vier echt verschillende ideeën: een monogram, een teken voor ritme, een woordmerk en een embleem. Alles met de hand getekend in SVG, smaragd en inkt als basis. Elke richting staat hieronder op dezelfde plekken: licht, donker, app-icoon, website, visitekaartje en telefoon.</p>

  <section class="rij kop"><div class="raster">${R.map((r) => `<div class="cel uitleg"><span class="nr">${r.nr}</span><p class="soort">${r.soort}</p><p class="naam">${r.naam}</p><p>${r.idee}</p><p class="zacht">${r.premium}</p></div>`).join('')}</div></section>

  ${rij('Beeldmerk', (r) => `<div class="duo"><div class="vlak">${img(r, 'beeldmerk-licht.svg', 'height:96px')}</div><div class="vlak d">${img(r, 'beeldmerk-donker.svg', 'height:96px')}</div></div>`)}
  ${rij('Logo op licht', (r) => `<div class="vlak">${img(r, 'lockup-licht.svg', 'width:100%;max-height:' + (r.map === '3-woordmerk' ? 90 : 60) + 'px')}</div>`)}
  ${rij('Logo op donker', (r) => `<div class="vlak d">${img(r, 'lockup-donker.svg', 'width:100%;max-height:' + (r.map === '3-woordmerk' ? 90 : 60) + 'px')}</div>`)}
  ${rij('Woordmerk', (r) => `<div class="duo"><div class="vlak">${img(r, 'woordmerk-licht.svg', 'width:100%')}</div><div class="vlak d">${img(r, 'woordmerk-donker.svg', 'width:100%')}</div></div>`)}
  ${rij('App-icoon: 180, 32 en 16 pixels', (r) => `<div class="iconen"><figure><div class="ios">${img(r, 'icoon.svg')}</div>180 px</figure>
    <div class="kleintjes"><div>${img(r, 'favicon.svg', 'width:32px;height:32px')}${img(r, f16(r), 'width:16px;height:16px')}</div><div class="d">${img(r, 'favicon.svg', 'width:32px;height:32px')}${img(r, f16(r), 'width:16px;height:16px')}</div></div></div>
    ${tab(r, false)}${tab(r, true)}`)}
  ${rij('Website-kop', websiteKop)}
  ${rij('Visitekaartje', kaartje)}
  ${rij('Telefoon: beginscherm', telefoon)}
  ${rij('Extra', (r) => {
    if (r.map === '4-embleem') return `<div class="duo"><div class="vlak" style="height:190px">${img(r, 'stempel.svg', 'height:150px')}</div><div class="vlak" style="height:190px;background:#0d3a2b;border-color:#0d3a2b">${img(r, 'icoon-clubgroen.svg', 'height:110px;border-radius:24px')}</div></div><p class="bestanden">Links het eenkleurige stempel, rechts de gedurfde kleurvariant: diep clubgroen met mint (alternatief, niet de basis).</p>`
    if (r.map === '3-woordmerk') return `<div class="vlak" style="height:190px;background:var(--smaragd);border-color:var(--smaragd)">${img(r, 'woordmerk-zwart.svg', 'width:100%')}</div><p class="bestanden">Eenkleurig op smaragd, bijvoorbeeld op een tas of shirt.</p>`
    if (r.map === '2-ritme') return `<div class="vlak" style="height:190px;background:var(--smaragd);border-color:var(--smaragd)">${img(r, 'icoon-smaragd.svg', 'height:120px;border-radius:26px')}</div><p class="bestanden">Omgekeerd: smaragden tegel, inkten staven, kalkwitte streep.</p>`
    return `<div class="vlak" style="height:190px;background:var(--smaragd);border-color:var(--smaragd)">${img(r, 'icoon-smaragd.svg', 'height:120px;border-radius:26px')}</div><p class="bestanden">Omgekeerd: smaragden tegel met inkten teken.</p>`
  })}
  ${rij('Kleur en letter', (r) => `<div class="stalen">${r.kleuren.map(([k, n]) => `<div><span style="background:${k}"></span>${n} <code>${k.toUpperCase()}</code></div>`).join('')}<div style="margin-top:6px">Woordmerk: ${r.letter}</div></div>`)}
  ${rij('Bestanden', (r) => `<p class="bestanden"><code>richtingen/${r.map}/</code><br>beeldmerk, woordmerk en lockup (licht en donker), icoon (app), favicon${r.map === '4-embleem' ? ' (ook op het pixelraster voor 16 px), stempel, clubgroen' : ''}</p>`)}

  <footer>
    <p>Alle tekens zijn met de hand geconstrueerd in code (<code>richtingen/bron/genereer.mjs</code>), zonder beeldgenerator. Woordmerken zijn omgezet naar paden uit letters onder de SIL Open Font License 1.1 (vrij voor logo's en verkoop): Instrument Sans, Bricolage Grotesque, Outfit en Big Shoulders. Subsets en licenties staan in <code>richtingen/bron/</code>. De iconen op het beginscherm zijn neutrale vlakken, geen echte apps.</p>
  </footer>
</main>
</body>
</html>
`
fs.writeFileSync(path.join(UIT, 'richtingen.html'), html)
console.log('blad geschreven')
