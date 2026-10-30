// ─── Club, taken: wie vinkt af als je zelf bent ingelogd (PUUR) ─────────────
// Een ingelogde medewerker hoeft niet eerst "wie vinkt af" te kiezen: de app
// weet al wie het is (opdracht Kane 30-10-2026, duidelijk voor een nieuwe
// werknemer). Een tablet aan de balie zonder eigen login kiest zoals altijd.

import type { Persoon } from './invoer'
import { isMedewerkerSessie, type Wie } from '@/lib/club/rollen/wie'

export interface IkBron extends Pick<Wie, 'rol' | 'profiel'> {
  persoonId: string | null
  naam: string
}

/** De ingelogde medewerker als afvinker, of null (beheerderslogin zonder profiel, Kane). */
export function ikAlsAfvinker(t: IkBron): Persoon | null {
  const naam = t.naam.trim()
  if (!naam) return null
  if (isMedewerkerSessie(t) && t.persoonId) return { wie: naam.slice(0, 80), medewerkerId: t.persoonId }
  if (t.profiel?.id) return { wie: naam.slice(0, 80), medewerkerId: t.profiel.id }
  return null
}
