import { Check, Trophy } from 'lucide-react'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { APP_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/mockups/schermen'
import { OefNr } from './OefNr'
import { LES, VOORBEELD_NAAM, VOORBEELD_STRAAT, VOORBEELD_VESTIGING } from './voorbeeld'

// De schermen van de ledenapp: Home, Lessen en Schema, zoals Club ze toont.
// Alleen de inhoud; het telefoonkader komt uit kaders.tsx. Teksten in de taal
// van de pagina (woordenboek APP_SCHERMEN); namen van leden, lessen en
// oefeningen zijn voorbeelden uit de bibliotheek en blijven gelijk.

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
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#111614" />
      ))}
    </svg>
  )
}

export async function AppHome() {
  const t = APP_SCHERMEN[await getSiteTaal()]
  return (
    <>
      <p className="aygm-hallo">{t.hallo('Sanne')}</p>
      <div className="aygm-volgende">
        <span className="aygm-boven">{t.volgendeLes}</span>
        <b>{LES.strength}</b>
        <span>{t.volgendeWanneer}</span>
      </div>
      <div className="aygm-duo">
        <div className="aygm-kaart">
          <p className="aygm-boven">{t.dezeMaand}</p>
          <p className="aygm-getal">9</p>
          <p className="aygm-boven">{t.bezoeken}</p>
        </div>
        <div className="aygm-kaart">
          <p className="aygm-boven">{t.opRij}</p>
          <p className="aygm-getal">6</p>
          <p className="aygm-boven">{t.weken}</p>
        </div>
      </div>
      <div className="aygm-kaart aygm-qr">
        <QrBeeld />
        <div>
          <p className="aygm-kop">{t.inchecken}</p>
          <p className="aygm-boven">{t.laatZien}</p>
        </div>
      </div>
      <div className="aygm-kaart">
        <div className="aygm-rij-tekst" style={{ marginBottom: 8 }}>
          <b>
            <Trophy size={13} aria-hidden /> {t.challenge}
          </b>
          <span>{t.challengeStand}</span>
        </div>
        <div className="aygm-balk">
          <span style={{ transform: 'scaleX(0.75)' }} />
        </div>
      </div>
    </>
  )
}

type Knop = 'reserveer' | 'gereserveerd' | 'wachtlijst'

/** Zaal als nummer, of 'studio'; plekken null = vol. */
const LESSEN: readonly { naam: string; tijd: string; zaal: number | 'studio'; plekken: number | null; knop: Knop }[] = [
  { naam: LES.strength, tijd: '07:00', zaal: 1, plekken: 3, knop: 'reserveer' },
  { naam: LES.mobility, tijd: '09:00', zaal: 'studio', plekken: 2, knop: 'gereserveerd' },
  { naam: LES.kettlebell, tijd: '12:00', zaal: 2, plekken: 6, knop: 'reserveer' },
  { naam: LES.barbell, tijd: '18:30', zaal: 1, plekken: null, knop: 'wachtlijst' },
  { naam: LES.conditioning, tijd: '20:00', zaal: 2, plekken: 4, knop: 'reserveer' },
]

const DAGNUMMERS = ['19', '20', '21', '22', '23'] as const

export async function AppLessen() {
  const t = APP_SCHERMEN[await getSiteTaal()]
  return (
    <>
      <p className="aygm-hallo">{t.lessen}</p>
      <div className="aygm-dagen">
        {t.dagen.map((d, i) => (
          <span key={d} data-actief={i === 1 ? '' : undefined}>
            {d}
            <b>{DAGNUMMERS[i]}</b>
          </span>
        ))}
      </div>
      <div className="aygm-lijst">
        {LESSEN.map((l) => {
          const zaal = l.zaal === 'studio' ? t.studio : t.zaal(l.zaal)
          const plekken = l.plekken === null ? t.vol : t.plekken(l.plekken)
          return (
            <div key={l.tijd} className="aygm-rij">
              <div className="aygm-rij-tekst">
                <b>{l.naam}</b>
                <span>{`${l.tijd} · ${zaal} · ${plekken}`}</span>
              </div>
              <span className={l.knop === 'reserveer' ? 'aygm-knopje' : 'aygm-knopje aygm-knopje--rand'}>{t[l.knop]}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

const OEFENINGEN = [
  { naam: 'Goblet squat', dosis: '3 × 10 · 16 kg', klaar: true },
  { naam: 'Roemeense deadlift', dosis: '3 × 8 · 40 kg', klaar: true },
  { naam: 'Lat pulldown', dosis: '3 × 12 · 45 kg', klaar: false },
  { naam: 'Kettlebell swing', dosis: '4 × 15 · 16 kg', klaar: false },
] as const

export async function AppSchema() {
  const t = APP_SCHERMEN[await getSiteTaal()]
  return (
    <>
      <p className="aygm-hallo">{t.schema}</p>
      <div className="aygm-dagen">
        {t.schemaDagen.map((d, i) => (
          <span key={d} data-actief={i === 0 ? '' : undefined}>
            <b>{d}</b>
          </span>
        ))}
      </div>
      <div className="aygm-lijst">
        {OEFENINGEN.map((o, i) => (
          <div key={o.naam} className="aygm-oef">
            <OefNr nr={i + 1} maat={52} />
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

/** Macro's in de volgorde van t.macros. */
const MACROS = [
  { gram: 150, deel: 0.62 },
  { gram: 240, deel: 0.48 },
  { gram: 70, deel: 0.35 },
] as const

/** Het voedingsplan dat de trainer voor het lid maakte. */
export async function AppVoeding() {
  const taal = await getSiteTaal()
  const t = APP_SCHERMEN[taal]
  return (
    <>
      <p className="aygm-hallo">{t.voeding}</p>
      <div className="aygm-kaart aygm-voeding">
        <div>
          <p className="aygm-boven">{t.doel}</p>
          <p className="aygm-getal">{formatGetal(2300, taal)}</p>
          <p className="aygm-boven">{t.kcalPerDag}</p>
        </div>
        <div className="aygm-macros">
          {MACROS.map((m, i) => (
            <div key={t.macros[i]}>
              <span className="aygm-macro-tekst">
                <span>{t.macros[i]}</span>
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
        {t.maaltijden.map((m) => (
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

/** Inloggen in de web-app: het lid logt in met e-mailadres en een eigen wachtwoord. */
export async function AppInloggen() {
  const t = APP_SCHERMEN[await getSiteTaal()]
  return (
    <div className="aygm-pin">
      <div className="aygm-pin-kop">
        <p className="aygm-hallo">{t.welkom}</p>
        <p className="aygm-boven">{t.logIn}</p>
        <p className="aygm-boven">{`${VOORBEELD_NAAM} ${VOORBEELD_VESTIGING} · ${VOORBEELD_STRAAT}`}</p>
        <p className="aygm-boven">{t.openingstijden}</p>
      </div>
      <div className="aygm-inlog-velden" aria-hidden>
        <span className="aygm-inlog-label">{t.email}</span>
        <span className="aygm-inlog-veld">{t.voorbeeldEmail}</span>
        <span className="aygm-inlog-label">{t.wachtwoord}</span>
        <span className="aygm-inlog-veld">••••••••••••••</span>
        <span className="aygm-inlog-knop">{t.inloggen}</span>
      </div>
      <p className="aygm-pin-voet">{t.beginscherm}</p>
    </div>
  )
}
