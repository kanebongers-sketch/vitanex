// ─── Club, Prikbord: gedeeld door de API-routes (SERVER-ONLY) ───────────────
// Na de poort (vereisClubToegang, met rollen v2 via rollen/api.ts): het
// niveau dat een actie vraagt, en foutmeldingen in de taal van Club.

import type { NextRequest, NextResponse } from 'next/server'
import { clubFout, type ClubToegang } from '@/lib/club/toegang'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'
import { minstens, type Niveau } from '@/lib/club/rollen/typen'
import { isEigenaar, isMedewerkerSessie } from '@/lib/club/rollen/wie'
import { prikbordNiveau } from './toegang'
import type { Schrijver } from './invoer'

export type PrikbordFouten = Awaited<ReturnType<typeof prikbordFouten>>

export async function prikbordFouten() {
  return (await clubTekst(PRIKBORD)).fouten
}

/**
 * Na vereisClubToegang: heeft deze persoon minstens dit niveau op het Prikbord?
 * Anders een 404 (wat niet mag, bestaat niet); null = door.
 */
export async function prikbordNiveauFout(t: ClubToegang, drempel: Niveau): Promise<NextResponse | null> {
  return minstens(prikbordNiveau(t), drempel) ? null : clubFout((await prikbordFouten()).nietGevonden, 404)
}

/** Wie schrijft. Alleen een medewerker kan een deel van de vestigingen hebben (zonder vinkje alle vestigingen). */
export function schrijverVan(t: ClubToegang): Schrijver {
  const alleVestigingen = !isMedewerkerSessie(t) || t.profiel?.alleVestigingen === true
  return { eigenaar: isEigenaar(t), vestigingen: t.vestigingen.map((v) => v.sleutel), alleVestigingen }
}

/** De body als JSON, of null. */
export async function leesBody(req: NextRequest): Promise<unknown> {
  return req.json().catch(() => null)
}
