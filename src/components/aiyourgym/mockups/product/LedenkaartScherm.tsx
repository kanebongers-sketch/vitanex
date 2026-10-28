import { Check } from 'lucide-react'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { PRODUCTSCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/mockups/productschermen'
import { Venster } from '../kaders'
import { PBlok, PCijfer, PMeter, PStrook } from './bouwstenen'

// De ledenkaart van Club in de nieuwe stijl: kop met het lid, de zes tabbladen,
// het bezoek in drie cijfers (zoals BezoekCijfers in Club: de lopende maand met de
// vorige als grijze basis, het gemiddelde per week met het verloop en de no-shows)
// en daaronder het schema van deze week en het lidmaatschap. Vaste voorbeelddata.

/** Het voorbeeldlid (verzonnen). */
const LID = { ini: 'SB', naam: 'Sanne Bakker' } as const
const PER_WEEK = [2, 3, 2, 3, 2, 2, 3, 1, 2, 3, 3, 2] as const
const GEMIDDELD = PER_WEEK.reduce((s, w) => s + w, 0) / PER_WEEK.length
/** Ma en Wo gedaan, Vr nog open: dezelfde week als de weekring in de ledenapp. */
const WEEK = [true, true, false] as const
const GEDAAN = WEEK.filter(Boolean).length

export async function LedenkaartScherm() {
  const taal = await getSiteTaal()
  const t = PRODUCTSCHERMEN[taal].ledenkaart
  return (
    <Venster actief="Leden" hier="Leden">
      <div className="aygp">
        <div className="aygp-lid">
          <span className="aygp-avatar aygp-avatar--groot">{LID.ini}</span>
          <div className="aygp-lid-tekst">
            <p className="aygp-titel">{LID.naam}</p>
            <p className="aygp-chips">
              <span className="aygp-chip aygp-chip--ok">{t.actief}</span>
              <span className="aygp-chip">{t.onbeperkt}</span>
              <span className="aygp-waar">{t.sinds}</span>
            </p>
          </div>
          <span className="aygp-acties">
            {t.acties.map((a, i) => (
              <span key={a} className={i === 0 ? 'aygp-knop' : 'aygp-knop aygp-knop--rand'}>
                {a}
              </span>
            ))}
          </span>
        </div>
        <div className="aygp-tabs">
          {t.tabs.map((tab, i) => (
            <span key={tab} data-actief={i === 0 || undefined}>
              {tab}
            </span>
          ))}
        </div>
        <PStrook label={t.strook} kolommen={4}>
          <PCijfer hoofd label={t.dezeMaand} waarde="9" sub={t.dezeMaandSub} />
          <PCijfer label={t.perWeek} waarde={formatGetal(GEMIDDELD, taal, { maximumFractionDigits: 1 })} sub={t.perWeekSub} trend={{ waarden: PER_WEEK, label: t.perWeekTrend }} />
          <PCijfer label={t.noShows} waarde="0" sub={t.noShowsSub} />
        </PStrook>
        <div className="aygp-twee aygp-twee--gelijk">
          <PBlok titel={t.schema} className="aygp-blok--verhoogd">
            <p className="aygp-groot">{t.schemaNaam}</p>
            <PMeter deel={GEDAAN / WEEK.length} label={t.schema} />
            <ul className="aygp-ronde">
              {t.dagen.map((d, i) => (
                <li key={d} data-gedaan={WEEK[i] || undefined}>
                  {WEEK[i] ? <Check size={12} aria-hidden /> : null}
                  {d}
                </li>
              ))}
            </ul>
            <p className="aygp-klein">{t.schemaStand(GEDAAN, WEEK.length)}</p>
          </PBlok>
          <PBlok titel={t.lidmaatschap}>
            <p className="aygp-groot">{t.vorm}</p>
            <p className="aygp-klein">{t.vormSub}</p>
          </PBlok>
        </div>
      </div>
    </Venster>
  )
}
