'use client'

import { useRouter } from 'next/navigation'
import { useMelding } from '@/components/club/lidmaatschappen/useMelding'
import type { Gezin, Korting } from '@/lib/club/betalen/plannen/model'
import { KortingFormulier, type PlanKeuze } from './KortingFormulier'
import { KortingRegel } from './KortingRegel'
import { GezinnenBeheer } from './GezinnenBeheer'
import { LidgeldMelding, type LidgeldInfo } from './LidgeldMelding'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

// Kortingen en acties: links de lijst, rechts meteen een nieuwe korting, en
// daaronder de gezinskorting. Na elke actie een melding en de pagina ververst.

interface Props {
  kortingen: readonly Korting[]
  gezinnen: readonly Gezin[]
  plannen: readonly PlanKeuze[]
  stand: LidgeldInfo
}

export function KortingenBeheer({ kortingen, gezinnen, plannen, stand }: Props) {
  const router = useRouter()
  const { melding, klaar } = useMelding(() => router.refresh())
  const actief = kortingen.filter((k) => k.actief).length
  const metCode = kortingen.filter((k) => k.code !== null).length
  const t = useTekst(BETALEN).kortingen

  return (
    <>
      {melding}
      <LidgeldMelding {...stand} />
      <dl className="club-lidm-cijfers">
        <div><dt>{t.kortingen}</dt><dd>{kortingen.length}</dd></div>
        <div><dt>{t.aan}</dt><dd>{actief}</dd></div>
        <div><dt>{t.metCode}</dt><dd>{metCode}</dd></div>
        <div><dt>{t.gezinnen}</dt><dd>{gezinnen.length}</dd></div>
      </dl>
      <div className="club-lidm-werkvlak">
        <section className="club-lidm-hoofd" aria-labelledby="kortingen-lijst">
          <h2 id="kortingen-lijst" className="club-lidm-kop">{t.titel}</h2>
          {kortingen.length === 0 ? (
            <p className="club-lidm-leeg">{t.leeg}</p>
          ) : (
            <ul className="club-lidm-lijst">
              {kortingen.map((k) => <KortingRegel key={k.id} korting={k} plannen={plannen} onKlaar={klaar} />)}
            </ul>
          )}
        </section>
        <aside className="club-lidm-zij" aria-label={t.toevoegen}>
          <section className="club-kaart" aria-labelledby="korting-nieuw">
            <h2 id="korting-nieuw">{t.nieuw}</h2>
            <p className="club-hint">{t.codeHint}</p>
            <KortingFormulier plannen={plannen} onKlaar={klaar} />
          </section>
        </aside>
      </div>
      <GezinnenBeheer gezinnen={gezinnen} kortingen={kortingen} onKlaar={klaar} />
    </>
  )
}
