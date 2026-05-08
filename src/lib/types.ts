// ─── Gedeelde types voor MentaForce ────────────────────────────────────────
// Eén centraal bestand — importeer vanuit hier in alle pagina's en API-routes.

// ── Gebruiker & profiel ────────────────────────────────────────────────────

export type Rol = 'medewerker' | 'hr' | 'admin'

export interface Profiel {
  id: string
  naam: string
  email?: string | null
  rol: Rol
  bedrijf_id: string | null
  bedrijf?: string | null
  avatar_url?: string | null
  afdeling?: string | null
  functie?: string | null
  telefoon?: string | null
  locatie?: string | null
  laatste_checkin?: string | null
}

// ── Check-in ───────────────────────────────────────────────────────────────

export interface Checkin {
  id: string
  user_id: string
  bedrijf_id?: string | null
  energie: number
  slaap: number
  fysiek_pijn: number
  fysiek_beweging: number
  werkdruk: number
  mentaal_focus: number
  mentaal_stress: number
  mentaal_balans: number
  motivatie: number
  sociaal_team: number
  sociaal_steun: number
  herstel: number
  created_at: string
}

export interface CheckinSessie {
  id: string
  user_id: string
  bedrijf_id?: string | null
  week_start: string
  aangemaakt_op: string
}

export const METRIC_KEYS = [
  'energie', 'slaap', 'fysiek_pijn', 'fysiek_beweging',
  'werkdruk', 'mentaal_focus', 'mentaal_stress', 'mentaal_balans',
  'motivatie', 'sociaal_team', 'sociaal_steun', 'herstel',
] as const

export type MetricKey = typeof METRIC_KEYS[number]

export const METRIC_LABELS: Record<MetricKey, string> = {
  energie:        'Energie',
  slaap:          'Slaap',
  fysiek_pijn:    'Fys. klachten',
  fysiek_beweging:'Beweging',
  werkdruk:       'Werkdruk',
  mentaal_focus:  'Focus',
  mentaal_stress: 'Stress',
  mentaal_balans: 'Balans',
  motivatie:      'Motivatie',
  sociaal_team:   'Teamwerk',
  sociaal_steun:  'Steun',
  herstel:        'Herstel',
}

// ── Verlof ─────────────────────────────────────────────────────────────────

export type VerlofType = 'vakantie' | 'ziekte' | 'bijzonder' | 'onbetaald' | 'overig'
export type VerlofStatus = 'aangevraagd' | 'goedgekeurd' | 'afgewezen'

export interface VerlofAanvraag {
  id: string
  user_id: string
  bedrijf_id?: string | null
  type: VerlofType
  datum_van: string
  datum_tot: string
  reden?: string | null
  status: VerlofStatus
  reviewer_notitie?: string | null
  created_at: string
}

export const VERLOF_TYPE_LABELS: Record<VerlofType, string> = {
  vakantie:  'Vakantie',
  ziekte:    'Ziekteverlof',
  bijzonder: 'Bijzonder verlof',
  onbetaald: 'Onbetaald verlof',
  overig:    'Overig',
}

export const VERLOF_TYPE_EMOJI: Record<VerlofType, string> = {
  vakantie:  '🌴',
  ziekte:    '🤒',
  bijzonder: '⭐',
  onbetaald: '💼',
  overig:    '📋',
}

// ── Urenregistratie ────────────────────────────────────────────────────────

export interface Tijdregistratie {
  id: string
  user_id: string
  bedrijf_id?: string | null
  datum: string
  uren: number
  project: string
  beschrijving?: string | null
  goedgekeurd: boolean
  created_at: string
}

// ── Declaraties ────────────────────────────────────────────────────────────

export type DeclaratieCategorie = 'reiskosten' | 'maaltijd' | 'materiaal' | 'training' | 'representatie' | 'overig'
export type DeclaratieStatus = 'ingediend' | 'goedgekeurd' | 'afgewezen'

export interface Declaratie {
  id: string
  user_id: string
  bedrijf_id?: string | null
  datum: string
  bedrag: number
  categorie: DeclaratieCategorie
  beschrijving: string
  status: DeclaratieStatus
  reviewer_notitie?: string | null
  created_at: string
}

