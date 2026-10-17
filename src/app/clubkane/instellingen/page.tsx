import type { Metadata } from 'next'
import Link from 'next/link'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad, type Vestiging, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { haalInstellingen, type Instellingen } from '@/lib/club/instellingen/opslag'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { RegelsFormulier } from '@/components/club/instellingen/RegelsFormulier'
import { ZalenBeheer } from '@/components/club/instellingen/ZalenBeheer'
import { LestypenBeheer } from '@/components/club/instellingen/LestypenBeheer'
import { WeekroosterBeheer } from '@/components/club/instellingen/WeekroosterBeheer'
import { MedewerkersBeheer } from '@/components/club/instellingen/MedewerkersBeheer'
import { VestigingenBeheer, type VestigingContact } from '@/components/club/instellingen/VestigingenBeheer'
import '@/components/club/rooster/rooster.css'
import '@/components/club/instellingen/instellingen.css'

export const metadata: Metadata = { title: 'Instellingen' }

const TABS = [
  { sleutel: 'regels', label: 'Regels', uitleg: 'Wanneer boeken, annuleren en no-shows, en de openingstijden.' },
  { sleutel: 'zalen', label: 'Zalen', uitleg: 'De ruimtes voor groepslessen en hoeveel mensen erin passen.' },
  { sleutel: 'lestypen', label: 'Lestypen', uitleg: 'De lessen die je kunt geven, voor alle vestigingen.' },
  { sleutel: 'weekrooster', label: 'Weekrooster', uitleg: 'De vaste lessen per week. Daaruit maak je de echte lessen aan.' },
  { sleutel: 'medewerkers', label: 'Medewerkers', uitleg: 'Wie er werkt, in welke rol en op welke vestiging.' },
  { sleutel: 'vestigingen', label: 'Vestigingen', uitleg: 'De vestigingen van je sportschool: toevoegen, naam, volgorde en welke standaard open gaat.' },
] as const

type Tab = (typeof TABS)[number]['sleutel']

function kiesTab(ruw: string | string[] | undefined): Tab {
  const w = Array.isArray(ruw) ? ruw[0] : ruw
  return TABS.find((t) => t.sleutel === w)?.sleutel ?? 'regels'
}

function TabInhoud({ tab, data, vestiging }: { tab: Exclude<Tab, 'vestigingen'>; data: Instellingen; vestiging: Vestiging }) {
  const optie = (m: { id: string; naam: string }) => ({ id: m.id, naam: m.naam })
  switch (tab) {
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
      return <MedewerkersBeheer medewerkers={data.medewerkers} vestiging={vestiging} />
  }
}

export default async function InstellingenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const params = await searchParams
  const vestiging = kiesUit(t.vestigingen, params.v)
  // Zonder vestigingen kan alleen het tabblad Vestigingen: daar voeg je de eerste toe.
  const tab = vestiging ? kiesTab(params.tab) : 'vestigingen'
  const huidig = TABS.find((x) => x.sleutel === tab)
  if (tab === 'vestigingen' || !vestiging) {
    return (
      <>
        <InstellingenKop boven={vestiging ? naamVan(t.vestigingen, vestiging) : t.organisatie.naam} uitleg={huidig?.uitleg} />
        {vestiging && <Tabs vestiging={vestiging} tab={tab} />}
        <VestigingenBeheer vestigingen={t.vestigingen} contact={await haalContact(t)} />
      </>
    )
  }
  const data = await haalInstellingen(t.admin, t.userId, vestiging)

  return (
    <>
      <InstellingenKop boven={naamVan(t.vestigingen, vestiging)} uitleg={huidig?.uitleg} />
      <Tabs vestiging={vestiging} tab={tab} />
      {data ? (
        <TabInhoud tab={tab} data={data} vestiging={vestiging} />
      ) : (
        <p className="club-melding club-melding--fout" role="alert">De instellingen konden niet worden geladen. Ververs de pagina om het opnieuw te proberen.</p>
      )}
    </>
  )
}

function InstellingenKop({ boven, uitleg }: { boven: string; uitleg: string | undefined }) {
  return (
    <header className="club-paginakop">
      <div>
        <p className="club-boventitel">{boven}</p>
        <h1>Instellingen</h1>
        <p>{uitleg}</p>
      </div>
    </header>
  )
}

function Tabs({ vestiging, tab }: { vestiging: Vestiging; tab: Tab }) {
  return (
    <nav className="club-segment club-instellingen-tabs" aria-label="Onderdelen van de instellingen">
      {TABS.map((x) => (
        <Link key={x.sleutel} href={clubPad('/instellingen', vestiging, { tab: x.sleutel })} aria-current={x.sleutel === tab ? 'page' : undefined} scroll={false}>
          {x.label}
        </Link>
      ))}
    </nav>
  )
}

/** Adres, telefoon en e-mail van de vestigingen van deze sportschool. */
async function haalContact(t: Awaited<ReturnType<typeof eisClubToegang>>): Promise<VestigingContact> {
  const { data, error } = await t.admin.from('club_vestigingen').select('vestiging, adres, telefoon, email').eq('user_id', t.userId)
  if (error) console.error('[club] contact vestigingen lezen mislukt', error.message)
  const tekst = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null)
  return Object.fromEntries((data ?? []).map((r) => [String(r.vestiging), { adres: tekst(r.adres), telefoon: tekst(r.telefoon), email: tekst(r.email) }]))
}
