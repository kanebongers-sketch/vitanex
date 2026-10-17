'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import { ledenTekst, type Los } from '@/lib/club/lidmaatschappen/tellen'
import { VormFormulier } from './VormFormulier'
import { VormRegel, type VormMetAantal } from './VormRegel'
import { LosseLijst } from './LosseLijst'
import { useMelding } from './useMelding'

// Het tabblad Lidmaatschapsvormen: links de vormen met hun leden, rechts een
// vorm toevoegen en de abonnementsnamen uit de ledenlijst die nog geen vorm zijn.

interface Props {
  vormen: readonly VormMetAantal[]
  los: readonly Los[]
  /** null = de leden konden niet worden geteld. */
  totaalLeden: number | null
  vestiging: string | null
}

export function VormenBeheer({ vormen, los, totaalLeden, vestiging }: Props) {
  const router = useRouter()
  const { melding, klaar } = useMelding(() => router.refresh())
  const [bezig, setBezig] = useState(false)
  const metVorm = vormen.reduce((n, v) => n + v.leden, 0)
  const zonderVorm = los.reduce((n, l) => n + l.leden, 0)

  async function overnemen() {
    setBezig(true)
    const uit = await stuur('/api/club/lidmaatschappen/vormen/overnemen', 'POST')
    setBezig(false)
    if (!uit.ok) return klaar(uit.fout, false)
    const n = (uit.data as { toegevoegd?: number } | null)?.toegevoegd ?? 0
    klaar(n === 0 ? 'Er was niets nieuws om over te nemen.' : `${n} ${n === 1 ? 'vorm' : 'vormen'} overgenomen. Vul per vorm de regels aan.`)
  }

  return (
    <>
      {melding}
      <dl className="club-lidm-cijfers">
        <div>
          <dt>Vormen</dt>
          <dd>{vormen.length}</dd>
        </div>
        <div>
          <dt>Leden met een vorm</dt>
          <dd>{metVorm}</dd>
        </div>
        <div className={zonderVorm > 0 ? 'is-let' : undefined}>
          <dt>Abonnement zonder vorm</dt>
          <dd>{zonderVorm}</dd>
        </div>
        {totaalLeden !== null && (
          <div>
            <dt>Leden totaal</dt>
            <dd>{totaalLeden}</dd>
          </div>
        )}
      </dl>
      <div className="club-lidm-werkvlak">
        <section className="club-lidm-hoofd" aria-labelledby="lidm-vormen">
          <h2 id="lidm-vormen" className="club-lidm-kop">Lidmaatschapsvormen</h2>
          {vormen.length === 0 ? (
            <p className="club-lidm-leeg">Nog geen vormen. Neem ze over uit de ledenlijst of voeg er zelf een toe.</p>
          ) : (
            <ul className="club-lidm-lijst">
              {vormen.map((v) => (
                <VormRegel key={v.id} vorm={v} vestiging={vestiging} onKlaar={klaar} />
              ))}
            </ul>
          )}
        </section>
        <aside className="club-lidm-zij" aria-label="Toevoegen">
          {los.length > 0 && (
            <section className="club-kaart club-kaart--accent" aria-labelledby="lidm-los">
              <h2 id="lidm-los">Uit de ledenlijst</h2>
              <p className="club-hint">
                Deze abonnementen staan bij {ledenTekst(zonderVorm)}, maar zijn nog geen vorm. Overnemen maakt er vormen van zonder beperkingen.
              </p>
              <LosseLijst items={los} />
              <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void overnemen()}>
                {bezig ? 'Bezig...' : 'Vormen overnemen uit de ledenlijst'}
              </button>
            </section>
          )}
          <section className="club-kaart" aria-labelledby="lidm-nieuw">
            <h2 id="lidm-nieuw">Nieuwe vorm</h2>
            <p className="club-hint">Gebruik precies de naam uit Sportivity: zo koppelt Club de leden aan de vorm.</p>
            <VormFormulier onKlaar={klaar} />
          </section>
        </aside>
      </div>
    </>
  )
}
