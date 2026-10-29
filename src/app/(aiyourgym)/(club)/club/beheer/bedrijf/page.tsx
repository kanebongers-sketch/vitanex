import type { Metadata } from 'next'
import Link from 'next/link'
import { eisOnderdeel } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { haalBedrijf, haalVestigingContact } from '@/lib/club/bedrijf/opslag'
import { GegevensFormulier } from '@/components/club/bedrijf/GegevensFormulier'
import { TekstenEditor } from '@/components/club/bedrijf/TekstenEditor'
import { VestigingenContact } from '@/components/club/bedrijf/VestigingenContact'
import '@/components/club/bedrijf/bedrijf.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { BEDRIJF } from '@/lib/aiyourgym/taal/woorden/club/bedrijf'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(BEDRIJF)).pagina.titel }
}

// Bedrijfsgegevens (KvK, btw, hoofdkantoor, contact, social) en de teksten voor
// leden (huisregels, voorwaarden, privacy). Het tabblad staat in de URL.

const TABS = ['gegevens', 'teksten'] as const

type Tab = (typeof TABS)[number]

function kiesTab(ruw: string | string[] | undefined): Tab {
  const w = Array.isArray(ruw) ? ruw[0] : ruw
  return TABS.find((t) => t === w) ?? 'gegevens'
}

export default async function BedrijfPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisOnderdeel('bedrijf')
  const tab = kiesTab((await searchParams).tab)
  const tekst = (await clubTekst(BEDRIJF)).pagina
  const v = kiesUit(t.vestigingen, null)
  const naarVestigingen = v ? clubPad('/instellingen/vestigingen', v) : '/club/instellingen/vestigingen'
  const [bedrijf, vestigingen] = await Promise.all([
    haalBedrijf(t.admin, t.userId),
    tab === 'gegevens' ? haalVestigingContact(t.admin, t.userId) : Promise.resolve(null),
  ])

  return (
    <>
      <InstelKruimel id="bedrijf" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{tekst.titel}</h1>
          <p>{tekst.intro}</p>
        </div>
      </header>

      <nav className="club-segment club-bedrijf-tabs" aria-label={tekst.tabs}>
        {TABS.map((x) => (
          <Link key={x} href={`/club/beheer/bedrijf?tab=${x}`} aria-current={x === tab ? 'page' : undefined} scroll={false}>
            {tekst[x]}
          </Link>
        ))}
      </nav>

      {!bedrijf ? (
        <p className="club-melding club-melding--fout" role="alert">{tekst.laadFout}</p>
      ) : tab === 'gegevens' ? (
        <div className="club-bedrijf-indeling">
          <GegevensFormulier begin={bedrijf.gegevens} sportschool={t.organisatie.naam} />
          <VestigingenContact vestigingen={vestigingen} href={naarVestigingen} />
        </div>
      ) : (
        <TekstenEditor begin={bedrijf.teksten} />
      )}
    </>
  )
}
