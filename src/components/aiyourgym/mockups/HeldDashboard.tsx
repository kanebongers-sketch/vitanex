import { Play, Plus } from 'lucide-react'
import { COACHING_BENEN } from '@/lib/club/training/coaching/benen'
import { Venster } from './kaders'

// Het samengestelde productbeeld van de voorpagina: het scherm Vandaag van Club
// met de lessen van de dag en een ledenkaart, plus een oefening met coaching
// (ernaast) en de ledenapp met QR (in de Held). Allemaal onze echte schermen,
// getekend met voorbeeldgegevens; de coaching komt uit de oefenbibliotheek van Club.

const TEGELS = [
  { label: 'Nu binnen', waarde: '23', accent: true },
  { label: 'Lessen vandaag', waarde: '6' },
  { label: 'Opvolgen', waarde: '5' },
  { label: 'Taken', waarde: '7/12' },
] as const

interface Les {
  tijd: string
  naam: string
  bezet: number
  plekken: number
  wachtlijst?: number
}

const LESSEN: readonly Les[] = [
  { tijd: '07:00', naam: 'Spinning', bezet: 12, plekken: 16 },
  { tijd: '09:00', naam: 'Pilates', bezet: 10, plekken: 12 },
  { tijd: '12:00', naam: 'Lunchfit', bezet: 6, plekken: 14 },
  { tijd: '18:30', naam: 'Spinning', bezet: 16, plekken: 16, wachtlijst: 3 },
  { tijd: '20:00', naam: 'Yoga', bezet: 9, plekken: 14 },
]

function LesRij({ les }: { les: Les }) {
  const vol = les.bezet >= les.plekken
  return (
    <div className="aygm-dash-les" data-vol={vol ? '' : undefined}>
      <span className="aygm-dash-tijd">{les.tijd}</span>
      <span className="aygm-dash-les-naam">
        <b>{les.naam}</b>
        <span className="aygm-balk">
          <span style={{ transform: `scaleX(${Math.min(les.bezet / les.plekken, 1)})` }} />
        </span>
      </span>
      <span className="aygm-dash-stand">{vol ? `Vol · wachtlijst ${les.wachtlijst ?? 0}` : `${les.bezet}/${les.plekken}`}</span>
    </div>
  )
}

function Ledenkaart() {
  return (
    <div className="aygm-kaart aygm-dash-lid">
      <p className="aygm-boven">Ledenkaart</p>
      <div className="aygm-wie">
        <span className="aygm-avatar">SB</span>
        <span className="aygm-dash-lid-naam">
          <b>Sanne Bakker</b>
          <span className="aygm-dash-chips">
            <span className="aygm-chip aygm-chip--ok">Actief</span>
            <span className="aygm-chip">Onbeperkt</span>
          </span>
        </span>
      </div>
      <div className="aygm-dash-feiten">
        <div>
          <p className="aygm-boven">Bezoeken 30 dagen</p>
          <p className="aygm-getal">9</p>
        </div>
        <div>
          <p className="aygm-boven">Weken op rij</p>
          <p className="aygm-getal">6</p>
        </div>
      </div>
      <div className="aygm-dash-schema">
        <p className="aygm-boven">Trainingsschema</p>
        <b>Kracht 3x per week · dag A</b>
      </div>
    </div>
  )
}

/** Het scherm Vandaag in een browservenster: tegels, de lessen van de dag en een ledenkaart. */
export function HeldDashboard() {
  return (
    <Venster actief="Werkvloer">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">Centrum · dinsdag 20 oktober</p>
          <p className="aygm-kop">Vandaag</p>
        </div>
        <span className="aygm-knopje">
          <Plus size={13} aria-hidden /> Check-in
        </span>
      </div>
      <div className="aygm-tegels aygm-dash-tegels">
        {TEGELS.map((t) => (
          <div key={t.label} className="aygm-tegel" data-accent={'accent' in t ? '' : undefined}>
            <p className="aygm-boven">{t.label}</p>
            <p className="aygm-getal">{t.waarde}</p>
          </div>
        ))}
      </div>
      <div className="aygm-dash-raster">
        <div className="aygm-kaart aygm-dash-lessen">
          <p className="aygm-boven">Lessen vandaag</p>
          {LESSEN.map((l) => (
            <LesRij key={`${l.tijd}-${l.naam}`} les={l} />
          ))}
        </div>
        <Ledenkaart />
      </div>
    </Venster>
  )
}

const OEFENING = 'Goblet squat'
const OEFENING_BEELD = 'goblet-squat'

/** Een oefening uit een schema, klein: bewegend beeld en de eerste kernpunten. */
export function OefeningKaartje() {
  const coaching = COACHING_BENEN[OEFENING]
  if (!coaching) return null
  return (
    <div className="aygm-dash-oef">
      <div className="aygm-beeld">
        <img src={`/club/oefeningen-repdb/${OEFENING_BEELD}-start.webp`} alt="" width={512} height={512} decoding="async" />
        <img className="aygm-beeld-eind" src={`/club/oefeningen-repdb/${OEFENING_BEELD}-eind.webp`} alt="" width={512} height={512} decoding="async" />
        <span className="aygm-dash-speel">
          <Play size={11} aria-hidden />
        </span>
      </div>
      <div className="aygm-dash-oef-tekst">
        <p className="aygm-boven">Schema · dag A · 1</p>
        <p className="aygm-kop">{OEFENING}</p>
        <ol className="aygm-kernpunten">
          {coaching.kernpunten.slice(0, 3).map((k) => (
            <li key={k.punt}>
              <b>{k.punt}</b>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
