// ─── Club, Prikbord: "Hoe doe je dit" bij een takenlijst (SERVER-ONLY) ──────
// Een werkwijze kan aan een takenlijst hangen (Afsluitronde hoort bij Sluiten).
// Het dagelijks afvinken blijft in Taken; bij de lijst staat de link naar de
// werkwijze, alleen voor wie het Prikbord ziet.

import type { ClubToegang } from '@/lib/club/toegang'
import { haalWerkwijzeBijLijst } from './opslag'
import { prikbordZichtbaar } from './toegang'

export async function uitlegBijTaken(t: ClubToegang): Promise<ReadonlyMap<string, string>> {
  return prikbordZichtbaar(t) ? haalWerkwijzeBijLijst(t.admin, t.userId) : new Map()
}
