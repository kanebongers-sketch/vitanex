// ─── Coaching-uitnodigingen — client-veilige types & labels ─────────────────
// Gedeeld door pagina's en API-routes. GEEN server-imports (de server-only
// helpers, incl. Node's crypto, staan in ./uitnodiging-server.ts). Bestaat als
// aparte sibling zodat client-componenten nooit het server-bestand aanraken —
// consistent met taken/content/training/voeding/traject.

export type UitnodigingStatus = 'open' | 'geaccepteerd' | 'ingetrokken' | 'verlopen'

export interface CoachingUitnodiging {
  id: string
  email: string
  naam: string | null
  status: UitnodigingStatus
  aangemaakt_op: string | null
  verloopt_op: string
  geaccepteerd_op: string | null
}

export const UITNODIGING_STATUS_STIJL: Record<UitnodigingStatus, { bg: string; color: string; label: string }> = {
  open:         { bg: 'var(--mf-amber-light)', color: 'var(--mf-amber)', label: 'Openstaand' },
  geaccepteerd: { bg: 'var(--mf-green-light)', color: 'var(--mf-green)', label: 'Geaccepteerd' },
  ingetrokken:  { bg: 'var(--bg-subtle)',      color: 'var(--text-3)',   label: 'Ingetrokken' },
  verlopen:     { bg: 'var(--mf-red-light)',   color: 'var(--mf-red)',   label: 'Verlopen' },
}
