import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { kanBewerken } from '@/lib/club/rollen/wie'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalLinks, linkVoorScherm } from '@/lib/club/nieuwe-leden/links-opslag'
import { knoppenData } from '@/lib/club/nieuwe-leden/knoppen-data'
import { NieuweLedenKnoppen } from '@/components/club/nieuwe-leden/NieuweLedenKnoppen'
import { AanmeldlinkLijst } from '@/components/club/nieuwe-leden/AanmeldlinkLijst'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'
import '@/components/club/leden/leden.css'

// /club/leden/aanmeldlinks: de aanmeldlinks en QR-codes van een vestiging
// (besluit Kane 30-10-2026: leden melden zich alleen aan via een link of QR
// van de sportschool). Per link de stand, hoe vaak gebruikt, tot wanneer,
// de QR opnieuw tonen en intrekken. Onderdeel Leden.

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(NIEUWE_LEDEN)).lijst.kop }
}

export default async function AanmeldlinksPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('leden')
  const vestiging = kiesUit(t.vestigingen, (await searchParams).v)
  if (!vestiging) return <GeenVestigingen />
  const w = (await clubTekst(NIEUWE_LEDEN)).lijst
  const bewerken = kanBewerken(t, 'leden')
  const [links, knoppen] = await Promise.all([haalLinks(t.admin, t.userId, vestiging), knoppenData(t.admin, t.organisatie, vestiging)])
  const nu = new Date()
  return (
    <>
      <header className="club-paginakop">
        <div>
          <Link href={clubPad('/leden', vestiging)} className="club-knop club-knop--stil club-knop--klein"><ArrowLeft size={15} aria-hidden /> {w.terug}</Link>
          <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)}</p>
          <h1>{w.kop}</h1>
          <p>{w.uitleg}</p>
        </div>
        {bewerken && <div className="club-leden-kopknoppen"><NieuweLedenKnoppen {...knoppen} /></div>}
      </header>
      {links ? (
        <AanmeldlinkLijst links={links.map((l) => linkVoorScherm(l, nu))} vormen={knoppen.vormen} sportschool={knoppen.sportschool} basis={knoppen.basis} bewerken={bewerken} />
      ) : (
        <p className="club-melding club-melding--fout" role="alert">{w.ladenFout}</p>
      )}
    </>
  )
}
