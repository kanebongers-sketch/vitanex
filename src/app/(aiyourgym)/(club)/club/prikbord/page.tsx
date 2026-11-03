import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { haalKladblok } from '@/lib/club/kladblok/data'
import { haalGelezen, haalMededelingen, haalTakenlijsten, haalTeam, haalUitvoeringen, haalWerkwijzen, werkwijzeVanNotitie } from '@/lib/club/prikbord/opslag'
import { kijkerVan, magBeheren, magPlaatsen } from '@/lib/club/prikbord/toegang'
import { prikbordWeergave } from '@/lib/club/prikbord/weergave'
import { Prikbord } from '@/components/club/prikbord/Prikbord'
import '@/components/club/prikbord/prikbord.css'
import '@/components/club/kladblok/kladblok.css'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(PRIKBORD)).pagina.titel }
}

// Het Prikbord (Vandaag · Prikbord): mededelingen aan het team, werkwijzen
// stap voor stap en de notities. Wie mag plaatsen ziet alles met "x van y
// bevestigd"; de rest ziet wat voor hem is. Verplichte mededelingen
// blokkeren niemand, ze staan alleen bovenaan Vandaag (PrikbordRegel).
export default async function PrikbordPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  const kijker = kijkerVan(t)
  const leiding = magPlaatsen(t)
  const metNotities = magOnderdeel(t.onderdelen, 'notities') && vestiging !== null
  const tekst = (await clubTekst(PRIKBORD)).pagina

  const [mededelingen, werkwijzen, team, uitvoeringen, takenlijsten, notities] = await Promise.all([
    haalMededelingen(t.admin, t.userId),
    haalWerkwijzen(t.admin, t.userId),
    haalTeam(t.admin, t.userId),
    leiding ? haalUitvoeringen(t.admin, t.userId) : Promise.resolve([]),
    magBeheren(t) ? haalTakenlijsten(t.admin, t.userId) : Promise.resolve([]),
    metNotities && vestiging ? haalKladblok(t.admin, t.userId, vestiging) : Promise.resolve(null),
  ])
  // De leiding ziet wie wat las; de rest alleen de eigen regels (zonder profiel: geen).
  const eigen = leiding ? undefined : kijker.profielId
  const gelezen = !mededelingen ? null : eigen === null ? [] : await haalGelezen(t.admin, t.userId, mededelingen.map((m) => m.id), eigen)
  const fout = !mededelingen || !werkwijzen || !team || !uitvoeringen || !gelezen
  const weergave = fout
    ? null
    : prikbordWeergave({ kijker, leiding, mededelingen, gelezen, werkwijzen, team, uitvoeringen, nu: new Date() })

  return (
    <>
      <section className="club-paginakop">
        <div>
          <h1>{tekst.titel}</h1>
          <p>{tekst.intro}</p>
        </div>
      </section>
      {fout ? (
        <p className="club-melding club-melding--fout" role="alert">
          {tekst.fout}
        </p>
      ) : null}
      <Prikbord
        weergave={weergave}
        vestigingen={t.vestigingen}
        vestiging={vestiging}
        magPlaatsen={leiding}
        magBeheren={magBeheren(t)}
        kanBevestigen={kijker.profielId !== null}
        takenlijsten={takenlijsten}
        notities={metNotities ? notities : undefined}
        werkwijzeVanNotitie={werkwijzen ? werkwijzeVanNotitie(werkwijzen) : {}}
        startWerkwijze={typeof zoek.w === 'string' ? zoek.w : null}
      />
    </>
  )
}
