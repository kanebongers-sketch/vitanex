import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad, kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/kern/vestiging'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { haalLeads, haalProeflesLessen } from '@/lib/club/leads/data'
import { berekenCijfers } from '@/lib/club/leads/cijfers'
import { filterParams, isUuid, leesFilters, pasFiltersToe } from '@/lib/club/leads/filters'
import { dagVan, vandaagOpvolgen } from '@/lib/club/leads/regels'
import { isPaneelStap } from '@/lib/club/leads/model'
import { LeadsCijfers } from '@/components/club/leads/LeadsCijfers'
import { LeadsFilters } from '@/components/club/leads/LeadsFilters'
import { LeadsWerkvlak } from '@/components/club/leads/LeadsWerkvlak'
import '@/components/club/leads/leads.css'

export const metadata: Metadata = { title: 'Leads' }

function eerste(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

// Leads en proeflessen: bovenaan wat vandaag moet, daaronder de pijplijn van
// eerste contact tot lid. Filters en het open paneel staan in de URL.
export default async function LeadsPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const zoek = await searchParams
  const vestiging = kiesVestiging(zoek.v)
  const filters = leesFilters(zoek)
  const nu = new Date()

  const [leads, medewerkers, lessen] = await Promise.all([
    haalLeads(t.admin, t.userId, vestiging, nu),
    haalMedewerkers(t.admin, t.userId, vestiging),
    haalProeflesLessen(t.admin, t.userId, vestiging, nu),
  ])

  const leadId = eerste(zoek.lead)
  const stap = eerste(zoek.stap)
  const mw = (medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))
  const alle = leads ?? []
  const zichtbaar = pasFiltersToe(alle, filters, nu)
  // "Vandaag" volgt bron en medewerker, maar niet de periode: oude achterstand blijft zichtbaar.
  const vandaag = vandaagOpvolgen(pasFiltersToe(alle, { ...filters, periode: 'alle' }, nu), nu)

  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{VESTIGING_LABEL[vestiging]}</p>
          <h1>Leads</h1>
          <p>Wie je vandaag belt, wie er komt proefsporten en waar elke lead staat. Van eerste contact tot lid.</p>
        </div>
        <div className="club-acties">
          <Link href={clubPad('/leads', vestiging, filterParams(filters, { nieuw: '1' }))} scroll={false} className="club-knop club-knop--primair">
            <Plus size={16} aria-hidden /> Nieuwe lead
          </Link>
        </div>
      </section>

      {leads === null && <p className="club-melding club-melding--fout">De leads konden niet worden geladen. Ververs de pagina of probeer het later opnieuw.</p>}
      {lessen === null && <p className="club-melding">Het rooster kon niet worden geladen; een proefles kan nu alleen op een vrij tijdstip.</p>}

      <LeadsCijfers cijfers={berekenCijfers(alle, nu)} />
      <LeadsFilters vestiging={vestiging} filters={filters} medewerkers={mw} />
      <LeadsWerkvlak
        vestiging={vestiging}
        leads={zichtbaar}
        vandaag={vandaag}
        medewerkers={mw}
        lessen={lessen ?? []}
        weergave={filters.weergave}
        zoek={filterParams(filters)}
        vandaagDag={dagVan(nu)}
        nuIso={nu.toISOString()}
        paneel={{ leadId: isUuid(leadId) ? leadId : null, stap: isPaneelStap(stap) ? stap : null, nieuw: eerste(zoek.nieuw) === '1' }}
      />
    </>
  )
}
