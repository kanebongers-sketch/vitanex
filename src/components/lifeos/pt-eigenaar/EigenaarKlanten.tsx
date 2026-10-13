import { eigenaarGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { euro, isLopend, type PtKlant } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { ptOverzicht } from '@/lib/lifeos/pt-dashboard/overzicht'
import { KlantKaart } from '@/components/lifeos/pt-dashboard/KlantKaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { FilterRij, filterClubs, gekozenClub, metFilters } from './FilterRij'
import { CLUB_LABEL } from '@/lib/lifeos/pt-dashboard/clubs'
import { TEAM_FOUT } from './teksten'
import { zietDossiers, zietGeld } from '@/lib/lifeos/leads/links'
import { BeheerKlantenLijst } from '@/components/lifeos/pt-beheer/BeheerKlantenLijst'

// /<eigenaar>/klanten — alle PT-klanten van het team met hun abonnement, te
// filteren op PT'er en lopend/alle. Elk dossier is in te zien. Een eigenaar
// kijkt alleen mee; de beheerder (Kane) kan klanten ook toevoegen en bijwerken.

interface Props {
  code: string
  pt: string | null
  toon: string | null
  club: string | null
}

export async function EigenaarKlanten({ code, pt, toon, club: clubRuw }: Props) {
  const g = await eigenaarGegevens(code)
  if (!g) return null
  if (!g.team) return <Foutmelding bericht={TEAM_FOUT} />
  const { team, klanten } = g.team
  const alleenLopend = toon !== 'alle'
  const gekozen = team.find((p) => p.id === pt) ?? null
  const naamVan = new Map(team.map((p) => [p.id, p.naam]))

  const clubs = filterClubs(g.link.clubs, [...klanten.values()].flat().map((k) => k.club))
  const club = gekozenClub(clubRuw, clubs)
  const alle = team
    .filter((p) => !gekozen || p.id === gekozen.id)
    .flatMap((p) => (klanten.get(p.id) ?? []).map((klant) => ({ klant, ptId: p.id })))
    .filter((x) => !club || x.klant.club === club)
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
        <h2 id="eig-klanten-kop">PT-klanten{gekozen ? ` van ${gekozen.naam}` : ' van het team'}{club ? ` · ${CLUB_LABEL[club]}` : ''}</h2>
        <span>{cijfers.lopend} lopend{zietGeld(g.link.rol) ? ` · ${euro(cijfers.maandwaarde)} p/m` : ''}</span>
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
          ...team.map((p) => ({ label: p.naam, href: metFilters(basis, { pt: p.id, toon: toonFilter, club }), actief: gekozen?.id === p.id, aantal: (klanten.get(p.id) ?? []).filter((k) => lopend(k) && (!club || k.club === club)).length })),
        ]}
      />
      <FilterRij
        label="Welke klanten"
        opties={[
          { label: 'Lopend', href: metFilters(basis, { pt: gekozen?.id ?? null, club }), actief: alleenLopend, aantal: alle.filter((x) => lopend(x.klant)).length },
          { label: 'Alle', href: metFilters(basis, { pt: gekozen?.id ?? null, toon: 'alle', club }), actief: !alleenLopend, aantal: alle.length },
        ]}
      />
      {g.link.rol === 'beheerder' ? (
        <BeheerKlantenLijst
          code={code}
          vandaag={g.vandaag}
          items={zichtbaar.map(({ klant, ptId }) => ({ klant, trainerId: ptId }))}
          trainers={team}
          standaardTrainer={gekozen?.id ?? g.team.beheerderId ?? team[0]?.id ?? ''}
          toonTrainer={!gekozen}
        />
      ) : zichtbaar.length === 0 ? (
        <p className="ptd-leeg">Geen klanten in deze selectie.</p>
      ) : (
        <ul className="ptd-lijst">
          {zichtbaar.map(({ klant, ptId }) => (
            <KlantKaart
              key={klant.id}
              klant={klant}
              toonPrijs={zietGeld(g.link.rol)}
              vandaag={g.vandaag}
              trainer={gekozen ? undefined : naamVan.get(ptId)}
              dossierHref={zietDossiers(g.link.rol) ? `/${code}/klanten/${klant.id}` : undefined}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
