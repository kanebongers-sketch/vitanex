import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { haalBedrijf, haalVestigingContact } from '@/lib/club/bedrijf/opslag'
import { GegevensFormulier } from '@/components/club/bedrijf/GegevensFormulier'
import { TekstenEditor } from '@/components/club/bedrijf/TekstenEditor'
import { VestigingenContact } from '@/components/club/bedrijf/VestigingenContact'
import '@/components/club/bedrijf/bedrijf.css'

export const metadata: Metadata = { title: 'Bedrijfsgegevens en huisregels' }

// Bedrijfsgegevens (KvK, btw, hoofdkantoor, contact, social) en de teksten voor
// leden (huisregels, voorwaarden, privacy). Het tabblad staat in de URL.

const TABS = [
  { sleutel: 'gegevens', label: 'Gegevens' },
  { sleutel: 'teksten', label: 'Teksten' },
] as const

type Tab = (typeof TABS)[number]['sleutel']

function kiesTab(ruw: string | string[] | undefined): Tab {
  const w = Array.isArray(ruw) ? ruw[0] : ruw
  return TABS.find((t) => t.sleutel === w)?.sleutel ?? 'gegevens'
}

export default async function BedrijfPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const tab = kiesTab((await searchParams).tab)
  const v = kiesUit(t.vestigingen, null)
  const naarVestigingen = v ? clubPad('/instellingen', v, { tab: 'vestigingen' }) : '/clubkane/instellingen?tab=vestigingen'
  const [bedrijf, vestigingen] = await Promise.all([
    haalBedrijf(t.admin, t.userId),
    tab === 'gegevens' ? haalVestigingContact(t.admin, t.userId) : Promise.resolve(null),
  ])

  return (
    <>
      <Link href="/clubkane/beheer" className="club-terug">
        <ArrowLeft size={16} aria-hidden /> Instellingencentrum
      </Link>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Bedrijf en huisregels</h1>
          <p>De officiele gegevens van je sportschool en de teksten die je leden in de app lezen.</p>
        </div>
      </header>

      <nav className="club-segment club-bedrijf-tabs" aria-label="Onderdelen">
        {TABS.map((x) => (
          <Link key={x.sleutel} href={`/clubkane/beheer/bedrijf?tab=${x.sleutel}`} aria-current={x.sleutel === tab ? 'page' : undefined} scroll={false}>
            {x.label}
          </Link>
        ))}
      </nav>

      {!bedrijf ? (
        <p className="club-melding club-melding--fout" role="alert">De gegevens konden niet worden geladen. Ververs de pagina om het opnieuw te proberen.</p>
      ) : tab === 'gegevens' ? (
        <div className="club-bedrijf-indeling">
          <GegevensFormulier begin={bedrijf.gegevens} />
          <VestigingenContact vestigingen={vestigingen} href={naarVestigingen} />
        </div>
      ) : (
        <TekstenEditor begin={bedrijf.teksten} />
      )}
    </>
  )
}
