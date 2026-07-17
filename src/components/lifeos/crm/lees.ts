// ─── LifeOS — CRM: het API-antwoord narrowen ────────────────────────────────
// De server geeft camelCase JSON terug (zie het API-contract). Hier lezen we dat
// antwoord uit — geen cast: een server die iets anders teruggeeft dan afgesproken
// levert `null` op (→ nette fout via `haalJson`), geen half object dat drie
// componenten verderop crasht. Zelfde opzet als `taken.ts` → `leesTaakJson`.
//
// De regel wát een geldige status/groep is, hoort in `crm.ts` (DÉ bron). Hier
// leunen we daarop (`isGroep`, `HISTORIE_SOORTEN`) en herhalen we niets.

import { getalOfNull, isObject, tekstOfNull } from '@/lib/lifeos/api/http'
import {
  HISTORIE_SOORTEN,
  isGroep,
  type HistorieItem,
  type HistorieSoort,
  type Persoon,
} from '@/lib/lifeos/crm/crm'

function isHistorieSoort(v: unknown): v is HistorieSoort {
  return typeof v === 'string' && (HISTORIE_SOORTEN as readonly string[]).includes(v)
}

/** Eén persoon zoals hij over de draad komt. */
export function leesPersoonJson(ruw: unknown): Persoon | null {
  if (!isObject(ruw)) return null

  const id = tekstOfNull(ruw.id)
  const naam = tekstOfNull(ruw.naam)
  const status = tekstOfNull(ruw.status)
  const aangemaaktOp = tekstOfNull(ruw.aangemaaktOp)
  if (id === null || naam === null || status === null || aangemaaktOp === null) return null
  if (!isGroep(ruw.groep)) return null

  return {
    id,
    naam,
    groep: ruw.groep,
    status,
    // Sortering ordent alleen de kolom. Ontbreekt hij, toon de persoon dan tóch
    // (op 0) i.p.v. de hele lijst te laten vallen: een ontbrekende volgorde is
    // geen ontbrekend mens.
    sortering: getalOfNull(ruw.sortering) ?? 0,
    followUpDatum: tekstOfNull(ruw.followUpDatum),
    telefoon: tekstOfNull(ruw.telefoon),
    email: tekstOfNull(ruw.email),
    bijzonderheden: tekstOfNull(ruw.bijzonderheden),
    laatsteContactOp: tekstOfNull(ruw.laatsteContactOp),
    aangemaaktOp,
  }
}

/** Het antwoord van `GET /api/lifeos/crm/personen`. */
export function leesPersonenAntwoord(ruw: unknown): Persoon[] | null {
  if (!isObject(ruw) || !Array.isArray(ruw.personen)) return null
  const personen = ruw.personen.map(leesPersoonJson)
  if (personen.some((p) => p === null)) return null
  return personen.filter((p): p is Persoon => p !== null)
}

/** Het antwoord van `POST` en `PATCH` op een persoon: `{ persoon }`. */
export function leesPersoonAntwoord(ruw: unknown): Persoon | null {
  if (!isObject(ruw)) return null
  return leesPersoonJson(ruw.persoon)
}

/** Eén historie-item zoals het over de draad komt. */
export function leesHistorieItemJson(ruw: unknown): HistorieItem | null {
  if (!isObject(ruw)) return null

  const id = tekstOfNull(ruw.id)
  const aangemaaktOp = tekstOfNull(ruw.aangemaaktOp)
  if (id === null || aangemaaktOp === null) return null
  if (!isHistorieSoort(ruw.soort)) return null

  return {
    id,
    soort: ruw.soort,
    vanStatus: tekstOfNull(ruw.vanStatus),
    naarStatus: tekstOfNull(ruw.naarStatus),
    notitie: tekstOfNull(ruw.notitie),
    aangemaaktOp,
  }
}

/** Het antwoord van `GET .../historie`: `{ historie }` (nieuwste eerst). */
export function leesHistorieAntwoord(ruw: unknown): HistorieItem[] | null {
  if (!isObject(ruw) || !Array.isArray(ruw.historie)) return null
  const items = ruw.historie.map(leesHistorieItemJson)
  if (items.some((i) => i === null)) return null
  return items.filter((i): i is HistorieItem => i !== null)
}

/** Het antwoord van `POST .../historie`: `{ item }`. */
export function leesHistorieItemAntwoord(ruw: unknown): HistorieItem | null {
  if (!isObject(ruw)) return null
  return leesHistorieItemJson(ruw.item)
}
