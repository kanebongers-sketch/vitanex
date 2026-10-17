import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad } from '@/lib/club/kern/vestiging'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { haalVoortgang } from '@/lib/club/voortgang/data'
import { haalEigenLid, haalPlan, haalSjablonen } from '@/lib/club/voeding/lezen'
import { startVelden } from '@/lib/club/voeding/startwaarden'
import { PlanEditor } from '@/components/club/voeding/PlanEditor'
import '@/components/club/voeding/voeding.css'

export const metadata: Metadata = { title: 'Voedingsplan' }

// Het voedingsplan van een lid maken of bewerken. Alleen voor een lid van deze
// sportschool in een van haar eigen vestigingen; anders een gewone 404.

export default async function VoedingLidPagina({ params }: { params: Promise<{ id: string }> }) {
  const t = await eisClubToegang()
  const { id } = await params
  const lid = await haalEigenLid(t.admin, t.userId, t.vestigingen, id)
  if (!lid) notFound()
  const nu = new Date()
  const [plan, sjablonen, voortgang] = await Promise.all([haalPlan(t.admin, t.userId, lid.id), haalSjablonen(t.admin, t.userId), haalVoortgang(t.admin, t.userId, lid.id, nu)])
  const naam = volledigeNaam(lid)

  return (
    <>
      <section className="club-paginakop">
        <div>
          <Link href={clubPad(`/leden/${lid.id}`, lid.vestiging)} className="club-terug">
            <ArrowLeft size={15} aria-hidden /> {naam}
          </Link>
          <p className="club-boventitel">{naamVan(t.vestigingen, lid.vestiging)} · voeding</p>
          <h1>{plan ? 'Voedingsplan' : 'Nieuw voedingsplan'}</h1>
          <p>Zet een dagdoel neer met de rekenhulp of een sjabloon, voeg adviezen en een voorbeelddag toe. Het lid ziet het plan in de ledenapp, zonder je notitie.</p>
        </div>
      </section>
      {plan === null && <p className="club-melding club-melding--fout" role="alert">Het bestaande plan kon niet worden geladen. Opslaan zou het overschrijven: ververs eerst de pagina.</p>}
      {sjablonen === null && <p className="club-melding club-melding--fout" role="status">De sjablonen konden niet worden geladen.</p>}
      {plan !== null && (
        <PlanEditor
          lidId={lid.id}
          lidNaam={lid.voornaam}
          plan={plan}
          sjablonen={sjablonen ?? []}
          beginVelden={startVelden(plan, lid, voortgang.punten, nlDelen(nu).datum)}
          terugHref={clubPad(`/leden/${lid.id}`, lid.vestiging)}
          sjablonenHref={clubPad('/voeding', lid.vestiging, { tab: 'sjablonen' })}
        />
      )}
    </>
  )
}
