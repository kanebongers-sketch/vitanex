import Link from 'next/link'
import { AygLogo } from '@/components/aiyourgym/merk/AygLogo'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOET } from '@/lib/aiyourgym/taal/woorden/website/voet'
import { aygPad, SITE_PADEN } from './paden'

// Voet van de verkoopwebsite: kort en rustig, in de ene letter van de site
// (Hanken Grotesk), op inkt na de salie oproep. Links het merk met een zin, in het
// midden de paar links die niet in de kop staan, rechts inloggen en waar de data
// staat; onderaan de juridische regel. Geen groot woordmerk meer (dat botste met
// de letter van de site). In de taal van de pagina (woordenboek VOET).

export async function AygVoet() {
  const t = VOET[await getSiteTaal()]
  const { INLOGGEN, NIEUW, OVERSTAPCHECKLIST, PRIJS_OP_MAAT, PRIVACY_BEVEILIGING } = SITE_PADEN
  const links = [
    { pad: NIEUW, label: t.nieuw },
    { pad: OVERSTAPCHECKLIST, label: t.overstapchecklist },
    { pad: PRIJS_OP_MAAT, label: t.prijsOpMaat },
    { pad: PRIVACY_BEVEILIGING, label: t.privacyBeveiliging },
  ]
  const jaar = new Date().getFullYear()
  return (
    <footer className="ayg-voet vt">
      <div className="vt-merk">
        <Link href={aygPad()} className="vt-logo">
          <AygLogo vorm="beeldmerk" opDonker sier />
          <span>AI Your Gym</span>
        </Link>
        <p>{t.merkZin}</p>
      </div>
      <nav className="vt-menu" aria-label={t.menu}>
        <ul>
          {links.map((l) => (
            <li key={l.pad}>
              <Link href={l.pad}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="vt-account">
        <Link href={INLOGGEN} className="vt-inloggen">
          {t.inloggen}
        </Link>
        <p>{t.dataInEu}</p>
      </div>
      <p className="vt-onder">
        <span>© {jaar} AI Your Gym</span>
        <Link href={aygPad('/privacy')}>{t.privacyverklaring}</Link>
        <Link href={aygPad('/voorwaarden')}>{t.voorwaarden}</Link>
      </p>
    </footer>
  )
}
