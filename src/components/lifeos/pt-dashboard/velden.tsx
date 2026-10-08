'use client'

import type { ReactNode } from 'react'
import { MessageCircle, Phone } from 'lucide-react'
import { belbaarNummer } from '@/lib/lifeos/pt-dashboard/overzicht'

// Kleine, gedeelde bouwstenen voor de formulieren en lijsten van het PT-dashboard.
// Stijl staat in globals.css (.ptd-*), zodat hover/focus ontworpen zijn.

export function Veld({ label, id, children, hint }: { label: string; id: string; children: ReactNode; hint?: string }) {
  return (
    <div className="ptd-veld">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <p className="ptd-hint">{hint}</p> : null}
    </div>
  )
}

/** Eén keuze uit een rijtje chips (radio-gedrag, toetsenbord-vriendelijk). */
export function Keuzes<T extends string>({
  label,
  opties,
  waarde,
  onKies,
  leegToegestaan = false,
}: {
  label: string
  opties: readonly { waarde: T; label: string }[]
  waarde: T | null
  onKies: (w: T | null) => void
  leegToegestaan?: boolean
}) {
  return (
    <div className="ptd-veld">
      <span>{label}</span>
      <div className="ptd-keuzes" role="group" aria-label={label}>
        {opties.map((o) => (
          <button
            key={o.waarde}
            type="button"
            className="ptd-chip"
            aria-pressed={waarde === o.waarde}
            onClick={() => onKies(waarde === o.waarde && leegToegestaan ? null : o.waarde)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Bellen en WhatsApp, alleen als het contact een (NL-)telefoonnummer is. */
export function ContactActies({ contact, naam }: { contact: string | null; naam: string }) {
  const nummer = belbaarNummer(contact)
  if (!nummer) return null
  return (
    <>
      <a className="ptd-knop ptd-knop--klein" href={`tel:+${nummer}`} aria-label={`${naam} bellen`}>
        <Phone size={15} aria-hidden /> Bel
      </a>
      <a className="ptd-knop ptd-knop--klein" href={`https://wa.me/${nummer}`} target="_blank" rel="noopener noreferrer" aria-label={`${naam} appen via WhatsApp`}>
        <MessageCircle size={15} aria-hidden /> App
      </a>
    </>
  )
}
