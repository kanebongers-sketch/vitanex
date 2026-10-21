import { notFound, redirect } from 'next/navigation'
import type { ClubToegang } from '@/lib/club/toegang'
import { eisOnderdeel } from '@/lib/club/toegang'
import type { Vestiging, ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { haalInstellingen, type Instellingen } from '@/lib/club/instellingen/opslag'
import { zichtbareMedewerkers } from '@/lib/club/kern/medewerker-vestigingen'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { haalMedewerkerLogins } from '@/lib/club/medewerker-login/opslag'
import { magMedewerkerLoginsBeheren } from '@/lib/club/medewerker-login/rechten'
import { magMedewerkerWissen } from '@/lib/club/personeel/avg'
import { haalGewisteMedewerkers } from '@/lib/club/personeel/avg-opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { adresVan } from '@/lib/club/kern/subdomein'
import { instelPagina } from '@/lib/club/kern/instel-paginas'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { RegelsFormulier } from './RegelsFormulier'
import { ZalenBeheer } from './ZalenBeheer'
import { LestypenBeheer } from './LestypenBeheer'
import { WeekroosterBeheer } from './WeekroosterBeheer'
import { MedewerkersBeheer, type LoginBeheer } from './MedewerkersBeheer'
import { VestigingenBeheer, type VestigingContact } from './VestigingenBeheer'
import '@/components/club/rooster/rooster.css'
import './instellingen.css'

// De instel-pagina's onder /clubkane/instellingen/<onderdeel>. Vroeger tabbladen
// op een pagina Instellingen, nu elk een eigen plek in het instellingencentrum
// (besluit Kane 18-10-2026: elk ding een naam en een plek). Oude links met
// ?tab= sturen door (src/app/(hoofd)/clubkane/instellingen/page.tsx).

export const INSTELLINGEN_ONDERDELEN = ['regels', 'zalen', 'lestypen', 'weekrooster', 'medewerkers', 'vestigingen'] as const
export type InstellingenOnderdeelSleutel = (typeof INSTELLINGEN_ONDERDELEN)[number]

type MetVestiging = Exclude<InstellingenOnderdeelSleutel, 'vestigingen'>

/** Inloglinks van medewerkers: alleen voor Kane, de eigenaar en de clubmanager. */
async function haalLoginBeheer(t: ClubToegang): Promise<LoginBeheer | null> {
  if (!magMedewerkerLoginsBeheren(t)) return null
  const subdomeinen = process.env.CLUB_SUBDOMEINEN_ACTIEF === '1'
  return {
    logins: await haalMedewerkerLogins(t.admin, t.userId),
    linkBasis: subdomeinen && t.organisatie.slug ? `https://${adresVan(t.organisatie.slug)}` : null,
    loginAan: CLUB_EIGEN_LOGIN,
  }
}

/** Adres, telefoon en e-mail van de vestigingen van deze sportschool. */
async function haalContact(t: ClubToegang): Promise<VestigingContact> {
  const { data, error } = await t.admin.from('club_vestigingen').select('vestiging, adres, telefoon, email').eq('user_id', t.userId)
  if (error) console.error('[club] contact vestigingen lezen mislukt', error.message)
  const tekst = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null)
  return Object.fromEntries((data ?? []).map((r) => [String(r.vestiging), { adres: tekst(r.adres), telefoon: tekst(r.telefoon), email: tekst(r.email) }]))
}

interface InhoudProps {
  onderdeel: MetVestiging
  data: Instellingen
  vestiging: Vestiging
  t: ClubToegang
}

async function Inhoud({ onderdeel, data, vestiging, t }: InhoudProps) {
  const optie = (m: { id: string; naam: string }) => ({ id: m.id, naam: m.naam })
  switch (onderdeel) {
    case 'regels':
      return <RegelsFormulier key={vestiging} vestiging={vestiging} regels={data.regels} openingstijden={data.openingstijden} />
    case 'zalen':
      return <ZalenBeheer zalen={data.zalen} vestiging={vestiging} />
    case 'lestypen':
      return <LestypenBeheer lestypen={data.lestypen} vestiging={vestiging} />
    case 'weekrooster':
      return (
        <WeekroosterBeheer
          series={data.series}
          lestypen={data.lestypen}
          zalen={data.zalen}
          instructeurs={data.medewerkers.filter((m) => m.actief && m.rollen.includes('instructeur') && m.vestigingen.includes(vestiging)).map(optie)}
          medewerkers={data.medewerkers.map(optie)}
          vestiging={vestiging}
          vandaag={nlDelen(new Date()).datum}
        />
      )
    case 'medewerkers':
      return (
        <MedewerkersBeheer
          medewerkers={zichtbareMedewerkers(t, data.medewerkers)}
          vestiging={vestiging}
          login={await haalLoginBeheer(t)}
          ikZelf={t.rol === 'medewerker' ? t.persoonId : null}
          privacy={{ magWissen: magMedewerkerWissen(t), gewist: await haalGewisteMedewerkers(t.admin, t.userId) }}
        />
      )
  }
}

function Kop({ onderdeel, boven }: { onderdeel: InstellingenOnderdeelSleutel; boven: string }) {
  const pagina = instelPagina(onderdeel)
  return (
    <header className="club-paginakop">
      <div>
        <p className="club-boventitel">{boven}</p>
        <h1>{pagina?.titel ?? 'Instellingen'}</h1>
        <p>{pagina?.uitleg}</p>
      </div>
    </header>
  )
}

interface InstellingenOnderdeelProps {
  onderdeel: InstellingenOnderdeelSleutel
  zoek: Awaited<ZoekParams>
}

export async function InstellingenOnderdeel({ onderdeel, zoek }: InstellingenOnderdeelProps) {
  const t = await eisOnderdeel('instellingen')
  // Vestigingen beheren is sportschoolbreed: niet voor een medewerker (de API is voor hem ook dicht).
  const metVestigingen = t.rol !== 'medewerker'
  const vestiging = kiesUit(t.vestigingen, zoek.v)

  if (onderdeel === 'vestigingen') {
    if (!metVestigingen) notFound()
    return (
      <>
        <InstelKruimel id="vestigingen" vestiging={vestiging} />
        <Kop onderdeel="vestigingen" boven={t.organisatie.naam} />
        <VestigingenBeheer vestigingen={t.vestigingen} contact={await haalContact(t)} />
      </>
    )
  }
  // Zonder vestigingen kan alleen Vestigingen: daar voeg je de eerste toe.
  if (!vestiging) {
    if (metVestigingen) redirect('/clubkane/instellingen/vestigingen')
    return <GeenVestigingen />
  }
  const data = await haalInstellingen(t.admin, t.userId, vestiging)
  return (
    <>
      <InstelKruimel id={onderdeel} vestiging={vestiging} />
      <Kop onderdeel={onderdeel} boven={naamVan(t.vestigingen, vestiging)} />
      {data ? (
        <Inhoud onderdeel={onderdeel} data={data} vestiging={vestiging} t={t} />
      ) : (
        <p className="club-melding club-melding--fout" role="alert">De instellingen konden niet worden geladen. Ververs de pagina om het opnieuw te proberen.</p>
      )}
    </>
  )
}
