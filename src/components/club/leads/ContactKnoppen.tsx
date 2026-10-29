'use client'

import { Mail, Phone } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
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
  const t = useTekst(LEADS).contactKnoppen
  return (
    <>
      {telefoon && (
        <a href={telLink(telefoon)} className={`club-knop ${maat}`} aria-label={t.belLabel(naam, telefoon)}>
          <Phone size={15} aria-hidden />
          <span>{t.bel}</span>
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className={`club-knop ${maat}`} aria-label={t.mailLabel(naam, email)}>
          <Mail size={15} aria-hidden />
          <span>{t.mail}</span>
        </a>
      )}
    </>
  )
}
