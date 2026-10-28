import Link from 'next/link'
import { AygLogo } from '@/components/aiyourgym/merk/AygLogo'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOET } from '@/lib/aiyourgym/taal/woorden/website/voet'
import { aygPad, navLinks, SITE_PADEN } from './paden'

// Voet van de verkoopwebsite (Obsidian Luxury, 28-10-2026): direct onder de oproep
// van elke pagina, dus zelf zonder knoppen. Het logo met de merkzin en drie rustige
// kolommen (product, overstappen, afspraken), onderaan het jaar, inloggen en waar de
// data staat, en het woordmerk groot en bijna onzichtbaar als afsluiting (puur sier).
// Kort (Kane 24-10-2026): alleen wat een bezoeker hier zoekt. In de taal van de pagina.

export async function AygVoet() {
  const taal = await getSiteTaal()
  const t = VOET[taal]
  const { DEMO, INLOGGEN, NIEUW, OVERSTAPPEN, OVERSTAPCHECKLIST, PRIJS_OP_MAAT, PRIVACY_BEVEILIGING } = SITE_PADEN
  const menu = navLinks(taal)
  const jaar = new Date().getFullYear()
  return (
    <footer className="ayg-voet">
      <div className="ayg-wrap">
        <div className="ayg-voet-raster">
          <div className="ayg-voet-merk">
            <AygLogo />
            <p>{t.merkZin}</p>
          </div>
          <nav aria-label={t.product}>
            <h2>{t.product}</h2>
            <ul>
              {menu.map((l) => (
                <li key={l.pad}>
                  <Link href={l.pad}>{l.label}</Link>
                </li>
              ))}
              <li>
                <Link href={NIEUW}>{t.nieuw}</Link>
              </li>
            </ul>
          </nav>
          <nav aria-label={t.overstappen}>
            <h2>{t.overstappen}</h2>
            <ul>
              <li>
                <Link href={OVERSTAPPEN}>{t.zoStapJeOver}</Link>
              </li>
              <li>
                <Link href={OVERSTAPCHECKLIST}>{t.overstapchecklist}</Link>
              </li>
              <li>
                <Link href={DEMO}>{t.liveDemo}</Link>
              </li>
              <li>
                <Link href={PRIJS_OP_MAAT}>{t.prijsOpMaat}</Link>
              </li>
            </ul>
          </nav>
          <nav aria-label={t.afspraken}>
            <h2>{t.afspraken}</h2>
            <ul>
              <li>
                <Link href={PRIVACY_BEVEILIGING}>{t.privacyBeveiliging}</Link>
              </li>
              <li>
                <Link href={aygPad('/privacy')}>{t.privacyverklaring}</Link>
              </li>
              <li>
                <Link href={aygPad('/voorwaarden')}>{t.voorwaarden}</Link>
              </li>
              <li>
                <Link href={INLOGGEN}>{t.inloggen}</Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="ayg-voet-onder">
          <span>© {jaar} AI Your Gym</span>
          <Link href={INLOGGEN}>{t.inloggen}</Link>
          <Link href={PRIVACY_BEVEILIGING} className="ayg-voet-eu">
            {t.dataInEu}
          </Link>
        </div>
      </div>
      <AygLogo vorm="woordmerk" sier className="ayg-voet-woord" />
    </footer>
  )
}
