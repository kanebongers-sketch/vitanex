import { eigenaarGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { OPEN_STATUSSEN, moetOpvolgen, type Lead } from '@/lib/lifeos/leads/leads'
import { LeadKaart } from '@/components/lifeos/pt-dashboard/LeadKaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { FilterRij, metFilters } from './FilterRij'
import { TEAM_FOUT } from './teksten'

// /<eigenaar>/lead — alle leads van het hele team, nieuwste eerst, te filteren
// op PT'er en stand (filters in de URL). Alleen lezen.

const WEERGAVEN = ['open', 'te_laat', 'klant', 'alle'] as const
type Weergave = (typeof WEERGAVEN)[number]
const WEERGAVE_LABEL: Record<Weergave, string> = { open: 'Open', te_laat: 'Te laat', klant: 'Klant geworden', alle: 'Alle' }

function past(l: Lead, w: Weergave, vandaag: string): boolean {
  if (w === 'open') return OPEN_STATUSSEN.includes(l.status)
  if (w === 'te_laat') return moetOpvolgen(l, vandaag) && l.opvolgdatum !== vandaag
  if (w === 'klant') return l.status === 'klant'
  return true
}

interface Props {
  code: string
  pt: string | null
  toon: string | null
}

export async function EigenaarLeads({ code, pt, toon }: Props) {
  const g = await eigenaarGegevens(code)
  if (!g) return null
  if (!g.team) return <Foutmelding bericht={TEAM_FOUT} />
  const { team, leads } = g.team
  const weergave: Weergave = WEERGAVEN.find((w) => w === toon) ?? 'open'
  const gekozen = team.find((p) => p.id === pt) ?? null
  const naamVan = new Map(team.map((p) => [p.id, p.naam]))

  const alle = team
    .filter((p) => !gekozen || p.id === gekozen.id)
    .flatMap((p) => (leads.get(p.id) ?? []).map((lead) => ({ lead, ptId: p.id })))
  const zichtbaar = alle
    .filter((x) => past(x.lead, weergave, g.vandaag))
    .sort((a, b) => b.lead.gesprokenOp.localeCompare(a.lead.gesprokenOp) || a.lead.naam.localeCompare(b.lead.naam, 'nl'))
  const basis = `/${code}/lead`
  const toonFilter = weergave === 'open' ? null : weergave

  return (
    <section className="ptd-sectie" aria-labelledby="eig-leads-kop">
      <div className="ptd-sectiekop">
        <h2 id="eig-leads-kop">Leads{gekozen ? ` van ${gekozen.naam}` : ' van het team'}</h2>
        <span>{zichtbaar.length} {zichtbaar.length === 1 ? 'lead' : 'leads'}</span>
      </div>
      <FilterRij
        label="PT'er"
        opties={[
          { label: 'Iedereen', href: metFilters(basis, { toon: toonFilter }), actief: !gekozen },
          ...team.map((p) => ({ label: p.naam, href: metFilters(basis, { pt: p.id, toon: toonFilter }), actief: gekozen?.id === p.id, aantal: (leads.get(p.id) ?? []).length })),
        ]}
      />
      <FilterRij
        label="Stand"
        opties={WEERGAVEN.map((w) => ({
          label: WEERGAVE_LABEL[w],
          href: metFilters(basis, { pt: gekozen?.id ?? null, toon: w === 'open' ? null : w }),
          actief: w === weergave,
          aantal: alle.filter((x) => past(x.lead, w, g.vandaag)).length,
        }))}
      />
      {zichtbaar.length === 0 ? (
        <p className="ptd-leeg">Geen leads in deze selectie.</p>
      ) : (
        <ul className="ptd-lijst">
          {zichtbaar.map(({ lead, ptId }) => (
            <LeadKaart key={lead.id} lead={lead} vandaag={g.vandaag} trainer={gekozen ? undefined : naamVan.get(ptId)} />
          ))}
        </ul>
      )}
    </section>
  )
}
