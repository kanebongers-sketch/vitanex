import { eigenaarGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { euro, isLopend, type PtKlant } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { ptOverzicht } from '@/lib/lifeos/pt-dashboard/overzicht'
import { KlantKaart } from '@/components/lifeos/pt-dashboard/KlantKaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { FilterRij, metFilters } from './FilterRij'
import { TEAM_FOUT } from './teksten'

// /<eigenaar>/klanten — alle PT-klanten van het team met hun abonnement, te
// filteren op PT'er en lopend/alle. Elk dossier is in te zien. Alleen lezen.

interface Props {
  code: string
  pt: string | null
  toon: string | null
}

export async function EigenaarKlanten({ code, pt, toon }: Props) {
  const g = await eigenaarGegevens(code)
  if (!g) return null
  if (!g.team) return <Foutmelding bericht={TEAM_FOUT} />
  const { team, klanten } = g.team
  const alleenLopend = toon !== 'alle'
  const gekozen = team.find((p) => p.id === pt) ?? null
  const naamVan = new Map(team.map((p) => [p.id, p.naam]))

  const alle = team
    .filter((p) => !gekozen || p.id === gekozen.id)
    .flatMap((p) => (klanten.get(p.id) ?? []).map((klant) => ({ klant, ptId: p.id })))
  const lopend = (k: PtKlant) => isLopend(k, g.vandaag)
  const zichtbaar = alle
    .filter((x) => !alleenLopend || lopend(x.klant))
    .sort((a, b) => Number(lopend(b.klant)) - Number(lopend(a.klant)) || a.klant.naam.localeCompare(b.klant.naam, 'nl'))
  const cijfers = ptOverzicht([], alle.map((x) => x.klant), g.vandaag).klanten
  const basis = `/${code}/klanten`
  const toonFilter = alleenLopend ? null : 'alle'

  return (
    <section className="ptd-sectie" aria-labelledby="eig-klanten-kop">
      <div className="ptd-sectiekop">
        <h2 id="eig-klanten-kop">PT-klanten{gekozen ? ` van ${gekozen.naam}` : ' van het team'}</h2>
        <span>{cijfers.lopend} lopend · {euro(cijfers.maandwaarde)} p/m</span>
      </div>
      <FilterRij
        label="PT'er"
        opties={[
          { label: 'Iedereen', href: metFilters(basis, { toon: toonFilter }), actief: !gekozen },
          ...team.map((p) => ({ label: p.naam, href: metFilters(basis, { pt: p.id, toon: toonFilter }), actief: gekozen?.id === p.id, aantal: (klanten.get(p.id) ?? []).filter(lopend).length })),
        ]}
      />
      <FilterRij
        label="Welke klanten"
        opties={[
          { label: 'Lopend', href: metFilters(basis, { pt: gekozen?.id ?? null }), actief: alleenLopend, aantal: alle.filter((x) => lopend(x.klant)).length },
          { label: 'Alle', href: metFilters(basis, { pt: gekozen?.id ?? null, toon: 'alle' }), actief: !alleenLopend, aantal: alle.length },
        ]}
      />
      {zichtbaar.length === 0 ? (
        <p className="ptd-leeg">Geen klanten in deze selectie.</p>
      ) : (
        <ul className="ptd-lijst">
          {zichtbaar.map(({ klant, ptId }) => (
            <KlantKaart
              key={klant.id}
              klant={klant}
              toonPrijs
              vandaag={g.vandaag}
              trainer={gekozen ? undefined : naamVan.get(ptId)}
              dossierHref={`/${code}/klanten/${klant.id}`}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
