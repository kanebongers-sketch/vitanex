import {
  TrendingUp, Bot, NotebookPen, Lock, Flame, Target,
  BarChart3, AlertTriangle, Lightbulb, ClipboardList, FileText, ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Stap = 'type' | 'hrcode' | 'info' | 'account' | 'bevestig'
export type GebruikerType = 'gebruiker' | 'hr'

export interface Voordeel {
  icon: LucideIcon
  /** Sleutel onder account.register.voordeel.* */
  sleutel: string
}

export const VOORDELEN_WERKNEMER: Voordeel[] = [
  { icon: TrendingUp,  sleutel: 'verloop' },
  { icon: Bot,         sleutel: 'coach' },
  { icon: NotebookPen, sleutel: 'journal' },
  { icon: Lock,        sleutel: 'anoniem' },
  { icon: Flame,       sleutel: 'gewoontes' },
  { icon: Target,      sleutel: 'focus' },
]

export const VOORDELEN_HR: Voordeel[] = [
  { icon: BarChart3,     sleutel: 'realtime' },
  { icon: AlertTriangle, sleutel: 'signalen' },
  { icon: Lightbulb,     sleutel: 'inzichten' },
  { icon: ClipboardList, sleutel: 'surveys' },
  { icon: FileText,      sleutel: 'rapporten' },
  { icon: ShieldCheck,   sleutel: 'privacy' },
]

/** Formaat van een HR-code, bv. FIT-X2K */
export const HR_CODE_PATROON = /^[A-Z]{3}-[0-9][A-Z][0-9]$/

/** Leeg veld telt als geldig (nog geen foutmelding tijdens typen). */
export function isEmailGeldig(email: string): boolean {
  return email.trim().length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export interface WachtwoordSterkte {
  niveau: number
  /** Sleutel onder account.register.sterkte.* */
  sleutel: string
  kleur: string
}

export function berekenWachtwoordSterkte(wachtwoord: string): WachtwoordSterkte {
  const niveau = wachtwoord.length < 8 ? 0 : wachtwoord.length < 12 ? 1 : wachtwoord.length < 16 ? 2 : 3
  return {
    niveau,
    sleutel: ['teKort', 'matig', 'goed', 'sterk'][niveau],
    kleur: ['var(--mf-red)', 'var(--mf-amber)', 'var(--mf-green)', 'var(--mf-green)'][niveau],
  }
}

/**
 * Normaliseert HR-code-invoer: uppercase, alleen A-Z/0-9/-, auto-streepje
 * na de derde letter en maximaal 7 tekens.
 */
export function formatteerHrCodeInvoer(invoer: string, vorige: string): string {
  let v = invoer.toUpperCase().replace(/[^A-Z0-9-]/g, '')
  if (v.length === 3 && !v.includes('-') && vorige.length === 2) v = v + '-'
  if (v.length > 7) v = v.slice(0, 7)
  return v
}
