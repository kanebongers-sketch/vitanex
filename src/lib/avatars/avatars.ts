// ─── Avatars: van pad naar tijdelijke URL ───────────────────────────────────
// De avatars-bucket was public. Public buckets serveren downloads buiten RLS om,
// dus elke pasfoto was permanent op te halen door wie de URL had — en het pad
// was `${userId}/avatar.jpg`, dus wie een user-id kende had de URL. Pasfoto's
// van medewerkers van klantbedrijven, in een product met een anonimiteitsbelofte.
// Zie migratie 047.
//
// De bucket is nu privé. Lezen mag alleen nog binnen je eigen bedrijf, en dat
// wordt door RLS afgedwongen (niet door een route die het per ongeluk vergeet).
// Daarom kan de client zélf signen: Postgres beslist of het mag.
//
// `profiles.avatar_url` bevat sinds 047 een PAD, geen URL. Deze module vertaalt
// dat naar een tijdelijke URL. Oude rijen met een volledige URL blijven werken
// (ze worden ongemoeid doorgegeven) zodat een half-gedeployde staat geen kapotte
// plaatjes geeft — maar op een privébucket levert zo'n oude URL een 400 op, en
// dan valt de Avatar terug op initialen. Zichtbaar suboptimaal, niet stuk.
//
// Waarom batched: een teamlijst rendert tientallen Avatars tegelijk. Eén
// createSignedUrl per stuk is een N+1 over het netwerk. We verzamelen daarom
// alle paden die binnen dezelfde tick gevraagd worden en tekenen ze in één
// aanroep (createSignedUrls, meervoud).

import { supabase } from '@/lib/supabase/supabase'

/** Een uur. Ruim langer dan een paginabezoek, kort genoeg om te verlopen. */
export const GELDIGHEID_SECONDEN = 3600

/** Het pad is afleidbaar uit het user-id: één avatar per gebruiker, vaste naam. */
export function avatarPad(userId: string): string {
  return `${userId}/avatar.jpg`
}

/**
 * Is dit een opslagpad, of een (oude) volledige URL?
 *
 * Alles met een scheme laten we met rust — dat is een rij van vóór 047, of een
 * externe avatar. Een pad tekenen we.
 */
export function isOpslagPad(waarde: string): boolean {
  return waarde.length > 0 && !/^(https?:|data:|blob:)/i.test(waarde)
}

/**
 * Haalt het pad uit een oude publieke avatar-URL.
 *
 * Vorm: https://<project>.supabase.co/storage/v1/object/public/avatars/<pad>?t=123
 * Geeft null als het er geen is — dan blijft de waarde ongemoeid.
 */
export function padUitPubliekeUrl(url: string): string | null {
  const merk = '/object/public/avatars/'
  const i = url.indexOf(merk)
  if (i === -1) return null
  const rest = url.slice(i + merk.length)
  const zonderQuery = rest.split('?')[0]
  return zonderQuery.length > 0 ? zonderQuery : null
}

// ─── De batcher ─────────────────────────────────────────────────────────────

type Tekenaar = (paden: string[]) => Promise<Map<string, string>>

/** Getekende URL's, met het moment waarop we ze niet meer vertrouwen. */
const cache = new Map<string, { url: string; geldigTot: number }>()

let wachtrij = new Set<string>()
let lopend: Promise<void> | null = null

/** Vijf minuten marge: een URL die tijdens het kijken verloopt is een kapot plaatje. */
const MARGE_MS = 5 * 60 * 1000

async function tekenViaSupabase(paden: string[]): Promise<Map<string, string>> {
  const uit = new Map<string, string>()
  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUrls(paden, GELDIGHEID_SECONDEN)

  if (error || !data) return uit

  for (const rij of data) {
    // Supabase geeft per pad een eigen error terug (bijv. object bestaat niet,
    // of RLS weigert). Die slaan we over: geen URL betekent initialen.
    if (rij.error || !rij.signedUrl || !rij.path) continue
    uit.set(rij.path, rij.signedUrl)
  }
  return uit
}

/**
 * Tekent een pad, gebundeld met alles wat in dezelfde tick gevraagd wordt.
 *
 * `tekenaar` is injecteerbaar zodat de bundel-logica te testen is zonder
 * netwerk — hetzelfde patroon als elders in deze codebase.
 */
export async function tekenAvatarUrl(
  pad: string,
  tekenaar: Tekenaar = tekenViaSupabase,
  nu: () => number = Date.now,
): Promise<string | null> {
  const bekend = cache.get(pad)
  if (bekend && bekend.geldigTot > nu()) return bekend.url

  wachtrij.add(pad)

  // Iedereen die in deze tick vraagt, wacht op dezelfde flush.
  lopend ??= Promise.resolve().then(async () => {
    const paden = [...wachtrij]
    wachtrij = new Set()
    lopend = null
    if (paden.length === 0) return

    const getekend = await tekenaar(paden)
    const geldigTot = nu() + GELDIGHEID_SECONDEN * 1000 - MARGE_MS
    for (const [p, url] of getekend) cache.set(p, { url, geldigTot })
  })

  await lopend
  return cache.get(pad)?.url ?? null
}

/**
 * Vergeet een getekende URL.
 *
 * Nodig na een upload: het pad blijft gelijk (`<userId>/avatar.jpg`, upsert),
 * dus zonder dit zou de cache je nog een uur je vórige foto teruggeven. De
 * nieuwe URL krijgt een eigen handtekening en is dus ook een andere URL — de
 * browsercache zit er daardoor niet tussen.
 */
export function vergeetAvatar(pad: string): void {
  cache.delete(pad)
}

/** Alleen voor tests: de module-cache is anders staat tussen tests door. */
export function _leegCache(): void {
  cache.clear()
  wachtrij = new Set()
  lopend = null
}
