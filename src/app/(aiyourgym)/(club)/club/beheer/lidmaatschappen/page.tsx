import type { Metadata } from 'next'
import Link from 'next/link'
import { eisOnderdeel } from '@/lib/club/toegang'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { vormSleutel } from '@/lib/club/lidmaatschappen/model'
import { haalLabels, haalLidKenmerken, haalVormen } from '@/lib/club/lidmaatschappen/lezen'
import { ledenMetLabel, ledenMetVorm, losseAbonnementen, losseTags, telLeden } from '@/lib/club/lidmaatschappen/tellen'
import { VormenBeheer } from '@/components/club/lidmaatschappen/VormenBeheer'
import { LabelsBeheer } from '@/components/club/lidmaatschappen/LabelsBeheer'
import '@/components/club/lidmaatschappen/lidmaatschappen.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import type { ClubToegang } from '@/lib/club/toegang'
import { vandaagInAmsterdam } from '@/lib/club/betalen/contract/datum'
import { haalLidgeldStand, lidgeldOpen } from '@/lib/club/betalen/plannen/toegang'
import { haalPlannen, haalPrijzen, telContractenPerPlan } from '@/lib/club/betalen/plannen/opslag'
import { planWeergaven, type PlanWeergave } from '@/lib/club/betalen/plannen/weergave'
import '@/components/club/betalen/plannen/plannen.css'

export const metadata: Metadata = { title: 'Lidmaatschappen en labels' }

// Lidmaatschapsvormen (zoals ze in Sportivity heten, met toegangsregels) en de
// labels boven de tags van leden. Met lidgeld aan (CLUB_LIDGELD_ACTIEF en de
// schakelaar van de sportschool) krijgt elke vorm een blok Prijs en contract;
// anders blijft geld in de eigen ledenadministratie. Tabblad in de URL (?tab=labels).

type Tab = 'vormen' | 'labels'

interface Lidgeld {
  perVorm: Record<string, PlanWeergave[]>
  vandaag: string
  schaduw: boolean
  incassoAan: boolean
  alleenKane: boolean
}

/** Plannen met prijs en contract, alleen als lidgeld open is; 'fout' bij een leesfout. */
async function laadLidgeld(t: ClubToegang): Promise<Lidgeld | null | 'fout'> {
  if (!(await lidgeldOpen(t))) return null
  const [plannen, prijzen, contracten, stand] = await Promise.all([
    haalPlannen(t.admin, t.userId),
    haalPrijzen(t.admin, t.userId),
    telContractenPerPlan(t.admin, t.userId),
    haalLidgeldStand(t.admin, t.userId),
  ])
  if (!plannen || !prijzen || !contracten || !stand) return 'fout'
  const vandaag = vandaagInAmsterdam(new Date())
  return { perVorm: planWeergaven(plannen, prijzen, contracten, vandaag), vandaag, schaduw: stand.schaduw, incassoAan: stand.incassoAan, alleenKane: !stand.lidgeldAan }
}

export default async function LidmaatschappenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisOnderdeel('lidmaatschappen')
  const ruw = await searchParams
  const tab: Tab = ruw.tab === 'labels' ? 'labels' : 'vormen'
  const vestiging = kiesUit(t.vestigingen, null)
  const [vormen, labels, leden, lidgeld] = await Promise.all([haalVormen(t.admin, t.userId), haalLabels(t.admin, t.userId), haalLidKenmerken(t.admin, t.userId), laadLidgeld(t)])
  const telling = telLeden(leden ?? [])

  return (
    <div className="club-lidm">
      <InstelKruimel id="lidmaatschappen" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Lidmaatschappen en labels</h1>
          {lidgeld === null ? (
            <p>
              De vormen zoals ze in je ledenadministratie heten, met waar en wanneer een lid mag sporten, en de labels die je aan leden hangt. Prijzen,
              contracten en incasso blijven in je ledenadministratie.
            </p>
          ) : (
            <p>
              De vormen met waar en wanneer een lid mag sporten, en per vorm de plannen met prijs en contract. Kortingen en acties stel je in bij{' '}
              <Link href="/club/beheer/lidmaatschappen/kortingen">Kortingen en acties</Link>.
            </p>
          )}
        </div>
        <nav aria-label="Onderdeel">
          <div className="club-segment">
            <Link href="/club/beheer/lidmaatschappen" aria-current={tab === 'vormen' ? 'page' : undefined} scroll={false}>
              Lidmaatschapsvormen
            </Link>
            <Link href="/club/beheer/lidmaatschappen?tab=labels" aria-current={tab === 'labels' ? 'page' : undefined} scroll={false}>
              Labels
            </Link>
          </div>
        </nav>
      </header>

      {lidgeld === 'fout' && <p className="club-melding club-melding--fout" role="status">Prijs en contract konden niet worden gelezen. Probeer het later opnieuw.</p>}
      {!leden && <p className="club-melding club-melding--fout" role="status">De leden konden niet worden geteld, dus de aantallen ontbreken nu.</p>}

      {tab === 'vormen' ? (
        vormen ? (
          <VormenBeheer
            vormen={vormen.map((v) => ({ ...v, leden: ledenMetVorm(telling, v), ledenNaam: telling.naamPerAbonnement.get(vormSleutel(v.naam)) ?? v.naam }))}
            los={leden ? losseAbonnementen(telling, vormen) : []}
            totaalLeden={leden ? telling.leden : null}
            vestiging={vestiging}
            lidgeld={lidgeld === 'fout' ? null : lidgeld}
          />
        ) : (
          <p className="club-melding club-melding--fout" role="status">De lidmaatschapsvormen konden niet worden gelezen. Probeer het later opnieuw.</p>
        )
      ) : labels ? (
        <LabelsBeheer labels={labels.map((l) => ({ ...l, leden: ledenMetLabel(telling, l) }))} los={leden ? losseTags(telling, labels) : []} vestiging={vestiging} />
      ) : (
        <p className="club-melding club-melding--fout" role="status">De labels konden niet worden gelezen. Probeer het later opnieuw.</p>
      )}
    </div>
  )
}
