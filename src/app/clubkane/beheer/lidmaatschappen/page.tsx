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

export const metadata: Metadata = { title: 'Lidmaatschappen en labels' }

// Lidmaatschapsvormen (zoals ze in Sportivity heten, met toegangsregels) en de
// labels boven de tags van leden. Geen prijzen of contracten: geld blijft in
// Sportivity. Tabblad in de URL (?tab=labels).

type Tab = 'vormen' | 'labels'

export default async function LidmaatschappenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisOnderdeel('lidmaatschappen')
  const ruw = await searchParams
  const tab: Tab = ruw.tab === 'labels' ? 'labels' : 'vormen'
  const vestiging = kiesUit(t.vestigingen, null)
  const [vormen, labels, leden] = await Promise.all([haalVormen(t.admin, t.userId), haalLabels(t.admin, t.userId), haalLidKenmerken(t.admin, t.userId)])
  const telling = telLeden(leden ?? [])

  return (
    <div className="club-lidm">
      <InstelKruimel id="lidmaatschappen" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Lidmaatschappen en labels</h1>
          <p>
            De vormen zoals ze in Sportivity heten, met waar en wanneer een lid mag sporten, en de labels die je aan leden hangt. Prijzen,
            contracten en incasso blijven in Sportivity.
          </p>
        </div>
        <nav aria-label="Onderdeel">
          <div className="club-segment">
            <Link href="/clubkane/beheer/lidmaatschappen" aria-current={tab === 'vormen' ? 'page' : undefined} scroll={false}>
              Lidmaatschapsvormen
            </Link>
            <Link href="/clubkane/beheer/lidmaatschappen?tab=labels" aria-current={tab === 'labels' ? 'page' : undefined} scroll={false}>
              Labels
            </Link>
          </div>
        </nav>
      </header>

      {!leden && <p className="club-melding club-melding--fout" role="status">De leden konden niet worden geteld, dus de aantallen ontbreken nu.</p>}

      {tab === 'vormen' ? (
        vormen ? (
          <VormenBeheer
            vormen={vormen.map((v) => ({ ...v, leden: ledenMetVorm(telling, v), ledenNaam: telling.naamPerAbonnement.get(vormSleutel(v.naam)) ?? v.naam }))}
            los={leden ? losseAbonnementen(telling, vormen) : []}
            totaalLeden={leden ? telling.leden : null}
            vestiging={vestiging}
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