export const DECLARATIE_CAT_LABELS: Record<DeclaratieCategorie, string> = {
  reiskosten:    'Reiskosten',
  maaltijd:      'Maaltijd',
  materiaal:     'Materiaal',
  training:      'Training',
  representatie: 'Representatie',
  overig:        'Overig',
}

export const DECLARATIE_CAT_EMOJI: Record<DeclaratieCategorie, string> = {
  reiskosten:    '🚗',
  maaltijd:      '🍽️',
  materiaal:     '📦',
  training:      '🎓',
  representatie: '🤝',
  overig:        '💰',
}

// ── Bedrijfsnieuws ─────────────────────────────────────────────────────────

export type NieuwsType = 'aankondiging' | 'beleid' | 'evenement' | 'resultaten' | 'overig'

export interface BedrijfsNieuws {
  id: string
  bedrijf_id: string
  auteur_id: string
  titel: string
  inhoud: string
  type: NieuwsType
  belangrijk: boolean
  gepubliceerd_op: string
  auteur_naam?: string
}

export const NIEUWS_TYPE_STIJL: Record<NieuwsType, { emoji: string; bg: string; color: string; label: string }> = {
  aankondiging: { emoji: '📣', bg: '#E6F1FB', color: '#185FA5', label: 'Aankondiging' },
  beleid:       { emoji: '📋', bg: '#FAEEDA', color: '#854F0B', label: 'Beleid' },
  evenement:    { emoji: '🎉', bg: '#EDE9FE', color: '#5B21B6', label: 'Evenement' },
  resultaten:   { emoji: '📈', bg: '#E1F5EE', color: '#0F6E56', label: 'Resultaten' },
  overig:       { emoji: '💬', bg: '#F3F4F6', color: '#6b7280', label: 'Overig' },
}

// ── Loonstroken ────────────────────────────────────────────────────────────

export interface Loonstrook {
  id: string
  user_id: string
  bedrijf_id?: string | null
  periode: string
  periode_datum: string
  bruto_loon?: number | null
  netto_loon?: number | null
  opslag_pad: string
  bestandsnaam: string
  aangemaakt_op: string
}

// ── Score helpers ──────────────────────────────────────────────────────────

export function scoreKleur(score: number): string {
  if (score >= 4) return '#1D9E75'
  if (score >= 2.5) return '#BA7517'
  return '#E24B4A'
}

export function scoreBadge(score: number): { bg: string; color: string; label: string } {
  if (score >= 4) return { bg: '#E1F5EE', color: '#0F6E56', label: 'Goed' }
  if (score >= 2.5) return { bg: '#FAEEDA', color: '#854F0B', label: 'Matig' }
  return { bg: '#FCEBEB', color: '#A32D2D', label: 'Laag' }
}

export function gemiddelde(arr: number[]): number {
  if (!arr.length) return 0
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
}

export function checkinTotaalScore(c: Pick<Checkin, MetricKey>): number {
  return Math.round((METRIC_KEYS.reduce((s, k) => s + c[k], 0) / 60) * 100)
}

export function aantalDagen(van: string, tot: string): number {
  return Math.max(1, Math.round((new Date(tot).getTime() - new Date(van).getTime()) / 86400000) + 1)
}

// ── Status badge helpers ───────────────────────────────────────────────────

export const VERLOF_STATUS_STIJL: Record<VerlofStatus, { bg: string; color: string; label: string }> = {
  aangevraagd: { bg: '#FAEEDA', color: '#854F0B', label: 'In behandeling' },
  goedgekeurd: { bg: '#E1F5EE', color: '#0F6E56', label: 'Goedgekeurd' },
  afgewezen:   { bg: '#FCEBEB', color: '#A32D2D', label: 'Afgewezen' },
}

export const DECLARATIE_STATUS_STIJL: Record<DeclaratieStatus, { bg: string; color: string; label: string }> = {
  ingediend:   { bg: '#FAEEDA', color: '#854F0B', label: 'In behandeling' },
  goedgekeurd: { bg: '#E1F5EE', color: '#0F6E56', label: 'Goedgekeurd' },
  afgewezen:   { bg: '#FCEBEB', color: '#A32D2D', label: 'Afgewezen' },
}
