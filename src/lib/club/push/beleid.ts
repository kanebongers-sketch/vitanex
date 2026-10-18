// ─── Club, push: mag deze melding als push naar dit lid? (PUUR) ─────────────
// Alleen met CLUB_PUSH_ACTIEF=1 en kloppende sleutels, nooit naar demo-leden of
// een demo-sportschool, niet als het lid push uitzette en alleen als er een
// abonnement is. Mail-instellingen (CLUB_MAILS_ACTIEF, afmelden voor mail)
// tellen hier niet: push is een eigen kanaal.

import { DEMO_SPORTSCHOOL_ID } from '@/lib/club/meldingen/beleid'

export interface PushOmgeving {
  /** CLUB_PUSH_ACTIEF === '1'. */
  actief: boolean
  /** De VAPID-sleutels zijn er en kloppen. */
  ingesteld: boolean
}

export interface PushOntvanger {
  organisatieId: string
  organisatieDemo: boolean
  lidDemo: boolean
  rijDemo: boolean
  /** false = het lid zette push uit; null = geen voorkeur (aan). */
  push: boolean | null
  abonnementen: number
}

export type PushBeslissing = { ok: true } | { ok: false; reden: string }

export function pushBeslissing(o: PushOntvanger, env: PushOmgeving): PushBeslissing {
  if (!env.actief) return { ok: false, reden: 'Push staat uit (CLUB_PUSH_ACTIEF)' }
  if (!env.ingesteld) return { ok: false, reden: 'Geen VAPID-sleutels ingesteld' }
  if (o.organisatieDemo || o.organisatieId === DEMO_SPORTSCHOOL_ID) return { ok: false, reden: 'Demo-sportschool' }
  if (o.lidDemo || o.rijDemo) return { ok: false, reden: 'Demo-lid' }
  if (o.push === false) return { ok: false, reden: 'Lid heeft push uitgezet' }
  if (o.abonnementen < 1) return { ok: false, reden: 'Geen push-abonnement' }
  return { ok: true }
}
