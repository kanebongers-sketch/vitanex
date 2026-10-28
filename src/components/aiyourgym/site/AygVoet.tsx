import Link from 'next/link'
import { AygLogo } from '@/components/aiyourgym/merk/AygLogo'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOET } from '@/lib/aiyourgym/taal/woorden/website/voet'
import { aygPad, navLinks, SITE_PADEN } from './paden'

// Voet van de verkoopwebsite: de laatste twee rijen van het bord, gevulde tegels
// zonder lijnen (richting "Kleurhoofdstukken" 28-10-2026). Kort (Kane 24-10-2026:
// "veel te veel"): een uitspraak, vier links, de live demo, waar de data staat en
// inloggen; daaronder het woordmerk groot en een tegel die als geheel naar aanmelden
// gaat. In de taal van de pagina (woordenboek VOET, menulinks uit KOP).

const VOET_MENU = ['functies', 'voorWie', 'overstappen', 'prijzen'] as const

export async function AygVoet() {
  const taal = await getSiteTaal()
  const t = VOET[taal]
  const { AANMELDEN, DEMO, INLOGGEN, NIEUW, PRIVACY_BEVEILIGING } = SITE_PADEN
  const menu = navLinks(taal).filter((l) => (VOET_MENU as readonly string[]).includes(l.sleutel))
  const jaar = new Date().getFullYear()
  return (
    <footer className="ayg-voet vt">
      <div className="vt-tegel vt-zin">
        <p>{t.merkZin}</p>
        <p className="vt-klein">
          © {jaar} AI Your Gym · <Link href={aygPad('/privacy')}>{t.privacyverklaring}</Link> ·{' '}
          <Link href={aygPad('/voorwaarden')}>{t.voorwaarden}</Link>
        </p>
      </div>
      <nav className="vt-tegel vt-menu" aria-label={t.menu}>
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
      <Link href={DEMO} className="vt-tegel vt-demo">
        {t.liveDemo}
      </Link>
      <div className="vt-tegel vt-eu">
        <Link href={INLOGGEN} className="vt-inloggen">
          {t.inloggen}
        </Link>
        <Link href={PRIVACY_BEVEILIGING} className="vt-eu-tekst">
          {t.dataInEu}
        </Link>
      </div>
      <div className="vt-tegel vt-woord">
        <AygLogo vorm="woordmerk" opDonker className="vt-woordmerk" />
      </div>
      <Link href={AANMELDEN} className="vt-tegel vt-open">
        <span>{t.openClub}</span>
        <svg viewBox="0 0 48 48" aria-hidden className="vt-pijl">
          <path d="M6 24h34M26 10l14 14-14 14" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
        </svg>
      </Link>
    </footer>
  )
}
