'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import type { Los } from '@/lib/club/lidmaatschappen/tellen'
import { LabelFormulier } from './LabelFormulier'
import { LabelRegel, type LabelMetAantal } from './LabelRegel'
import { LosseLijst } from './LosseLijst'
import { useMelding } from './useMelding'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LIDMAATSCHAPPEN } from '@/lib/aiyourgym/taal/woorden/club/lidmaatschappen'

// Het tabblad Labels: de nette lijst boven de tags van leden. Rechts een label
// toevoegen en de tags die leden al hebben maar nog geen label zijn.

interface Props {
  labels: readonly LabelMetAantal[]
  los: readonly Los[]
  vestiging: string | null
}

export function LabelsBeheer({ labels, los, vestiging }: Props) {
  const router = useRouter()
  const { melding, klaar } = useMelding(() => router.refresh())
  const [bezig, setBezig] = useState(false)
  const tekst = useTekst(LIDMAATSCHAPPEN)
  const t = tekst.labels

  async function overnemen() {
    setBezig(true)
    const uit = await stuur('/api/club/lidmaatschappen/labels/overnemen', 'POST')
    setBezig(false)
    if (!uit.ok) return klaar(uit.fout, false)
    const n = (uit.data as { toegevoegd?: number } | null)?.toegevoegd ?? 0
    klaar(n === 0 ? tekst.algemeen.niets : t.overgenomen(n))
  }

  return (
    <>
      {melding}
      <div className="club-lidm-werkvlak">
        <section className="club-lidm-hoofd" aria-labelledby="lidm-labels">
          <h2 id="lidm-labels" className="club-lidm-kop">{t.kop}</h2>
          <p className="club-hint club-lidm-intro">{t.intro}</p>
          {labels.length === 0 ? (
            <p className="club-lidm-leeg">{t.leeg}</p>
          ) : (
            <ul className="club-lidm-lijst">
              {labels.map((l) => (
                <LabelRegel key={l.id} label={l} vestiging={vestiging} onKlaar={klaar} />
              ))}
            </ul>
          )}
        </section>
        <aside className="club-lidm-zij" aria-label={tekst.algemeen.toevoegen}>
          {los.length > 0 && (
            <section className="club-kaart club-kaart--accent" aria-labelledby="lidm-lostags">
              <h2 id="lidm-lostags">{t.losKop}</h2>
              <p className="club-hint">{t.losUitleg}</p>
              <LosseLijst items={los} />
              <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void overnemen()}>
                {bezig ? tekst.algemeen.bezig : t.overnemen}
              </button>
            </section>
          )}
          <section className="club-kaart" aria-labelledby="lidm-nieuwlabel">
            <h2 id="lidm-nieuwlabel">{t.nieuw}</h2>
            <LabelFormulier onKlaar={klaar} />
          </section>
        </aside>
      </div>
    </>
  )
}
