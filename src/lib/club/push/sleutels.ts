// ─── Club, push: sleutels en schakelaar uit de omgeving (PUUR) ──────────────
// CLUB_VAPID_PUBLIC_KEY  publieke sleutel, base64url (65 bytes, begint met 0x04)
// CLUB_VAPID_PRIVATE_KEY privesleutel, base64url (32 bytes)
// CLUB_VAPID_SUBJECT     mailto:... (of https://...)
// CLUB_PUSH_ACTIEF       '1' = versturen aan (standaard uit)
// Ontbreekt iets, klopt een sleutel niet of horen ze niet bij elkaar: geen
// push, geen crash. De env komt als argument binnen, zodat het te testen is.

import { createECDH } from 'node:crypto'
import { naarB64u, uitB64u } from './base64url'
import type { VapidSleutels } from './vapid'

type Omgeving = Record<string, string | undefined>

const SUBJECT = /^(mailto:[^\s@]+@[^\s@]+\.[^\s@]+|https:\/\/[^\s]+)$/

/** De VAPID-sleutels, of null als ze ontbreken of niet kloppen. */
export function leesVapidSleutels(env: Omgeving): VapidSleutels | null {
  const publiek = uitB64u(env.CLUB_VAPID_PUBLIC_KEY?.trim() ?? '')
  const ruwePrive = uitB64u(env.CLUB_VAPID_PRIVATE_KEY?.trim() ?? '')
  // Een sleutel die met nul-bytes begint kan korter zijn opgeslagen: aanvullen tot 32.
  const prive = ruwePrive && ruwePrive.length >= 30 && ruwePrive.length < 32 ? Buffer.concat([Buffer.alloc(32 - ruwePrive.length), ruwePrive]) : ruwePrive
  const subject = env.CLUB_VAPID_SUBJECT?.trim() ?? ''
  if (!publiek || !prive || publiek.length !== 65 || publiek[0] !== 0x04 || prive.length !== 32) return null
  if (!SUBJECT.test(subject) || subject.length > 200) return null
  try {
    // Horen ze bij elkaar? De publieke sleutel opnieuw afleiden uit de prive.
    const ecdh = createECDH('prime256v1')
    ecdh.setPrivateKey(prive)
    if (!ecdh.getPublicKey().equals(publiek)) return null
  } catch {
    return null
  }
  return { publiek, prive, subject }
}

/** CLUB_PUSH_ACTIEF === '1'. */
export function pushActief(env: Omgeving): boolean {
  return env.CLUB_PUSH_ACTIEF?.trim() === '1'
}

/**
 * De publieke sleutel voor de browser (applicationServerKey), alleen als push
 * aan staat en de sleutels kloppen. Anders null: dan toont de app geen knop.
 */
export function publiekeSleutelVoorApp(env: Omgeving): string | null {
  if (!pushActief(env)) return null
  const s = leesVapidSleutels(env)
  return s ? naarB64u(s.publiek) : null
}
