'use client'

import { Check, Plus } from 'lucide-react'
import { LES_SOORTEN, SOORT_LABEL, type LesSoort } from '@/lib/club/rooster/typen'
import type { Intensiteit, TypeRij } from '@/lib/club/start/lessen-plan'

// De lestypen in stap Lessen: bovenaan een snelle keuze (een klik zet een
// lestype aan of uit, de passende staan al aan), daaronder per gekozen lestype
// meteen naam, soort, duur, zwaarte en uitleg om aan te passen.

const INTENSITEIT: Record<Intensiteit, string> = { 1: 'Rustig', 2: 'Gemiddeld', 3: 'Zwaar' }

interface LestypeKeuzeProps {
  typen: TypeRij[]
  onWissel: (sleutel: string) => void
  onWijzig: (sleutel: string, w: Partial<TypeRij>) => void
  onNieuw: () => void
}

function TypeKaart({ t, onWijzig, onWissel }: { t: TypeRij; onWijzig: LestypeKeuzeProps['onWijzig']; onWissel: LestypeKeuzeProps['onWissel'] }) {
  const label = t.naam.trim() || 'nieuw lestype'
  return (
    <li className="club-start-typekaart club-rooster-soortstreep" data-soort={t.soort}>
      <div className="club-start-typekaart-velden">
        <label className="club-veld club-start-typekaart-naam">
          <span>Naam</span>
          <input className="club-invoer" value={t.naam} maxLength={60} placeholder="Bijvoorbeeld Ochtendkracht" onChange={(e) => onWijzig(t.sleutel, { naam: e.target.value })} />
        </label>
        <label className="club-veld">
          <span>Soort</span>
          <select className="club-invoer" value={t.soort} onChange={(e) => onWijzig(t.sleutel, { soort: e.target.value as LesSoort })}>
            {LES_SOORTEN.map((s) => (
              <option key={s} value={s}>{SOORT_LABEL[s]}</option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>Duur (min)</span>
          <input className="club-invoer" type="number" inputMode="numeric" min={10} max={240} step={5} value={t.duurMin} onChange={(e) => onWijzig(t.sleutel, { duurMin: Number(e.target.value) })} />
        </label>
        <label className="club-veld">
          <span>Zwaarte</span>
          <select className="club-invoer" value={t.intensiteit} onChange={(e) => onWijzig(t.sleutel, { intensiteit: Number(e.target.value) as Intensiteit })}>
            {([1, 2, 3] as const).map((n) => (
              <option key={n} value={n}>{INTENSITEIT[n]}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="club-veld">
        <span>Uitleg voor je leden</span>
        <textarea className="club-invoer" rows={2} maxLength={600} value={t.omschrijving} onChange={(e) => onWijzig(t.sleutel, { omschrijving: e.target.value })} />
      </label>
      <button type="button" className="club-knop club-knop--stil club-knop--klein club-start-typekaart-uit" onClick={() => onWissel(t.sleutel)} aria-label={`${label} niet geven`}>
        Niet geven
      </button>
    </li>
  )
}

export function LestypeKeuze({ typen, onWissel, onWijzig, onNieuw }: LestypeKeuzeProps) {
  const gekozen = typen.filter((t) => t.aan)
  const opties = typen.filter((t) => !t.sleutel.startsWith('nieuw:'))
  return (
    <section className="club-start-blok" aria-labelledby="start-lestypen-kop">
      <div className="club-start-blokkop">
        <h2 id="start-lestypen-kop">Welke lessen geef je?</h2>
        <span className="club-chip club-chip--merk">{gekozen.length} gekozen</span>
      </div>
      <fieldset className="club-start-chips">
        <legend className="club-sr">Kies je lestypen</legend>
        {opties.map((t) => (
          <label key={t.sleutel} className="club-start-chip" data-aan={t.aan || undefined} data-past={t.past || undefined}>
            <input type="checkbox" checked={t.aan} onChange={() => onWissel(t.sleutel)} />
            <span className="club-start-chip-vink" aria-hidden>{t.aan ? <Check size={13} strokeWidth={3} /> : <Plus size={13} strokeWidth={2.5} />}</span>
            {t.naam.trim() || 'Naamloos'}
          </label>
        ))}
        <button type="button" className="club-start-chip club-start-chip--eigen" onClick={onNieuw}>
          <Plus aria-hidden size={13} strokeWidth={2.5} /> Eigen lestype
        </button>
      </fieldset>
      {gekozen.length > 0 ? (
        <ul className="club-start-typekaarten" role="list">
          {gekozen.map((t) => (
            <TypeKaart key={t.sleutel} t={t} onWijzig={onWijzig} onWissel={onWissel} />
          ))}
        </ul>
      ) : (
        <p className="club-leeg">Kies hierboven de lessen die je geeft.</p>
      )}
    </section>
  )
}
