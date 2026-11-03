import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Settings2 } from 'lucide-react'
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
import { kanBewerken } from '@/lib/club/rollen/wie'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { onderdeelAfgenomen } from '@/lib/club/kern/pakketten'
import { OpvolgenTab } from '@/components/club/leads/OpvolgenTab'
import { OPVOLGEN } from '@/lib/aiyourgym/taal/woorden/club/opvolgen'
import type { ClubToegang } from '@/lib/club/toegang'
import '@/components/club/leads/leads.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(LEADS)).pagina.titel }
}

function eerste(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

/** Mag deze persoon de opvolglijst zien (recht en pakket)? */
function zietOpvolgen(t: ClubToegang): boolean {
  return magOnderdeel(t.onderdelen, 'opvolgen') && onderdeelAfgenomen(t.organisatie.afgenomen, 'opvolgen')
}

/** Tabbladen Leads en Opvolgen; Opvolgen alleen voor wie hem mag zien. */
async function LeadsTabs({ vestiging, actief }: { vestiging: string; actief: 'leads' | 'opvolgen' }) {
  const tp = (await clubTekst(LEADS)).pagina
  return (
    <nav className="club-segment club-leads-tabs" aria-label={tp.tabs.label}>
      <Link href={clubPad('/leads', vestiging)} aria-current={actief === 'leads' ? 'page' : undefined}>{tp.tabs.leads}</Link>
      <Link href={clubPad('/leads', vestiging, { tab: 'opvolgen' })} aria-current={actief === 'opvolgen' ? 'page' : undefined}>{tp.tabs.opvolgen}</Link>
    </nav>
  )
}

// Leden · Leads (ontwerp 03-11-2026): tabbladen Leads en Opvolgen. Leads:
// bovenaan wat vandaag moet, daaronder de pijplijn van eerste contact tot lid.
// Opvolgen: de volledige opvolglijst (het oude /club/opvolgen, nu een 308
// hierheen). Tabblad, filters en het open paneel staan in de URL.
export default async function LeadsPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('leads')
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const opvolgen = zietOpvolgen(t)
  if (opvolgen && eerste(zoek.tab) === 'opvolgen') {
    const tp = (await clubTekst(LEADS)).pagina
    const magInstellen = magOnderdeel(t.onderdelen, 'beheer')
    return (
      <>
        <section className="club-paginakop">
          <div>
            <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)}</p>
            <h1>{tp.titel}</h1>
            <p>{tp.introOpvolgen}</p>
          </div>
          {magInstellen && (
            <div className="club-acties">
              <Link href="/club/beheer/automatiseringen" className="club-knop club-knop--stil club-knop--klein">
                <Settings2 size={15} aria-hidden /> {(await clubTekst(OPVOLGEN)).pagina.regels}
              </Link>
            </div>
          )}
        </section>
        <LeadsTabs vestiging={vestiging} actief="opvolgen" />
        <OpvolgenTab t={t} vestiging={vestiging} />
      </>
    )
  }
  const filters = leesFilters(zoek)
  const nu = new Date()
  const tp = (await clubTekst(LEADS)).pagina
  // Alleen zien (rollen v2): geen knop voor een nieuwe lead, in plaats van een fout bij opslaan.
  const bewerken = kanBewerken(t, 'leads')

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
        {bewerken && (
          <div className="club-acties">
            <Link href={clubPad('/leads', vestiging, filterParams(filters, { nieuw: '1' }))} scroll={false} className="club-knop club-knop--primair">
              <Plus size={16} aria-hidden /> {tp.nieuweLead}
            </Link>
          </div>
        )}
      </section>
      {opvolgen && <LeadsTabs vestiging={vestiging} actief="leads" />}

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
        paneel={{ leadId: isUuid(leadId) ? leadId : null, stap: isPaneelStap(stap) ? stap : null, nieuw: bewerken && eerste(zoek.nieuw) === '1' }}
        magWissen={magLeadWissen(t)}
        alleenLezen={!bewerken}
      />
    </>
  )
}
