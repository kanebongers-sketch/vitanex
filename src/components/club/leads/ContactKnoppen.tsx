import { Mail, Phone } from 'lucide-react'
import { telLink } from '@/lib/club/leads/regels'

interface ContactKnoppenProps {
  naam: string
  telefoon: string | null
  email: string | null
  klein?: boolean
}

// Bellen en mailen in een klik. Geen nummer of adres: de knop staat er niet.
export function ContactKnoppen({ naam, telefoon, email, klein = true }: ContactKnoppenProps) {
  const maat = klein ? 'club-knop--klein' : ''
  return (
    <>
      {telefoon && (
        <a href={telLink(telefoon)} className={`club-knop ${maat}`} aria-label={`Bel ${naam} op ${telefoon}`}>
          <Phone size={15} aria-hidden />
          <span>Bel</span>
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className={`club-knop ${maat}`} aria-label={`Mail ${naam} op ${email}`}>
          <Mail size={15} aria-hidden />
          <span>Mail</span>
        </a>
      )}
    </>
  )
}
