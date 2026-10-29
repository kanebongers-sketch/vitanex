import type { Metadata } from 'next'
import Link from 'next/link'
import { Inbox } from 'lucide-react'
import { eisClubToegang } from '@/lib/club/toegang'
import { zichtbareArtikelenIn } from '@/lib/club/hulp/artikelen-taal'
import { eigenMeldingen } from '@/lib/club/hulp/opslag'
import { HulpArtikelen } from '@/components/club/hulp/HulpArtikelen'
import { MeldFormulier } from '@/components/club/hulp/MeldFormulier'
import { MeldingKaart } from '@/components/club/hulp/MeldingKaart'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { HULP } from '@/lib/aiyourgym/taal/woorden/club/hulp'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(HULP)).pagina.titel }
}
export const dynamic = 'force-dynamic'

// Het helpcentrum: korte handleidingen per onderdeel (alleen van wat aan staat
// en wat je mag openen), een vraag of probleem melden en je eigen meldingen met
// het antwoord. Er gaat geen mail naar buiten.

export default async function HulpPagina() {
  const t = await eisClubToegang()
  const taal = await getTaal()
  const tekst = (await clubTekst(HULP)).pagina
  const artikelen = zichtbareArtikelenIn(t.organisatie.uit, t.onderdelen, taal)
  const meldingen = await eigenMeldingen(t)

  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{tekst.titel}</h1>
          <p>{tekst.intro}</p>
        </div>
        {t.isPlatformEigenaar && (
          <Link href="/club/hulp/meldingen" className="club-knop">
            <Inbox size={16} aria-hidden /> {tekst.alleMeldingen}
          </Link>
        )}
      </header>

      <div className="club-hulp">
        <HulpArtikelen artikelen={artikelen} />

        <section className="club-hulp-melden" id="melden" aria-labelledby="hulp-melden">
          <div className="club-hulp-meldenkop">
            <h2 id="hulp-melden" className="club-hulp-kop">{tekst.melden}</h2>
            <p>{tekst.meldenUitleg}</p>
          </div>
          <MeldFormulier />
        </section>

        <section className="club-hulp-mijn" aria-labelledby="hulp-mijn">
          <h2 id="hulp-mijn" className="club-hulp-kop">{tekst.mijn}</h2>
          {!meldingen && <p className="club-melding club-melding--fout" role="status">{tekst.mijnFout}</p>}
          {meldingen && meldingen.length === 0 && <p className="club-hulp-leeg">{tekst.mijnLeeg}</p>}
          {meldingen && meldingen.length > 0 && (
            <ul className="club-hulp-meldingen" role="list">
              {meldingen.map((m) => (
                <li key={m.id}>
                  <MeldingKaart m={m} taal={taal} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
