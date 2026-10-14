import type { Metadata } from 'next'
import Link from 'next/link'
import { eisClubToegang } from '@/lib/club/toegang'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/kern/vestiging'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { alleenActief, haalAfsluitrondes, haalAfvinkingen, haalNotities, haalTaken } from '@/lib/club/taken/opslag'
import { takenHref } from '@/lib/club/taken/url'
import { weekContext } from '@/lib/club/taken/week'
import { dagLang } from '@/lib/club/taken/weergave'
import { AfvinkProvider } from '@/components/club/taken/AfvinkContext'
import { AutoVerversen } from '@/components/club/taken/Hulpjes'
import { PersoonKiezer } from '@/components/club/taken/PersoonKiezer'
import { TakenKop } from '@/components/club/taken/TakenKop'
import { VandaagBord } from '@/components/club/taken/VandaagBord'
import '@/components/club/taken/taken.css'

export const metadata: Metadata = { title: 'Taken' }

// Tabletmodus voor aan de balie: alleen de taken van vandaag, groot, per moment,
// met de afsluitronde als duidelijke checklist.

export default async function TakenVandaagPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const params = await searchParams
  const vestiging = kiesVestiging(params.v)
  const w = weekContext(null, nlDelen(new Date()).datum)
  const [data, afvinkingen, notities, rondes, medewerkers] = await Promise.all([
    haalTaken(t.admin, t.userId, vestiging),
    haalAfvinkingen(t.admin, t.userId, vestiging, w.maandag, w.zondag),
    haalNotities(t.admin, t.userId, vestiging, w.vandaag, w.vandaag),
    haalAfsluitrondes(t.admin, t.userId, vestiging, w.vandaag, w.vandaag),
    haalMedewerkers(t.admin, t.userId, vestiging),
  ])
  const actief = data ? alleenActief(data) : null
  const dag = dagLang(w.vandaag)

  return (
    <div className="club-taken-pagina club-taken-pagina--tablet">
      <AutoVerversen />
      <TakenKop vestiging={vestiging} vestigingNaam={VESTIGING_LABEL[vestiging]} weergave="" titel={`${dag.charAt(0).toUpperCase()}${dag.slice(1)}`} sub="Taken van vandaag. Tik op een taak om af te vinken." />
      {!actief || !afvinkingen || !notities || !rondes ? (
        <p className="club-melding club-melding--fout" role="alert">
          De taken van vandaag konden niet worden geladen. Ververs de pagina om het opnieuw te proberen.
        </p>
      ) : actief.taken.length === 0 ? (
        <div className="club-leeg">
          <p>Er staan nog geen taken klaar voor deze vestiging.</p>
          <Link className="club-knop club-knop--primair" href={takenHref('beheer', vestiging)}>
            Naar het beheer
          </Link>
        </div>
      ) : (
        <AfvinkProvider
          key={`${vestiging}-${w.vandaag}`}
          vestiging={vestiging}
          vandaag={w.vandaag}
          medewerkers={(medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))}
          begin={afvinkingen}
        >
          <PersoonKiezer />
          <VandaagBord lijsten={actief.lijsten} taken={actief.taken} dagen={w.dagen} ronde={rondes[0] ?? null} notities={notities} />
        </AfvinkProvider>
      )}
    </div>
  )
}
