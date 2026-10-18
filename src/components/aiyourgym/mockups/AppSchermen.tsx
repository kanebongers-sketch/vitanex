import { Check, Trophy } from 'lucide-react'

// De schermen van de ledenapp: Home, Lessen en Schema, zoals Club ze toont.
// Alleen de inhoud; het telefoonkader komt uit kaders.tsx.

/** Een vaste, nette QR-tekening (geen echte code) voor het inchecken. */
export function QrBeeld() {
  const n = 21
  const vinder = (x: number, y: number) => {
    const inBlok = (bx: number, by: number) => x >= bx && x < bx + 7 && y >= by && y < by + 7
    const blok = inBlok(0, 0) ? [0, 0] : inBlok(14, 0) ? [14, 0] : inBlok(0, 14) ? [0, 14] : null
    if (!blok) return null
    const dx = x - blok[0]
    const dy = y - blok[1]
    const rand = dx === 0 || dy === 0 || dx === 6 || dy === 6
    const kern = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
    return rand || kern
  }
  const vakjes: { x: number; y: number }[] = []
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = vinder(x, y)
      const aan = v === null ? (x * 7 + y * 13 + ((x * y) % 5)) % 3 === 0 : v
      if (aan) vakjes.push({ x, y })
    }
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-hidden>
      {vakjes.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0f1412" />
      ))}
    </svg>
  )
}

export function AppHome() {
  return (
    <>
      <p className="aygm-hallo">Goedemorgen, Sanne</p>
      <div className="aygm-volgende">
        <span className="aygm-boven">Je volgende les</span>
        <b>Spinning</b>
        <span>Dinsdag 18:30 · Zaal 2</span>
      </div>
      <div className="aygm-duo">
        <div className="aygm-kaart">
          <p className="aygm-boven">Deze maand</p>
          <p className="aygm-getal">9</p>
          <p className="aygm-boven">bezoeken</p>
        </div>
        <div className="aygm-kaart">
          <p className="aygm-boven">Op rij</p>
          <p className="aygm-getal">6</p>
          <p className="aygm-boven">weken</p>
        </div>
      </div>
      <div className="aygm-kaart aygm-qr">
        <QrBeeld />
        <div>
          <p className="aygm-kop">Inchecken</p>
          <p className="aygm-boven">Laat zien bij de balie</p>
        </div>
      </div>
      <div className="aygm-kaart">
        <div className="aygm-rij-tekst" style={{ marginBottom: 8 }}>
          <b>
            <Trophy size={13} aria-hidden /> Oktober-challenge
          </b>
          <span>12 trainingen deze maand · nog 3</span>
        </div>
        <div className="aygm-balk">
          <span style={{ transform: 'scaleX(0.75)' }} />
        </div>
      </div>
    </>
  )
}

const LESSEN = [
  { naam: 'Spinning', tijd: '07:00 · Zaal 2 · 4 plekken', knop: 'Reserveer' },
  { naam: 'Pilates', tijd: '09:00 · Studio · 2 plekken', knop: 'Gereserveerd' },
  { naam: 'Lunchfit', tijd: '12:00 · Zaal 1 · 8 plekken', knop: 'Reserveer' },
  { naam: 'Spinning', tijd: '18:30 · Zaal 2 · vol', knop: 'Wachtlijst' },
  { naam: 'Yoga', tijd: '20:00 · Studio · 5 plekken', knop: 'Reserveer' },
] as const

export function AppLessen() {
  return (
    <>
      <p className="aygm-hallo">Lessen</p>
      <div className="aygm-dagen">
        {[
          ['Ma', '19'],
          ['Di', '20'],
          ['Wo', '21'],
          ['Do', '22'],
          ['Vr', '23'],
        ].map(([d, n], i) => (
          <span key={d} data-actief={i === 1 ? '' : undefined}>
            {d}
            <b>{n}</b>
          </span>
        ))}
      </div>
      <div className="aygm-lijst">
        {LESSEN.map((l) => (
          <div key={l.tijd} className="aygm-rij">
            <div className="aygm-rij-tekst">
              <b>{l.naam}</b>
              <span>{l.tijd}</span>
            </div>
            <span className={l.knop === 'Reserveer' ? 'aygm-knopje' : 'aygm-knopje aygm-knopje--rand'}>{l.knop}</span>
          </div>
        ))}
      </div>
    </>
  )
}

