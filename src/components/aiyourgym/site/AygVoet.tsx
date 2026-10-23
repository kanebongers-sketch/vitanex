import Link from 'next/link'
import { AygLogo } from '@/components/aiyourgym/merk/AygLogo'
import { HOOFDSTUKKEN } from '@/components/aiyourgym/inhoud/functies'
import { AANMELDEN, DEMO, DEMO_AANVRAGEN, INLOGGEN, NAV_LINKS, PRIJS_OP_MAAT, PRIVACY_BEVEILIGING, aygPad } from './paden'

const PRODUCT = HOOFDSTUKKEN.map((h) => ({ label: h.naam, pad: aygPad(`/functies#${h.sleutel}`) }))

export function AygVoet() {
  const jaar = new Date().getFullYear()
  return (
    <footer className="ayg-voet">
      <div className="ayg-wrap">
        <div className="ayg-voet-raster">
          <div className="ayg-voet-merk">
            <AygLogo opDonker />
            <p>Clubsoftware voor sportscholen. Beheer, coaching, planning, groei en betrokkenheid op een plek.</p>
          </div>
          <nav aria-labelledby="voet-site">
            <h2 id="voet-site">Website</h2>
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.pad}>
                  <Link href={l.pad}>{l.label}</Link>
                </li>
              ))}
              <li>
                <Link href={DEMO_AANVRAGEN}>Plan een gratis demo</Link>
              </li>
              <li>
                <Link href={DEMO}>Bekijk de live demo</Link>
              </li>
              <li>
                <Link href={PRIJS_OP_MAAT}>Vraag een prijs op maat</Link>
              </li>
              <li>
                <Link href={AANMELDEN}>Probeer gratis</Link>
              </li>
              <li>
                <Link href={INLOGGEN}>Inloggen</Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="voet-product">
            <h2 id="voet-product">Product</h2>
            <ul>
              {PRODUCT.map((l) => (
                <li key={l.pad}>
                  <Link href={l.pad}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="voet-afspraken">
            <h2 id="voet-afspraken">Afspraken</h2>
            <ul>
              <li>
                <Link href={PRIVACY_BEVEILIGING}>Privacy en beveiliging</Link>
              </li>
              <li>
                <Link href={aygPad('/privacy')}>Privacyverklaring</Link>
              </li>
              <li>
                <Link href={aygPad('/voorwaarden')}>Voorwaarden</Link>
              </li>
            </ul>
          </nav>
        </div>
        <AygLogo vorm="woordmerk" sier className="ayg-voet-woord" />
        <div className="ayg-voet-onder">
          <span>© {jaar} AI Your Gym</span>
          <Link href={PRIVACY_BEVEILIGING}>Database en server in Frankfurt, binnen de EU</Link>
        </div>
      </div>
    </footer>
  )
}
