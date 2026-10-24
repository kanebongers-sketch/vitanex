import Link from 'next/link'
import { AygLogo } from '@/components/aiyourgym/merk/AygLogo'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import type { MenuSleutel } from '@/lib/aiyourgym/taal/woorden/website/kop'
import { VOET } from '@/lib/aiyourgym/taal/woorden/website/voet'
import { aygPad, navLinks, SITE_PADEN } from './paden'

// Voet van de verkoopwebsite: kort en rustig (Kane 24-10-2026: "veel te veel").
// Drie kolommen met hooguit vier links, niets dubbel met de kop: Probeer gratis,
// demo plannen en de live demo staan daar al. De hoofdstukken van Functies zijn
// ankers op die pagina zelf. Inloggen staat alleen hier (onderste regel).
// In de taal van de pagina (woordenboek VOET, menulinks uit KOP).

interface VoetLink {
  label: string
  pad: string
}

interface VoetKolom {
  id: string
  titel: string
  links: readonly VoetLink[]
}

/** De kolommen van de voet in een taal. */
export function voetKolommen(taal: Taal): readonly VoetKolom[] {
  const t = VOET[taal]
  const p = SITE_PADEN
  const menu = navLinks(taal)
  const uitMenu = (sleutel: MenuSleutel): VoetLink => {
    const l = menu.find((n) => n.sleutel === sleutel)
    if (!l) throw new Error(`Onbekende navigatielink: ${sleutel}`)
    return { label: l.label, pad: l.pad }
  }
  return [
    {
      id: 'voet-product',
      titel: t.product,
      links: [uitMenu('functies'), uitMenu('schemas'), uitMenu('ledenapp'), uitMenu('voorWie')],
    },
    {
      id: 'voet-overstappen',
      titel: t.overstappen,
      links: [
        { label: t.zoStapJeOver, pad: p.OVERSTAPPEN },
        { label: t.overstapchecklist, pad: p.OVERSTAPCHECKLIST },
        { label: t.prijsOpMaat, pad: p.PRIJS_OP_MAAT },
        { label: t.nieuw, pad: p.NIEUW },
      ],
    },
    {
      id: 'voet-afspraken',
      titel: t.afspraken,
      links: [
        { label: t.privacyBeveiliging, pad: p.PRIVACY_BEVEILIGING },
        { label: t.privacyverklaring, pad: aygPad('/privacy') },
        { label: t.voorwaarden, pad: aygPad('/voorwaarden') },
      ],
    },
  ]
}

/** Nederlands; nieuwe code gebruikt voetKolommen(taal). */
export const VOET_KOLOMMEN: readonly VoetKolom[] = voetKolommen('nl')

export async function AygVoet() {
  const taal = await getSiteTaal()
  const t = VOET[taal]
  const { INLOGGEN, PRIVACY_BEVEILIGING } = SITE_PADEN
  const jaar = new Date().getFullYear()
  return (
    <footer className="ayg-voet">
      <div className="ayg-wrap">
        <div className="ayg-voet-raster">
          <div className="ayg-voet-merk">
            <AygLogo opDonker />
            <p>{t.merkZin}</p>
          </div>
          {voetKolommen(taal).map((k) => (
            <nav key={k.id} aria-labelledby={k.id}>
              <h2 id={k.id}>{k.titel}</h2>
              <ul>
                {k.links.map((l) => (
                  <li key={l.pad}>
                    <Link href={l.pad}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <AygLogo vorm="woordmerk" sier className="ayg-voet-woord" />
        <div className="ayg-voet-onder">
          <span>© {jaar} AI Your Gym</span>
          <Link href={PRIVACY_BEVEILIGING}>{t.dataInEu}</Link>
          <Link href={INLOGGEN} className="ayg-voet-inloggen">
            {t.inloggen}
          </Link>
        </div>
      </div>
    </footer>
  )
}
