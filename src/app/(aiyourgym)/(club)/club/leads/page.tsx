import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { haalLeads, haalProeflesLessen } from '@/lib/club/leads/data'
import { berekenCijfers } from '@/lib/club/leads/cijfers'
import { filterParams, isUuid, leesFilters, pasFiltersToe } from '@/lib/club/leads/filters'
import { dagVan, vandaagOpvolgen } from '@/lib/club/leads/regels'
import { isPaneelStap } from '@/lib/club/leads/model'
import { magLeadWissen } from '@/lib/club/leads/avg'
import { LeadsCijfers } from '@/components/club/leads/LeadsCijfers'
import { LeadsFilters } from '@/components/club/leads/LeadsFilters'
import { LeadsWerkvlak } from '@/components/club/leads/LeadsWerkvlak'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
import '@/components/club/leads/leads.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(LEADS)).pagina.titel }
}

function eerste(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

// Leads en proeflessen: bovenaan wat vandaag moet, daaronder de pijplijn van
// eerste contact tot lid. Filters en het open paneel staan in de URL.
export default async function LeadsPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('leads')
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const filters = leesFilters(zoek)
  const nu = new Date()
  const tp = (await clubTekst(LEADS)).pagina

  const [leads, medewerkers, lessen] = await Promise.all([
    haalLeads(t.admin, t.userId, vestiging, nu),
    haalMedewerkers(t.admin, t.userId, vestiging),
    haalProeflesLessen(t.admin, t.userId, vestiging, nu),
  ])

  const leadId = eerste(zoek.lead)
  const stap = eerste(zoek.stap)
  const mw = (medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))
  const alle = leads ?? []
  // Gewiste leads (AVG) tellen anoniem mee in de cijfers, maar staan niet meer in de pijplijn of op Vandaag.
  const werklijst = alle.filter((l) => !l.geanonimiseerdOp)
  const zichtbaar = pasFiltersToe(werklijst, filters, nu)
  // "Vandaag" volgt bron en medewerker, maar niet de periode: oude achterstand blijft zichtbaar.
  const vandaag = vandaagOpvolgen(pasFiltersToe(werklijst, { ...filters, periode: 'alle' }, nu), nu)

  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)}</p>
          <h1>{tp.titel}</h1>
          <p>{tp.intro}</p>
        </div>
        <div className="club-acties">
          <Link href={clubPad('/leads', vestiging, filterParams(filters, { nieuw: '1' }))} scroll={false} className="club-knop club-knop--primair">
            <Plus size={16} aria-hidden /> {tp.nieuweLead}
          </Link>
        </div>
      </section>

      {leads === null && <p className="club-melding club-melding--fout">{tp.laadFout}</p>}
      {lessen === null && <p className="club-melding">{tp.roosterFout}</p>}

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
        magWissen={magLeadWissen(t)}
      />
    </>
  )
}
