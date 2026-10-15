import { eigenaarGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { OPEN_STATUSSEN, moetOpvolgen, vergelijkLeads, type Lead } from '@/lib/lifeos/leads/leads'
import { LeadKaart } from '@/components/lifeos/pt-dashboard/LeadKaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { FilterRij, filterClubs, gekozenClub, metFilters } from './FilterRij'
import { CLUB_LABEL } from '@/lib/lifeos/pt-dashboard/clubs'
import { TEAM_FOUT } from './teksten'
import { BeheerLeadsLijst } from '@/components/lifeos/pt-beheer/BeheerLeadsLijst'

// /<eigenaar>/lead — alle leads van het hele team, nieuwste eerst, te filteren
// op PT'er en stand (filters in de URL). Een eigenaar kijkt mee; de beheerder
// kan leads ook invullen, bijwerken en verplaatsen.

const WEERGAVEN = ['open', 'te_laat', 'klant', 'geen_klant', 'alle'] as const
type Weergave = (typeof WEERGAVEN)[number]
const WEERGAVE_LABEL: Record<Weergave, string> = { open: 'Open', te_laat: 'Te laat', klant: 'Klant geworden', geen_klant: 'Geen klant geworden', alle: 'Alle' }

function past(l: Lead, w: Weergave, vandaag: string): boolean {
  if (w === 'open') return OPEN_STATUSSEN.includes(l.status)
  if (w === 'te_laat') return moetOpvolgen(l, vandaag) && l.opvolgdatum !== vandaag
  if (w === 'klant') return l.status === 'klant'
  if (w === 'geen_klant') return l.status === 'geen_klant'
  return true
}

interface Props {
  code: string
  pt: string | null
  toon: string | null
  club: string | null
}

export async function EigenaarLeads({ code, pt, toon, club: clubRuw }: Props) {
  const g = await eigenaarGegevens(code)
  if (!g) return null
  if (!g.team) return <Foutmelding bericht={TEAM_FOUT} />
  const { team, leads } = g.team
  const weergave: Weergave = WEERGAVEN.find((w) => w === toon) ?? 'open'
  const gekozen = team.find((p) => p.id === pt) ?? null
  const naamVan = new Map(team.map((p) => [p.id, p.naam]))

  const clubs = filterClubs(g.link.clubs, [...leads.values()].flat().map((l) => l.club))
  const club = gekozenClub(clubRuw, clubs)
  const alle = team
    .filter((p) => !gekozen || p.id === gekozen.id)
    .flatMap((p) => (leads.get(p.id) ?? []).map((lead) => ({ lead, ptId: p.id })))
    .filter((x) => !club || x.lead.club === club)
  const volgorde = vergelijkLeads(g.vandaag)
  const zichtbaar = alle
    .filter((x) => past(x.lead, weergave, g.vandaag))
    .sort((a, b) => volgorde(a.lead, b.lead))
  const basis = `/${code}/lead`
  const toonFilter = weergave === 'open' ? null : weergave

  return (
    <section className="ptd-sectie" aria-labelledby="eig-leads-kop">
      <div className="ptd-sectiekop">
        <h2 id="eig-leads-kop">Leads{gekozen ? ` van ${gekozen.naam}` : ' van het team'}{club ? ` · ${CLUB_LABEL[club]}` : ''}</h2>
        <span>{zichtbaar.length} {zichtbaar.length === 1 ? 'lead' : 'leads'}</span>
      </div>
      {clubs.length > 0 ? (
        <FilterRij
          label="Club"
          opties={[
            { label: 'Alle clubs', href: metFilters(basis, { pt: gekozen?.id ?? null, toon: toonFilter }), actief: !club },
            ...clubs.map((c) => ({ label: CLUB_LABEL[c], href: metFilters(basis, { pt: gekozen?.id ?? null, toon: toonFilter, club: c }), actief: club === c })),
          ]}
        />
      ) : null}
      <FilterRij
        label="PT'er"
        opties={[
          { label: 'Iedereen', href: metFilters(basis, { toon: toonFilter, club }), actief: !gekozen },
          ...team.map((p) => ({ label: p.naam, href: metFilters(basis, { pt: p.id, toon: toonFilter, club }), actief: gekozen?.id === p.id, aantal: (leads.get(p.id) ?? []).filter((l) => !club || l.club === club).length })),
        ]}
      />
      <FilterRij
        label="Stand"
        opties={WEERGAVEN.map((w) => ({
          label: WEERGAVE_LABEL[w],
          href: metFilters(basis, { pt: gekozen?.id ?? null, toon: w === 'open' ? null : w, club }),
          actief: w === weergave,
          aantal: alle.filter((x) => past(x.lead, w, g.vandaag)).length,
        }))}
      />
      {g.link.rol === 'beheerder' ? (
        <BeheerLeadsLijst
          code={code}
          vandaag={g.vandaag}
          items={zichtbaar.map(({ lead, ptId }) => ({ lead, trainerId: ptId }))}
          trainers={team}
          standaardTrainer={gekozen?.id ?? g.team.beheerderId ?? team[0]?.id ?? ''}
          toonTrainer={!gekozen}
        />
      ) : zichtbaar.length === 0 ? (
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
