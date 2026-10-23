import { CalendarCheck, KeyRound, LayoutDashboard, Lock } from 'lucide-react'
import type { Invoer, PakketKeuze } from './types'

// Het donkere paneel naast het formulier: je adres groot in beeld, je keuze
// en wat er na het aanmelden gebeurt. Alleen wat Club echt doet.

interface SamenvattingProps {
  invoer: Invoer
  pakket: PakketKeuze | null
  proefdagen: number
  adresActief: boolean
}

export function Samenvatting({ invoer, pakket, proefdagen, adresActief }: SamenvattingProps) {
  const naam = invoer.slug || 'jouwgym'
  const aanvraag = pakket !== null && !pakket.open
  const stappen = [
    { Icoon: CalendarCheck, tekst: aanvraag ? 'We nemen zelf contact met je op om je sportschool te starten.' : `Je start met ${proefdagen} dagen gratis. Daarna per maand, per vestiging.` },
    { Icoon: LayoutDashboard, tekst: aanvraag ? 'Na de start staat je eigen omgeving klaar, met een basisbibliotheek met oefeningen.' : 'Je eigen omgeving staat direct klaar, met een basisbibliotheek met oefeningen.' },
    { Icoon: KeyRound, tekst: 'Je logt in met je e-mailadres en het wachtwoord dat je hier kiest. Een startwizard helpt je met huisstijl, vestigingen, lessen en team.' },
  ]
  return (
    <aside className="aan-samen ayg-podium" aria-label="Je aanmelding">
      <p className="aan-samen-label">Je eigen adres</p>
      <div className="aan-samen-adres">
        <p className="aan-samen-url" aria-live="polite">
          <Lock size={16} strokeWidth={2.2} aria-hidden="true" />
          <span>
            <span className="aan-samen-slug">{naam}</span>
            <span className="aan-samen-domein">.aiyourgym.com</span>
          </span>
        </p>
        <p className="aan-samen-uitleg">
          {adresActief
            ? 'Hier werken jij en je team. Je leden krijgen de app in jouw naam en kleuren.'
            : 'Dit adres leggen we voor je vast. Tot het live gaat werk je via aiyourgym.com; je leden krijgen de app al in jouw naam en kleuren.'}
        </p>
      </div>
      <dl className="aan-samen-keuze">
        <div>
          <dt>Pakket</dt>
          <dd>{pakket?.naam ?? 'Nog kiezen'}</dd>
        </div>
        <div>
          <dt>Vestigingen</dt>
          <dd>{invoer.aantalVestigingen}</dd>
        </div>
      </dl>
      <p className="aan-samen-label">Na het aanmelden</p>
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
