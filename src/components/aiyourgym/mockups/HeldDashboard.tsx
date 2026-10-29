import { Plus } from 'lucide-react'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { DASHBOARD } from '@/lib/aiyourgym/taal/woorden/website/mockups/schermen'
import { Avatar } from './Avatar'
import { Venster } from './kaders'
import { LES, VOORBEELD_VESTIGING } from './voorbeeld'

// Het scherm Vandaag van Club in de held van de voorpagina: tegels, de lessen van
// de dag en een ledenkaart. Onze echte schermen, getekend met voorbeeldgegevens.
// Teksten in de taal van de pagina (woordenboek DASHBOARD).

/** De voorbeelddag van het scherm Vandaag (een dinsdag). */
const VOORBEELD_DAG = '2026-10-20T12:00:00Z'

type Teksten = (typeof DASHBOARD)['nl']

const TEGELS = [
  { waarde: '23', accent: true },
  { waarde: '6', accent: false },
  { waarde: '5', accent: false },
  { waarde: '7/12', accent: false },
] as const

interface Les {
  tijd: string
  naam: string
  bezet: number
  plekken: number
  wachtlijst?: number
}

const LESSEN: readonly Les[] = [
  { tijd: '07:00', naam: LES.strength, bezet: 9, plekken: 12 },
  { tijd: '09:00', naam: LES.mobility, bezet: 10, plekken: 12 },
  { tijd: '12:00', naam: LES.kettlebell, bezet: 6, plekken: 10 },
  { tijd: '18:30', naam: LES.barbell, bezet: 12, plekken: 12, wachtlijst: 3 },
  { tijd: '20:00', naam: LES.conditioning, bezet: 11, plekken: 14 },
]

function LesRij({ les, t }: { les: Les; t: Teksten }) {
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
      <span className="aygm-dash-stand">{vol ? t.vol(les.wachtlijst ?? 0) : `${les.bezet}/${les.plekken}`}</span>
    </div>
  )
}

function Ledenkaart({ t }: { t: Teksten }) {
  return (
    <div className="aygm-kaart aygm-dash-lid">
      <p className="aygm-boven">{t.ledenkaart}</p>
      <div className="aygm-wie">
        <Avatar naam="Sanne Bakker" maat={26} className="aygm-avatar" lui={false} />
        <span className="aygm-dash-lid-naam">
          <b>Sanne Bakker</b>
          <span className="aygm-dash-chips">
            <span className="aygm-chip aygm-chip--ok">{t.actief}</span>
            <span className="aygm-chip">{t.onbeperkt}</span>
          </span>
        </span>
      </div>
      <div className="aygm-dash-feiten">
        <div>
          <p className="aygm-boven">{t.bezoeken30}</p>
          <p className="aygm-getal">9</p>
        </div>
        <div>
          <p className="aygm-boven">{t.wekenOpRij}</p>
          <p className="aygm-getal">6</p>
        </div>
      </div>
      <div className="aygm-dash-schema">
        <p className="aygm-boven">{t.schema}</p>
        <b>{t.schemaNaam}</b>
      </div>
    </div>
  )
}

/** Het scherm Vandaag in een browservenster: tegels, de lessen van de dag en een ledenkaart. */
export async function HeldDashboard() {
  const taal = await getSiteTaal()
  const t = DASHBOARD[taal]
  return (
    <Venster actief="Werkvloer">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">{t.vestiging(VOORBEELD_VESTIGING, formatDatum(VOORBEELD_DAG, taal, 'dag'))}</p>
          <p className="aygm-kop">{t.vandaag}</p>
        </div>
        <span className="aygm-knopje">
          <Plus size={13} aria-hidden /> {t.checkin}
        </span>
      </div>
      <div className="aygm-tegels aygm-dash-tegels">
        {TEGELS.map((tegel, i) => (
          <div key={t.tegels[i]} className="aygm-tegel" data-accent={tegel.accent ? '' : undefined}>
            <p className="aygm-boven">{t.tegels[i]}</p>
            <p className="aygm-getal">{tegel.waarde}</p>
          </div>
        ))}
      </div>
      <div className="aygm-dash-raster">
        <div className="aygm-kaart aygm-dash-lessen">
          <p className="aygm-boven">{t.lessenVandaag}</p>
          {LESSEN.map((l) => (
            <LesRij key={`${l.tijd}-${l.naam}`} les={l} t={t} />
          ))}
        </div>
        <Ledenkaart t={t} />
      </div>
    </Venster>
  )
}
