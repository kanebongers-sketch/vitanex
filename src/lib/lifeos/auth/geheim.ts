// ─── Geheimen vergelijken zonder te lekken ──────────────────────────────────
// Server-only: `node:crypto`. Twee routes hebben geen sessie om tegen te gate'n
// en leunen volledig op een gedeeld geheim in een header — de Telegram-webhook
// en de cron-briefing. Voor allebei is de vergelijking zélf het slot.
//
// WAAROM NIET `===`
//
//   JavaScript's `===` op strings stopt bij het eerste verschillende teken. Hoe
//   langer je gok klopt, hoe langer de vergelijking duurt. Dat verschil is
//   nanoseconden en verdrinkt over het internet vrijwel zeker in netwerkruis —
//   maar "vrijwel zeker" is de verkeerde standaard voor de énige deur van een
//   route die ongevraagd berichten naar Kane's telefoon stuurt en (bij de
//   webhook) autonoom in zijn echte agenda schrijft.
//
//   De juiste vergelijking kost hier één hash. Dat is te goedkoop om over na te
//   denken.
//
// WAAROM EERST HASHEN
//
//   `timingSafeEqual` eist buffers van gelíjke lengte en gooit anders. Zou je de
//   ruwe geheimen vergelijken, dan moest je de lengtes eerst checken — en dát
//   check lekt de lengte van het echte geheim. Door beide naar sha256 te hashen
//   zijn ze altijd 32 bytes, en lekt de vergelijking niets: niet de inhoud, niet
//   de lengte.

import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Constant-tijd vergelijking van twee geheimen.
 *
 * Geeft `false` bij een leeg verwacht geheim: een niet-geconfigureerd slot hoort
 * dicht te zijn, niet open. Die keuze staat hier en niet bij de aanroeper, zodat
 * geen enkele route 'm kan vergeten.
 */
export function geheimGelijk(verwacht: string, gegeven: string | null): boolean {
  if (verwacht.length === 0) return false
  if (gegeven === null || gegeven.length === 0) return false

  const a = createHash('sha256').update(verwacht).digest()
  const b = createHash('sha256').update(gegeven).digest()
  return timingSafeEqual(a, b)
}
