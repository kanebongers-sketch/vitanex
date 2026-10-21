import type { Metadata } from 'next'
import Link from 'next/link'
import { Inbox } from 'lucide-react'
import { eisClubToegang } from '@/lib/club/toegang'
import { zichtbareArtikelen } from '@/lib/club/hulp/artikelen'
import { eigenMeldingen } from '@/lib/club/hulp/opslag'
import { HulpArtikelen } from '@/components/club/hulp/HulpArtikelen'
import { MeldFormulier } from '@/components/club/hulp/MeldFormulier'
import { MeldingKaart } from '@/components/club/hulp/MeldingKaart'

export const metadata: Metadata = { title: 'Hulp en support' }
export const dynamic = 'force-dynamic'

// Het helpcentrum: korte handleidingen per onderdeel (alleen van wat aan staat
// en wat je mag openen), een vraag of probleem melden en je eigen meldingen met
// het antwoord. Er gaat geen mail naar buiten.

export default async function HulpPagina() {
  const t = await eisClubToegang()
  const artikelen = zichtbareArtikelen(t.organisatie.uit, t.onderdelen)
  const meldingen = await eigenMeldingen(t)

  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Hulp en support</h1>
          <p>Korte handleidingen per onderdeel. Kom je er niet uit, of mis je iets? Meld het onderaan deze pagina.</p>
        </div>
        {t.isPlatformEigenaar && (
          <Link href="/club/hulp/meldingen" className="club-knop">
            <Inbox size={16} aria-hidden /> Alle meldingen
          </Link>
        )}
      </header>

      <div className="club-hulp">
        <HulpArtikelen artikelen={artikelen} />

        <section className="club-hulp-melden" id="melden" aria-labelledby="hulp-melden">
          <div className="club-hulp-meldenkop">
            <h2 id="hulp-melden" className="club-hulp-kop">Vraag of probleem melden</h2>
            <p>Je melding komt binnen bij de support van Club. Het antwoord verschijnt hieronder bij Mijn meldingen.</p>
          </div>
          <MeldFormulier />
        </section>

        <section className="club-hulp-mijn" aria-labelledby="hulp-mijn">
          <h2 id="hulp-mijn" className="club-hulp-kop">Mijn meldingen</h2>
          {!meldingen && <p className="club-melding club-melding--fout" role="status">Je meldingen konden niet worden gelezen. Probeer het later opnieuw.</p>}
          {meldingen && meldingen.length === 0 && <p className="club-hulp-leeg">Je hebt nog niets gemeld.</p>}
          {meldingen && meldingen.length > 0 && (
            <ul className="club-hulp-meldingen" role="list">
              {meldingen.map((m) => (
                <li key={m.id}>
                  <MeldingKaart m={m} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
