// ─── Coaching-relatie (1-op-1 coach ↔ klant) ────────────────────────────────
// Client-veilige types en labels. Geen server-imports hier — pagina's en
// API-routes delen deze definities. Server-only helpers staan in ./server.ts.
//
// LET OP: dit is de MENSELIJKE coaching-laag (Kane → klant), niet de Vita
// AI-companion in src/lib/coach/. Bewust gescheiden mappen.

export type KoppelStatus = 'uitgenodigd' | 'actief' | 'gepauzeerd' | 'beeindigd'

export interface CoachKlant {
  id: string
  coach_id: string
  klant_id: string
  status: KoppelStatus
  inzage_toestemming: boolean
  sinds: string
  notitie?: string | null
}

export const KOPPEL_STATUS_LABELS: Record<KoppelStatus, string> = {
  uitgenodigd: 'Uitgenodigd',
  actief:      'Actief',
  gepauzeerd:  'Gepauzeerd',
  beeindigd:   'Beëindigd',
}

export const KOPPEL_STATUS_STIJL: Record<KoppelStatus, { bg: string; color: string; label: string }> = {
  uitgenodigd: { bg: 'var(--mf-amber-light)', color: 'var(--mf-amber)', label: 'Uitgenodigd' },
  actief:      { bg: 'var(--mf-green-light)', color: 'var(--mf-green)', label: 'Actief' },
  gepauzeerd:  { bg: 'var(--bg-subtle)',      color: 'var(--text-3)',   label: 'Gepauzeerd' },
  beeindigd:   { bg: 'var(--mf-red-light)',   color: 'var(--mf-red)',   label: 'Beëindigd' },
}

// ─── Klant-overzicht (coach-portaal lijst) ──────────────────────────────────
export interface KlantOverzicht {
  koppeling_id: string
  klant_id: string
  naam: string
  email: string | null
  avatar_url: string | null
  status: KoppelStatus
  inzage_toestemming: boolean
  sinds: string
  laatste_checkin: string | null
  dagen_sinds_checkin: number | null
}

// ─── Klant-detail (welzijnssamenvatting, alleen bij toestemming) ─────────────
export interface KlantWelzijn {
  gemiddelde_scores: Record<string, number>
  checkins_30d: number
  laatste_checkin: string | null
  dagen_sinds_checkin: number | null
  burnout_risico: number | null
  burnout_trending: string | null
  recente_analyses: { datum: string; scores: Record<string, number> | null }[]
}

export interface KlantDetail {
  klant_id: string
  naam: string
  email: string | null
  avatar_url: string | null
  status: KoppelStatus
  inzage_toestemming: boolean
  sinds: string
  notitie: string | null
  // welzijn is null wanneer de klant nog geen inzage heeft gegeven
  welzijn: KlantWelzijn | null
}
