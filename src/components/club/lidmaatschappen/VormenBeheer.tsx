'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import { ledenTekst, type Los } from '@/lib/club/lidmaatschappen/tellen'
import { VormFormulier } from './VormFormulier'
import { VormRegel, type VormMetAantal } from './VormRegel'
import { LosseLijst } from './LosseLijst'
import { useMelding } from './useMelding'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LIDMAATSCHAPPEN } from '@/lib/aiyourgym/taal/woorden/club/lidmaatschappen'
import type { PlanWeergave } from '@/lib/club/betalen/plannen/weergave'
import { LidgeldMelding, type LidgeldInfo } from '@/components/club/betalen/plannen/LidgeldMelding'

// Het tabblad Lidmaatschapsvormen: links de vormen met hun leden, rechts een
// vorm toevoegen en de abonnementsnamen uit de ledenlijst die nog geen vorm zijn.

interface Props {
  vormen: readonly VormMetAantal[]
  los: readonly Los[]
  /** null = de leden konden niet worden geteld. */
  totaalLeden: number | null
  vestiging: string | null
  /** Lidgeld aan: per vorm de plannen met prijs en contract; null = geen prijs en contract tonen. */
  lidgeld?: (LidgeldInfo & { perVorm: Readonly<Record<string, readonly PlanWeergave[]>>; vandaag: string }) | null
}

export function VormenBeheer({ vormen, los, totaalLeden, vestiging, lidgeld = null }: Props) {
  const router = useRouter()
  const { melding, klaar } = useMelding(() => router.refresh())
  const [bezig, setBezig] = useState(false)
  const metVorm = vormen.reduce((n, v) => n + v.leden, 0)
  const zonderVorm = los.reduce((n, l) => n + l.leden, 0)
  const taal = useTaal()
  const tekst = useTekst(LIDMAATSCHAPPEN)
  const t = tekst.vormen

  async function overnemen() {
    setBezig(true)
    const uit = await stuur('/api/club/lidmaatschappen/vormen/overnemen', 'POST')
    setBezig(false)
    if (!uit.ok) return klaar(uit.fout, false)
    const n = (uit.data as { toegevoegd?: number } | null)?.toegevoegd ?? 0
    klaar(n === 0 ? tekst.algemeen.niets : t.overgenomen(n))
  }

  return (
    <>
      {melding}
      {lidgeld && <LidgeldMelding schaduw={lidgeld.schaduw} incassoAan={lidgeld.incassoAan} alleenKane={lidgeld.alleenKane} />}
      <dl className="club-lidm-cijfers">
        <div>
          <dt>{t.cijfers.vormen}</dt>
          <dd>{vormen.length}</dd>
        </div>
        <div>
          <dt>{t.cijfers.metVorm}</dt>
          <dd>{metVorm}</dd>
        </div>
        <div className={zonderVorm > 0 ? 'is-let' : undefined}>
          <dt>{t.cijfers.zonderVorm}</dt>
          <dd>{zonderVorm}</dd>
        </div>
        {totaalLeden !== null && (
          <div>
            <dt>{t.cijfers.totaal}</dt>
            <dd>{totaalLeden}</dd>
          </div>
        )}
      </dl>
      <div className="club-lidm-werkvlak">
        <section className="club-lidm-hoofd" aria-labelledby="lidm-vormen">
          <h2 id="lidm-vormen" className="club-lidm-kop">{t.kop}</h2>
          {vormen.length === 0 ? (
            <p className="club-lidm-leeg">{t.leeg}</p>
          ) : (
            <ul className="club-lidm-lijst">
              {vormen.map((v) => (
                <VormRegel key={v.id} vorm={v} vestiging={vestiging} onKlaar={klaar} lidgeld={lidgeld ? { plannen: lidgeld.perVorm[v.id] ?? [], vandaag: lidgeld.vandaag } : null} />
              ))}
            </ul>
          )}
        </section>
        <aside className="club-lidm-zij" aria-label={tekst.algemeen.toevoegen}>
          {los.length > 0 && (
            <section className="club-kaart club-kaart--accent" aria-labelledby="lidm-los">
              <h2 id="lidm-los">{t.uitLijst}</h2>
              <p className="club-hint">{t.uitLijstUitleg(ledenTekst(zonderVorm, taal))}</p>
              <LosseLijst items={los} />
              <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void overnemen()}>
                {bezig ? tekst.algemeen.bezig : t.overnemen}
              </button>
            </section>
          )}
          <section className="club-kaart" aria-labelledby="lidm-nieuw">
            <h2 id="lidm-nieuw">{t.nieuw}</h2>
            <p className="club-hint">{t.nieuwUitleg}</p>
            <VormFormulier onKlaar={klaar} />
          </section>
        </aside>
      </div>
    </>
  )
}
