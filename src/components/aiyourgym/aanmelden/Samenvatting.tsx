import { CalendarCheck, KeyRound, LayoutDashboard, Lock } from 'lucide-react'
import { adresVeld } from '@/lib/club/kern/subdomein'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { AANMELD_FORMULIER } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'
import type { Invoer, PakketKeuze } from './types'

// Het donkere paneel naast het formulier: je adres groot in beeld, je keuze
// en wat er na het aanmelden gebeurt. Alleen wat Club echt doet.

interface SamenvattingProps {
  /** Staan de subdomeinen aan? Dan naam.aiyourgym.com, anders aiyourgym.com/naam. */
  subdomeinen: boolean
  invoer: Invoer
  pakket: PakketKeuze | null
  proefdagen: number
}

export function Samenvatting({ invoer, pakket, proefdagen, subdomeinen }: SamenvattingProps) {
  const t = useTekst(AANMELD_FORMULIER)
  const veld = adresVeld(subdomeinen)
  const naam = invoer.slug || t.jouwgym
  const aanvraag = pakket !== null && !pakket.open
  const stappen = [
    { Icoon: CalendarCheck, tekst: aanvraag ? t.naAanvraag1 : t.naProef1(proefdagen) },
    { Icoon: LayoutDashboard, tekst: aanvraag ? t.naAanvraag2 : t.naProef2 },
    { Icoon: KeyRound, tekst: t.na3 },
  ]
  return (
    <aside className="aan-samen ayg-podium" aria-label={t.samenLabel}>
      <p className="aan-samen-label">{t.eigenAdresLabel}</p>
      <div className="aan-samen-adres">
        <p className="aan-samen-url" aria-live="polite">
          <Lock size={16} strokeWidth={2.2} aria-hidden="true" />
          <span>
            {veld.voor && <span className="aan-samen-domein">{veld.voor}</span>}
            <span className="aan-samen-slug">{naam}</span>
            {veld.achter && <span className="aan-samen-domein">{veld.achter}</span>}
          </span>
        </p>
        <p className="aan-samen-uitleg">
          {t.adresUitleg}
        </p>
      </div>
      <dl className="aan-samen-keuze">
        <div>
          <dt>{t.rij.pakket}</dt>
          <dd>{pakket?.naam ?? t.nogKiezen}</dd>
        </div>
        <div>
          <dt>{t.rij.vestigingen}</dt>
          <dd>{invoer.aantalVestigingen}</dd>
        </div>
      </dl>
      <p className="aan-samen-label">{t.naAanmelden}</p>
      <ol className="aan-samen-stappen">
        {stappen.map(({ Icoon, tekst }) => (
          <li key={tekst}>
            <Icoon size={18} strokeWidth={2} aria-hidden="true" />
            <span>{tekst}</span>
          </li>
        ))}
      </ol>
    </aside>
  )
}
