// ─── LifeOS — CRM: Postgres-fout → onze reden ───────────────────────────────
// Gedeeld door de twee DB-modules van dit feature (`opslag.ts` én `historie.ts`).
// Taken en notities hebben elk maar één DB-bestand en dragen deze vertaling daar
// lokaal; het CRM heeft er twee (personen + historie), en dan is één bron beter
// dan twee kopieën die gegarandeerd uit elkaar lopen.
//
// PUUR: geen fetch, geen DB, geen React. Zo is de vertaling testbaar zonder
// database (zie `fout.test.ts`).

/** Postgres: unieke index geschonden. */
const UNIEK_GESCHONDEN = '23505'
/** Postgres: check-constraint geschonden — bv. een status buiten de allowlist. */
const CHECK_GESCHONDEN = '23514'
/** Postgres: foreign key geschonden — bv. een persoon die niet (meer) bestaat. */
const FK_GESCHONDEN = '23503'
/** Postgres: tekst die geen geldig type is — bv. 'abc' als uuid. */
const ONLEESBAAR = '22P02'
/** Postgres: ongeldig datum/tijd-formaat — bv. een kapotte `laatste_contact_op`. */
const ONLEESBARE_TIJD = '22007'

export type Reden = 'db' | 'bezet' | 'ongeldig' | 'niet_gevonden'
export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: Reden }

function foutCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  const code = (error as { code: unknown }).code
  return typeof code === 'string' ? code : null
}

/**
 * Postgres-fout → onze reden. Alles wat de gebruiker fout deed wordt 'ongeldig'
 * (→ 400); alleen een echte storing blijft 'db' (→ 502).
 *
 * De FK-, uuid- en tijd-takken staan hier omdat een geraden persoon-id, een
 * onleesbare uuid (`DELETE /crm/personen/abc`) of een kapotte `laatste_contact_op`
 * cliëntfouten zijn, geen serverstoring. Zonder die takken kreeg je een 502 op je
 * eigen typfout — een melding die de schuld op de verkeerde plek legt. Zelfde
 * keuze als `taken/opslag.ts` en `notities/opslag.ts`; de 22007-tak is de extra
 * die dit feature nodig heeft omdat het als enige een vrije tijd-string aanneemt.
 */
export function vertaalFout(error: unknown): Reden {
  const code = foutCode(error)
  if (code === UNIEK_GESCHONDEN) return 'bezet'
  if (code === CHECK_GESCHONDEN) return 'ongeldig'
  if (code === FK_GESCHONDEN) return 'ongeldig'
  if (code === ONLEESBAAR) return 'ongeldig'
  if (code === ONLEESBARE_TIJD) return 'ongeldig'
  return 'db'
}
