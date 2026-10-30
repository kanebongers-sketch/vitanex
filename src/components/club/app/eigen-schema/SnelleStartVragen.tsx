'use client'

import { useState } from 'react'
import { Dumbbell, Home, Sparkles, Warehouse } from 'lucide-react'
import { LID_DOELEN, LID_MATERIAAL, MAX_LID_DAGEN, MIN_DAGEN, type LidMateriaal, type SnelleStart } from '@/lib/club/training/lid-schemas/regels'
import { NIVEAUS } from '@/lib/club/training/typen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { EIGEN_SCHEMA } from '@/lib/aiyourgym/taal/woorden/ledenapp/eigen-schema'

// Vier vragen op een scherm, alles al ingevuld met een veilige keuze. Een lid
// dat niets wil kiezen tikt meteen op "Maak mijn schema".

const MATERIAAL_ICOON: Record<LidMateriaal, typeof Home> = { thuis: Home, dumbbells: Dumbbell, gym: Warehouse }

export const STANDAARD_START: SnelleStart = { doel: 'gezondheid', dagen: 3, materiaal: 'gym', niveau: 1 }

interface Props {
  begin: SnelleStart
  bezig: boolean
  fout: string | null
  onMaak: (keuze: SnelleStart) => void
}

export function SnelleStartVragen({ begin, bezig, fout, onMaak }: Props) {
  const t = useTekst(EIGEN_SCHEMA).vragen
  const [k, setK] = useState<SnelleStart>(begin)
  const dagen = Array.from({ length: MAX_LID_DAGEN - MIN_DAGEN + 1 }, (_, i) => MIN_DAGEN + i)
  return (
    <form className="club-es-vragen" onSubmit={(e) => { e.preventDefault(); onMaak(k) }}>
      <fieldset>
        <legend>{t.doel}</legend>
        <div className="club-es-keuzes">
          {LID_DOELEN.map((d) => (
            <button key={d} type="button" aria-pressed={k.doel === d} onClick={() => setK({ ...k, doel: d })}>{t.doelen[d]}</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>{t.dagen}</legend>
        <div className="club-es-getallen">
          {dagen.map((d) => (
            <button key={d} type="button" aria-pressed={k.dagen === d} onClick={() => setK({ ...k, dagen: d })}>{d}</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>{t.materiaal}</legend>
        <div className="club-es-tegels">
          {LID_MATERIAAL.map((m) => {
            const Icoon = MATERIAAL_ICOON[m]
            return (
              <button key={m} type="button" aria-pressed={k.materiaal === m} onClick={() => setK({ ...k, materiaal: m })}>
                <Icoon aria-hidden size={22} />
                <span>{t.materialen[m]}</span>
              </button>
            )
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend>{t.niveau}</legend>
        <div className="club-es-niveaus">
          {NIVEAUS.map((n) => (
            <button key={n} type="button" aria-pressed={k.niveau === n} onClick={() => setK({ ...k, niveau: n })}>
              <strong>{t.niveaus[n]}</strong>
              <small>{t.niveauUitleg[n]}</small>
            </button>
          ))}
        </div>
      </fieldset>
      {fout && <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert">{fout}</p>}
      <button type="submit" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed club-es-vragen-knop" disabled={bezig} aria-busy={bezig || undefined}>
        <Sparkles aria-hidden size={18} /> {bezig ? t.bezig : t.maak}
      </button>
    </form>
  )
}
