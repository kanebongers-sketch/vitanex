'use client'

import { Check, Plus } from 'lucide-react'
import { LES_SOORTEN, type LesSoort } from '@/lib/club/rooster/typen'
import type { Intensiteit, TypeRij } from '@/lib/club/start/lessen-plan'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// De lestypen in stap Lessen: bovenaan een snelle keuze (een klik zet een
// lestype aan of uit). Eerst wat je al had, dan de voorbeelden; geen enkel
// voorbeeld staat vooraf aan (besluit Kane 30-10-2026: de eigenaar kiest zelf).
// Daaronder per gekozen lestype meteen naam, soort, duur, zwaarte en uitleg.

const INTENSITEIT: Record<Intensiteit, 'rustig' | 'gemiddeld' | 'zwaar'> = { 1: 'rustig', 2: 'gemiddeld', 3: 'zwaar' }

interface LestypeKeuzeProps {
  typen: TypeRij[]
  onWissel: (sleutel: string) => void
  onWijzig: (sleutel: string, w: Partial<TypeRij>) => void
  onNieuw: () => void
}

function Chip({ t, onWissel }: { t: TypeRij; onWissel: LestypeKeuzeProps['onWissel'] }) {
  const tekst = useTekst(START).lestypen
  return (
    <label className="club-start-chip" data-aan={t.aan || undefined}>
      <input type="checkbox" checked={t.aan} onChange={() => onWissel(t.sleutel)} />
      <span className="club-start-chip-vink" aria-hidden>{t.aan ? <Check size={13} strokeWidth={3} /> : <Plus size={13} strokeWidth={2.5} />}</span>
      {t.naam.trim() || tekst.naamloos}
    </label>
  )
}

function TypeKaart({ t, onWijzig, onWissel }: { t: TypeRij; onWijzig: LestypeKeuzeProps['onWijzig']; onWissel: LestypeKeuzeProps['onWissel'] }) {
  const tekst = useTekst(START).lestypen
  const label = t.naam.trim() || tekst.nieuwLestype
  return (
    <li className="club-start-typekaart club-rooster-soortstreep" data-soort={t.soort}>
      <div className="club-start-typekaart-velden">
        <label className="club-veld club-start-typekaart-naam">
          <span>{tekst.naam}</span>
          <input className="club-invoer" value={t.naam} maxLength={60} placeholder={tekst.naamPlaats} onChange={(e) => onWijzig(t.sleutel, { naam: e.target.value })} />
        </label>
        <label className="club-veld">
          <span>{tekst.soort}</span>
          <select className="club-invoer" value={t.soort} onChange={(e) => onWijzig(t.sleutel, { soort: e.target.value as LesSoort })}>
            {LES_SOORTEN.map((s) => (
              <option key={s} value={s}>{tekst.soorten[s]}</option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>{tekst.duur}</span>
          <input className="club-invoer" type="number" inputMode="numeric" min={10} max={240} step={5} value={t.duurMin} onChange={(e) => onWijzig(t.sleutel, { duurMin: Number(e.target.value) })} />
        </label>
        <label className="club-veld">
          <span>{tekst.zwaarte}</span>
          <select className="club-invoer" value={t.intensiteit} onChange={(e) => onWijzig(t.sleutel, { intensiteit: Number(e.target.value) as Intensiteit })}>
            {([1, 2, 3] as const).map((n) => (
              <option key={n} value={n}>{tekst.intensiteit[INTENSITEIT[n]]}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="club-veld">
        <span>{tekst.uitleg}</span>
        <textarea className="club-invoer" rows={2} maxLength={600} value={t.omschrijving} onChange={(e) => onWijzig(t.sleutel, { omschrijving: e.target.value })} />
      </label>
      <button type="button" className="club-knop club-knop--stil club-knop--klein club-start-typekaart-uit" onClick={() => onWissel(t.sleutel)} aria-label={tekst.nietGevenLabel(label)}>
        {tekst.nietGeven}
      </button>
    </li>
  )
}

export function LestypeKeuze({ typen, onWissel, onWijzig, onNieuw }: LestypeKeuzeProps) {
  const gekozen = typen.filter((t) => t.aan)
  const opties = typen.filter((t) => !t.sleutel.startsWith('nieuw:'))
  const tekst = useTekst(START).lestypen
  return (
    <section className="club-start-blok" aria-labelledby="start-lestypen-kop">
      <div className="club-start-blokkop">
        <h2 id="start-lestypen-kop">{tekst.kop}</h2>
        <span className="club-chip club-chip--merk">{tekst.gekozen(gekozen.length)}</span>
      </div>
      <div className="club-start-chipgroepen">
        <fieldset className="club-start-chips">
          <legend className="club-start-chipkop">{tekst.voorbeelden}</legend>
          {opties.map((t) => (
            <Chip key={t.sleutel} t={t} onWissel={onWissel} />
          ))}
          <button type="button" className="club-start-chip club-start-chip--eigen" onClick={onNieuw}>
            <Plus aria-hidden size={13} strokeWidth={2.5} /> {tekst.eigen}
          </button>
        </fieldset>
      </div>
      {gekozen.length > 0 ? (
        <ul className="club-start-typekaarten" role="list">
          {gekozen.map((t) => (
            <TypeKaart key={t.sleutel} t={t} onWijzig={onWijzig} onWissel={onWissel} />
          ))}
        </ul>
      ) : (
        <p className="club-leeg">{tekst.kies}</p>
      )}
    </section>
  )
}
