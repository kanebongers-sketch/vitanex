'use client'

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { EditorRegel } from '@/lib/club/training/editor'
import type { ProgressieRegel, SuggestieSoort } from '@/lib/club/training/progressie'
import type { Oefening } from '@/lib/club/training/rijen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { SCHEMA_WEERGAVE } from '@/lib/aiyourgym/taal/woorden/club/schema-weergave'
import { Sparklijn } from '../../ontwerp/Sparklijn'
import { OefeningVoorbeeld } from '../repspeler/OefeningVoorbeeld'
import { TempoCurve } from '../TempoCurve'

// Het zijpaneel van de editor: de oefening die de trainer net aanwees. Groot
// beeld met de rep-speler op het voorschrift van deze regel, de kernpunten uit
// de coaching, het voorschrift als cijfers, en bij een lid de zwaarste set met
// het verloop en de volgende stap volgens de vaste vakregel (dubbele progressie).

interface GekozenOefeningProps {
  regel: EditorRegel | null
  label: string
  oefening: Oefening | undefined
  kernpunten: readonly string[] | undefined
  /** Verloop van het lid; null bij een sjabloon (dan geen blok progressie). */
  progressie: ProgressieRegel | null | undefined
  metProgressie: boolean
}

const RICHTING: Record<SuggestieSoort, 'op' | 'neer' | 'gelijk'> = {
  start: 'gelijk',
  gewicht_omhoog: 'op',
  herhalingen_omhoog: 'op',
  tijd_omhoog: 'op',
  zwaardere_variant: 'op',
  vasthouden: 'gelijk',
  gewicht_omlaag: 'neer',
}

const getal = (tekst: string): number | null => {
  const n = Number(tekst.replace(',', '.'))
  return tekst.trim() !== '' && Number.isFinite(n) && n > 0 ? n : null
}

export function GekozenOefening(p: GekozenOefeningProps) {
  const t = useTekst(SCHEMA_WEERGAVE).gekozen
  const r = p.regel
  if (!r || !p.oefening) {
    return (
      <section className="club-kaart club-gekozen club-gekozen--leeg" aria-labelledby="gekozen-kop">
        <h2 id="gekozen-kop" className="club-gekozen-boven">{t.kop}</h2>
        <p className="club-hint">{t.leeg}</p>
      </section>
    )
  }
  const o = p.oefening
  return (
    <section className="club-kaart club-gekozen" aria-labelledby="gekozen-kop" aria-live="polite">
      <header className="club-gekozen-kop">
        <span className="club-gekozen-boven">{t.kop}</span>
        <h2 id="gekozen-kop">
          {p.label && <span className="club-gekozen-label">{p.label}</span>}
          {o.naam}
        </h2>
      </header>
      <div className="club-gekozen-beeld">
        <OefeningVoorbeeld
          key={r.sleutel}
          naam={o.naam}
          beeld={o.beeld}
          herhalingen={r.maat === 'herhalingen' ? r.herhalingen || null : null}
          tijdSec={r.maat === 'tijd' ? getal(r.tijdSec) : null}
          tempo={r.tempo || null}
          rustSec={getal(r.rustSec)}
        />
      </div>
      <Voorschrift regel={r} />
      <Kernpunten punten={p.kernpunten} />
      {p.metProgressie && <Verloop regel={p.progressie} naam={o.naam} />}
    </section>
  )
}

function Voorschrift({ regel: r }: { regel: EditorRegel }) {
  const t = useTekst(SCHEMA_WEERGAVE).gekozen
  const cellen = [
    { label: t.sets, waarde: r.sets },
    r.maat === 'tijd' ? { label: t.tijd, waarde: r.tijdSec, eenheid: 's' } : { label: t.herhalingen, waarde: r.herhalingen },
    { label: t.kg, waarde: r.gewichtKg },
    { label: t.rust, waarde: r.rustSec, eenheid: 's' },
  ]
  return (
    <div className="club-gekozen-voorschrift">
      <p className="club-gekozen-boven">{t.voorschrift}</p>
      <dl className="club-gekozen-cijfers">
        {cellen.map((c) => (
          <div key={c.label} data-leeg={c.waarde.trim() === '' || undefined}>
            <dt>{c.label}</dt>
            <dd>
              {c.waarde.trim() === '' ? '·' : c.waarde}
              {c.eenheid && c.waarde.trim() !== '' ? <small>{c.eenheid}</small> : null}
            </dd>
          </div>
        ))}
      </dl>
      <TempoCurve tempo={r.tempo} formaat="groot" />
    </div>
  )
}

function Kernpunten({ punten }: { punten: readonly string[] | undefined }) {
  const t = useTekst(SCHEMA_WEERGAVE).gekozen
  return (
    <div className="club-gekozen-kern">
      <p className="club-gekozen-boven">{t.kernpunten}</p>
      {punten && punten.length > 0 ? (
        <ol>
          {punten.slice(0, 5).map((punt, i) => (
            <li key={i}>
              <b aria-hidden>{i + 1}</b>
              <span>{punt}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="club-hint">{t.geenKernpunten}</p>
      )}
    </div>
  )
}

function Verloop({ regel, naam }: { regel: ProgressieRegel | null | undefined; naam: string }) {
  const taal = useTaal()
  const t = useTekst(SCHEMA_WEERGAVE).gekozen
  if (!regel || regel.aantal === 0 || regel.reeks.length === 0) {
    return (
      <div className="club-gekozen-verloop">
        <p className="club-gekozen-boven">{t.zwaarste}</p>
        <p className="club-hint">{t.nogNiets}</p>
        {regel && <Advies regel={regel} />}
      </div>
    )
  }
  const waarden = regel.reeks.map((p) => p.waarde)
  const hoogste = Math.max(...waarden)
  return (
    <div className="club-gekozen-verloop">
      <p className="club-gekozen-boven">{regel.eenheid === 'kg' ? t.zwaarste : t.beste}</p>
      <div className="club-gekozen-piek">
        <strong>
          {formatGetal(hoogste, taal)}
          {regel.eenheid && <small>{t.eenheid[regel.eenheid]}</small>}
        </strong>
        <span className="club-spark--data">
          <Sparklijn waarden={waarden} label={t.verloop(naam)} breedte={150} hoogte={40} />
        </span>
      </div>
      <p className="club-gekozen-keer">{t.keer(regel.aantal)}</p>
      <Advies regel={regel} />
    </div>
  )
}

function Advies({ regel }: { regel: ProgressieRegel }) {
  const t = useTekst(SCHEMA_WEERGAVE).gekozen
  const richting = RICHTING[regel.suggestie.soort]
  const Icoon = richting === 'op' ? ArrowUpRight : richting === 'neer' ? ArrowDownRight : Minus
  return (
    <div className="club-gekozen-advies" data-richting={richting}>
      <p className="club-gekozen-boven">{t.volgende}</p>
      <p className="club-gekozen-advies-tekst">
        <Icoon aria-hidden size={16} />
        <span>{regel.suggestie.tekst}</span>
      </p>
      <p className="club-gekozen-regelnaam">{t.regelNaam}</p>
    </div>
  )
}