const OEFENINGEN = [
  { naam: 'Goblet squat', dosis: '3 × 10 · 16 kg', beeld: 'goblet-squat', klaar: true },
  { naam: 'Roemeense deadlift', dosis: '3 × 8 · 40 kg', beeld: 'romanian-deadlift', klaar: true },
  { naam: 'Lat pulldown', dosis: '3 × 12 · 45 kg', beeld: 'lat-pulldown', klaar: false },
  { naam: 'Kettlebell swing', dosis: '4 × 15 · 16 kg', beeld: 'kettlebell-swing', klaar: false },
] as const

export function AppSchema() {
  return (
    <>
      <p className="aygm-hallo">Schema</p>
      <div className="aygm-dagen">
        {['Dag A', 'Dag B', 'Dag C'].map((d, i) => (
          <span key={d} data-actief={i === 0 ? '' : undefined}>
            <b>{d}</b>
          </span>
        ))}
      </div>
      <div className="aygm-lijst">
        {OEFENINGEN.map((o) => (
          <div key={o.naam} className="aygm-oef">
            <img src={`/club/oefeningen-repdb/${o.beeld}-start.webp`} alt="" width={52} height={52} loading="lazy" decoding="async" />
            <div className="aygm-rij-tekst">
              <b>{o.naam}</b>
              <span>{o.dosis}</span>
            </div>
            <span className="aygm-vink" data-aan={o.klaar ? '' : undefined}>
              {o.klaar && <Check size={14} aria-hidden />}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

const MACROS = [
  { naam: 'Eiwit', gram: 150, deel: 0.62 },
  { naam: 'Koolhydraten', gram: 240, deel: 0.48 },
  { naam: 'Vet', gram: 70, deel: 0.35 },
] as const

const MAALTIJDEN = [
  { naam: 'Ontbijt', tekst: 'Kwark met havermout en blauwe bessen' },
  { naam: 'Lunch', tekst: 'Volkoren wrap met kip en groente' },
  { naam: 'Na de training', tekst: 'Shake en een banaan' },
] as const

/** Het voedingsplan dat de trainer voor het lid maakte. */
export function AppVoeding() {
  return (
    <>
      <p className="aygm-hallo">Voeding</p>
      <div className="aygm-kaart aygm-voeding">
        <div>
          <p className="aygm-boven">Doel · spieropbouw</p>
          <p className="aygm-getal">2.300</p>
          <p className="aygm-boven">kcal per dag</p>
        </div>
        <div className="aygm-macros">
          {MACROS.map((m) => (
            <div key={m.naam}>
              <span className="aygm-macro-tekst">
                <span>{m.naam}</span>
                <b>{m.gram} g</b>
              </span>
              <span className="aygm-balk">
                <span style={{ transform: `scaleX(${m.deel})` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="aygm-lijst">
        {MAALTIJDEN.map((m) => (
          <div key={m.naam} className="aygm-rij">
            <div className="aygm-rij-tekst">
              <b>{m.naam}</b>
              <span>{m.tekst}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/** Inloggen in de web-app: het lid kiest zelf een pincode van zes cijfers. */
export function AppPincode() {
  return (
    <div className="aygm-pin">
      <div className="aygm-pin-kop">
        <p className="aygm-hallo">Kies je pincode</p>
        <p className="aygm-boven">Zes cijfers, alleen voor jou</p>
      </div>
      <div className="aygm-pin-vakjes" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} data-vol={i < 4 ? '' : undefined} />
        ))}
      </div>
      <div className="aygm-pin-toetsen" aria-hidden>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''].map((t, i) => (
          <span key={i} data-leeg={t === '' ? '' : undefined}>
            {t}
          </span>
        ))}
      </div>
      <p className="aygm-pin-voet">Daarna zet je de app met een tik op je beginscherm.</p>
    </div>
  )
}
