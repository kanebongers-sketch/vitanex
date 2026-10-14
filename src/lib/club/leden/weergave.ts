// ─── Fit Factory Club: hoe leden eruitzien (PUUR) ───────────────────────────
// Welke chip-kleur bij welke status. Groen = goed, koraal = let op, grijs = uit.
// Amber blijft voor de hoofdactie.

import type { LidStatus } from '@/lib/club/gedeeld/lid'
import type { BehoudLabel } from './behoud'
import type { ReserveringStatus } from './rijen'

export const STATUS_CHIP: Record<LidStatus, string> = {
  actief: 'club-chip--ok',
  proef: 'club-chip--info',
  opgezegd: 'club-chip--let-op',
  gepauzeerd: 'club-chip--uit',
  gestopt: 'club-chip--uit',
}

export const BEHOUD_CHIP: Record<BehoudLabel, string> = {
  goed: 'club-chip--ok',
  let_op: 'club-leden-chip--let-op',
  risico: 'club-chip--let-op',
}

export const RESERVERING_CHIP: Record<ReserveringStatus, string> = {
  geboekt: 'club-chip--info',
  wachtlijst: 'club-chip--uit',
  geannuleerd: 'club-chip--uit',
  aanwezig: 'club-chip--ok',
  no_show: 'club-chip--let-op',
}
