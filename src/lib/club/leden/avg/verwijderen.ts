// ─── Club, AVG: een lid verwijderen in twee stappen (PUUR) ──────────────────
// Het recht op verwijdering (art. 17 AVG). Stap 1: het lid "wordt verwijderd"
// (30 dagen; niet meer inloggen of boeken, de sportschool kan terugdraaien).
// Stap 2: definitief, door de database-functie club_lid_definitief_verwijderen
// (migratie 429), elke nacht via pg_cron.
//
// Wie mag verwijderen (besluit, simpelste veilige keuze): alleen Kane en de
// eigenaar. Een clubmanager niet, ook niet met het onderdeel Leden: verwijderen
// is onomkeerbaar na 30 dagen en raakt de cijfers en de AVG-plicht van de
// sportschool. Daarvoor is de eigenaar verantwoordelijk (verwerkingsverantwoordelijke).
// Een medewerker nooit. Inzage (downloaden) mag iedereen die Leden mag.

import type { WieMag } from '@/lib/club/beheerders/rechten'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LIDKAART_BLOKKEN } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'

/** Hoeveel dagen een aanvraag terug te draaien is. Ook in migratie 429 (standaard p_dagen). */
export const VERWIJDER_DAGEN = 30

export function magLidVerwijderen(t: WieMag): boolean {
  return t.isPlatformEigenaar || t.rol === 'eigenaar'
}

/** Voor de vergelijking: kleine letters, zonder accenten en dubbele spaties. */
function schoon(tekst: string): string {
  return tekst
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Heeft de gebruiker de volledige naam van het lid overgetypt? Hoofdletters en spaties tellen niet. */
export function naamKlopt(invoer: unknown, lid: { voornaam: string; achternaam: string }): boolean {
  if (typeof invoer !== 'string' || invoer.length > 200) return false
  const verwacht = schoon(`${lid.voornaam} ${lid.achternaam}`)
  return verwacht.length > 0 && schoon(invoer) === verwacht
}

export interface Verwijderverzoek {
  aangevraagdOp: string
  definitiefOp: string
  aangevraagdDoor: string
}

/** Systeemgrens: een rij uit club_lid_verwijderingen, of null. */
export function verzoekUitRij(rij: unknown): Verwijderverzoek | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  const geldig = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
  if (!geldig(r.aangevraagd_op) || !geldig(r.definitief_op)) return null
  return {
    aangevraagdOp: r.aangevraagd_op,
    definitiefOp: r.definitief_op,
    aangevraagdDoor: typeof r.aangevraagd_door === 'string' && r.aangevraagd_door.trim() ? r.aangevraagd_door : 'Onbekend',
  }
}

/** Hele dagen tot het definitieve verwijderen (nooit onder 0). */
export function dagenTot(definitiefOp: string, nu: Date): number {
  const ms = Date.parse(definitiefOp) - nu.getTime()
  return Number.isNaN(ms) ? 0 : Math.max(0, Math.ceil(ms / 86_400_000))
}


/** "Wordt over 12 dagen verwijderd (op 30 oktober 2026)." */
export function verzoekTekst(v: Verwijderverzoek, nu: Date, taal: Taal = 'nl'): string {
  const t = LIDKAART_BLOKKEN[taal].avg
  const dagen = dagenTot(v.definitiefOp, nu)
  const wanneer = dagen === 0 ? t.vannacht : dagen === 1 ? t.morgen : t.overDagen(dagen)
  return t.verzoek(wanneer, formatDatum(v.definitiefOp, taal, 'lang'))
}

/** De fout van de database-functie als nette melding voor de API. */
export function aanvraagFout(code: string | undefined): { status: number; fout: string } {
  if (code === '23505') return { status: 409, fout: 'Voor dit lid loopt al een verzoek tot verwijderen.' }
  if (code === 'P0002') return { status: 404, fout: 'Dit lid bestaat niet (meer).' }
  if (code === 'AYG01') return { status: 409, fout: 'Dit lid heeft nog een lopend contract of een openstaande betaling. Los dat eerst op.' }
  return { status: 500, fout: 'Verwijderen aanvragen lukte niet. Probeer het opnieuw.' }
}
