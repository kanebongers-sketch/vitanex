import {
  TrendingUp, Bot, NotebookPen, Lock, Flame, Target,
  BarChart3, AlertTriangle, Lightbulb, ClipboardList, FileText, ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Stap = 'type' | 'hrcode' | 'info' | 'account' | 'bevestig'
export type GebruikerType = 'gebruiker' | 'hr'

export interface Voordeel {
  icon: LucideIcon
  tekst: string
}

export const VOORDELEN_WERKNEMER: Voordeel[] = [
  { icon: TrendingUp,  tekst: 'Zie je eigen vitaliteitsverloop over tijd' },
  { icon: Bot,         tekst: 'AI-coach beschikbaar voor persoonlijk advies' },
  { icon: NotebookPen, tekst: 'Privé journal voor reflectie en notities' },
  { icon: Lock,        tekst: 'Volledig anoniem tegenover je werkgever' },
  { icon: Flame,       tekst: 'Gewoontetracker met dagelijkse streaks' },
  { icon: Target,      tekst: 'Focus- en hersteltools voor op het werk' },
]

export const VOORDELEN_HR: Voordeel[] = [
  { icon: BarChart3,     tekst: 'Realtime welzijnsdata van je hele team' },
  { icon: AlertTriangle, tekst: 'Vroege signalen bij burn-out-risico’s' },
  { icon: Lightbulb,     tekst: 'AI-inzichten en concrete HR-adviezen' },
  { icon: ClipboardList, tekst: 'Anonieme pulse surveys met templates' },
  { icon: FileText,      tekst: 'Exporteerbare rapporten voor management' },
  { icon: ShieldCheck,   tekst: 'Privacy-by-design - AVG-conform' },
]

/** Formaat van een HR-code, bv. FIT-X2K */
export const HR_CODE_PATROON = /^[A-Z]{3}-[0-9][A-Z][0-9]$/

/** Leeg veld telt als geldig (nog geen foutmelding tijdens typen). */
export function isEmailGeldig(email: string): boolean {
  return email.trim().length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export interface WachtwoordSterkte {
  niveau: number
  tekst: string
  kleur: string
}

export function berekenWachtwoordSterkte(wachtwoord: string): WachtwoordSterkte {
  const niveau = wachtwoord.length < 8 ? 0 : wachtwoord.length < 12 ? 1 : wachtwoord.length < 16 ? 2 : 3
  return {
    niveau,
    tekst: ['Te kort', 'Matig', 'Goed', 'Sterk'][niveau],
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
