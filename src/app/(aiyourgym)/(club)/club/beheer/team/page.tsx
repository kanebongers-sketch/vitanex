import type { Metadata } from 'next'
import { eisNiveau } from '@/lib/club/toegang'
import { instelKijker } from '@/lib/club/instel-toegang'
import { instelHref, instelPagina, magInstelPagina } from '@/lib/club/kern/instel-paginas'
import { haalTeamMetRollen } from '@/lib/club/rollen/opslag'
import { magRolWijzigen } from '@/lib/club/rollen/escalatie'
import { ROLLEN } from '@/lib/club/rollen/typen'
import { v2Minstens } from '@/lib/club/rollen/wie'
import { TeamBeheer } from '@/components/club/rollen/TeamBeheer'
import { FotoKiezer } from '@/components/club/profielfoto/FotoKiezer'
import { eigenProfielId } from '@/lib/club/profielfoto/toegang'
import { PROFIELFOTO } from '@/lib/aiyourgym/taal/woorden/club/profielfoto'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { instelKop, instelMetadata } from '@/components/club/beheer/instel-metadata'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'
import '@/components/club/beheer/beheer.css'

export async function generateMetadata(): Promise<Metadata> {
  return instelMetadata('team')
}

// Team (rollen v2, besluit Kane 29-10-2026): alleen in het instellingencentrum,
// categorie Team en rechten. Iedereen met zijn rollen; de eigenaar en de
// clubmanager (team beheren) zetten rollen, met de regels van escalatie.ts.

export default async function TeamPagina() {
  const t = await eisNiveau('team', 'zien')
  const [kop, tekst, team, eigenId, fotoTekst] = await Promise.all([
    instelKop('team'), clubTekst(ROLLEN_TEKST), haalTeamMetRollen(t.admin, t.userId), eigenProfielId(t), clubTekst(PROFIELFOTO),
  ])
  // De eigen foto: ook voor een eigenaar of clubmanager zonder werkrol (die staat niet in het personeelsrooster).
  const ik = eigenId ? (team ?? []).find((p) => p.id === eigenId) ?? null : null
  const gever = { platform: t.isPlatformEigenaar, rollen: t.profiel?.rollen ?? [], teamBeheer: v2Minstens(t, 'team', 'beheren') === true }
  const kijker = instelKijker(t)
  const medewerkers = instelPagina('medewerkers')
  const rechten = instelPagina('rechten')
  const vestiging = t.vestigingen[0]?.sleutel ?? null
  return (
    <>
      <InstelKruimel id="team" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{kop.titel}</h1>
          <p>{tekst.team.intro}</p>
        </div>
      </header>
      {ik && (
        <section className="club-kaart club-team-eigen" aria-labelledby="club-team-eigen-kop">
          <h2 id="club-team-eigen-kop">{fotoTekst.eigenKop}</h2>
          <FotoKiezer naam={ik.naam} foto={{ soort: 'mw', id: ik.id, versie: ik.foto ?? null }} adres="/api/club/profielfoto/ik" waar="club" uitleg={fotoTekst.eigenUitleg} />
        </section>
      )}
      {team === null ? (
        <p className="club-melding club-melding--fout" role="alert">{tekst.fouten.lezen}</p>
      ) : (
        <TeamBeheer
          team={team}
          magGeven={ROLLEN.filter((r) => magRolWijzigen(gever, r))}
          aantalVestigingen={t.vestigingen.length}
          nieuwHref={medewerkers && magInstelPagina(medewerkers, kijker) ? instelHref(medewerkers, vestiging) : null}
          rechtenHref={rechten && magInstelPagina(rechten, kijker) ? instelHref(rechten, null) : null}
        />
      )}
    </>
  )
}
