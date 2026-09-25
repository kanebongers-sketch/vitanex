// ─── LifeOS — PT-klanten: wie telt mee, en klopt de CRM-status? (puur) ─────
// Twee vragen die de weekplanning en het afhaak-signaal eerlijk houden:
//
//   1. Wie telt mee voor de weekplanning? Niet iedereen in de groep PT-klanten is
//      een lopende klant: een prospect die je nog moet benaderen hoort geen
//      "moet nog ingepland" te geven, en een klant die je bewust op Inactief zette
//      hoort nooit als "afgehaakt" terug te komen — dat weet je al.
//   2. Klopt de status? Staat iemand nog als prospect (Moet benaderen, Benaderd,
//      …) terwijl je agenda laat zien dat hij al traint, dan loopt je CRM achter.
//      LifeOS STELT een correctie VOOR; het verandert je CRM nooit zelf.

import type { Persoon } from '@/lib/lifeos/crm/crm'
import { statusDef } from '@/lib/lifeos/crm/crm'
import { matchPersoonInTitel, woordTokens } from '@/lib/lifeos/crm/agenda-match'
import { matchtPtSessie, type PtEvent, type PtKlant } from './pt-klant'

const ACTIEF = 'actieve_klant'
const INACTIEF = 'inactief'

/** Zoveel sessies in het venster maken een "prospect" aantoonbaar een klant (1 = kan een intake zijn). */
export const HINT_MIN_SESSIES = 2

/**
 * Telt deze PT-klant mee voor de weekplanning (en dus voor afhaak)?
 *   Actieve klant            → ja.
 *   Inactief                 → nooit (bewust gestopt; geen alarm, geen afhaak).
 *   Een pipeline-status      → alleen als je een abonnement instelde: dan heb je
 *                              een cadans gekozen en is het in de praktijk een klant.
 */
export function telMeeVoorPlanning(p: Pick<Persoon, 'status' | 'abonnement'>): boolean {
  if (p.status === ACTIEF) return true
  if (p.status === INACTIEF) return false
  return p.abonnement !== null
}

/** De PT-klanten die meetellen, in de vorm die de PT-logica verwacht. */
export function ptKlantenUit(personen: readonly Persoon[]): PtKlant[] {
  return personen
    .filter((p) => p.groep === 'pt_klant' && telMeeVoorPlanning(p))
    .map((p) => ({
      id: p.id,
      naam: p.naam,
      email: p.email,
      abonnement: p.abonnement,
      duo: p.duo,
      locatie: p.locatie,
      vakantieTot: p.vakantieTot,
    }))
}

/** Eén voorstel: deze persoon traint al, maar staat nog op een pipeline-status. */
export interface PtStatusHint {
  id: string
  naam: string
  /** De huidige status-sleutel, bv. 'moet_benaderen'. */
  status: string
  /** De leesbare statusnaam, bv. "Moet benaderen". */
  statusLabel: string
  /** Aantal PT-sessies in het venster tot nu. */
  sessies: number
}

/**
 * Wie traint al (≥ HINT_MIN_SESSIES sessies tot nu, in `events`) maar staat niet op
 * Actieve klant of Inactief? Meeste sessies eerst. Toekomstige boekingen tellen
 * niet mee: "traint al" gaat over wat er gebeurd is.
 */
export function bepaalStatusHints(
  personen: readonly Persoon[],
  events: readonly PtEvent[],
  nu: Date,
): PtStatusHint[] {
  const nuMs = nu.getTime()
  // Álle CRM-namen: een duo-titel hoort bij het duo (wie de status ook heeft), en
  // een voornaam telt alleen als niemand anders in je CRM zo heet.
  const namen = personen.map((p) => p.naam)
  const uit: PtStatusHint[] = []

  for (const p of personen) {
    if (p.groep !== 'pt_klant' || p.status === ACTIEF || p.status === INACTIEF) continue
    const sessies = events.filter((e) => {
      const t = new Date(e.startOp).getTime()
      return !Number.isNaN(t) && t <= nuMs && matchtPtSessie(e.titel, p.naam, namen)
    }).length
    if (sessies < HINT_MIN_SESSIES) continue
    uit.push({
      id: p.id,
      naam: p.naam,
      status: p.status,
      statusLabel: statusDef('pt_klant', p.status)?.label ?? p.status,
      sessies,
    })
  }

  return uit.sort((a, b) => b.sessies - a.sessies || a.naam.localeCompare(b.naam, 'nl'))
}

// ─── PT-sessies met iemand die niet in je CRM staat ─────────────────────────
// "Darren PT" in je agenda, maar geen Darren in je CRM: die klant is onzichtbaar
// voor je weekplanning, het afhaak-signaal en de categorieën. We melden het, zodat
// je 'm kunt toevoegen. Alleen als er na het wegstrepen van vaste woorden (PT,
// jouw naam, locaties, "sessie"…) nog iets naam-achtigs overblijft — een kale
// "PT Budel" is geen onbekende persoon.

const GEEN_NAAM = new Set([
  'pt', 'kane', 'sessie', 'training', 'trainen', 'les', 'duo', 'intake', 'proefles', 'proeftraining',
  'coachgesprek', 'gesprek', 'budel', 'bergeijk', 'someren', 'en', 'met', 'van', 'de', 'het',
])

export interface OnbekendePtSessie {
  /** De titel zoals hij het laatst in je agenda stond, bv. "Darren PT". */
  titel: string
  aantal: number
  /** ISO-moment van de laatste keer. */
  laatsteOp: string
}

export function bepaalOnbekendePtSessies(
  personen: readonly Persoon[],
  events: readonly PtEvent[],
  nu: Date,
): OnbekendePtSessie[] {
  const nuMs = nu.getTime()
  const perSleutel = new Map<string, OnbekendePtSessie>()

  for (const e of events) {
    const t = new Date(e.startOp).getTime()
    if (Number.isNaN(t) || t > nuMs || !e.titel) continue
    const tokens = woordTokens(e.titel)
    if (!tokens.includes('pt')) continue
    const rest = tokens.filter((w) => !GEEN_NAAM.has(w))
    if (rest.length === 0) continue
    if (matchPersoonInTitel(e.titel, personen).soort !== 'geen') continue

    const sleutel = rest.join(' ')
    const bekend = perSleutel.get(sleutel)
    if (!bekend) {
      perSleutel.set(sleutel, { titel: e.titel, aantal: 1, laatsteOp: e.startOp })
    } else {
      bekend.aantal += 1
      if (e.startOp > bekend.laatsteOp) {
        bekend.laatsteOp = e.startOp
        bekend.titel = e.titel
      }
    }
  }

  return [...perSleutel.values()].sort((a, b) => b.aantal - a.aantal || (a.laatsteOp < b.laatsteOp ? 1 : -1))
}

// ─── Mogelijke typfout in een klantnaam ─────────────────────────────────────
// "Kevnin" in je agenda telt niet als Kevins sessie — zijn weekstatus zegt dan
// "moet nog ingepland" terwijl hij gewoon komt. We vragen "bedoel je Kevin?"; we
// passen niets zelf aan. Streng om vals alarm te voorkomen: alleen een kale naam
// (na wegstrepen van PT/locatie/vaste woorden precies één woord van ≥ 4 letters),
// die géén CRM-naam is, en die op precies één letter na (ontbrekend, extra, anders
// of omgewisseld) de voornaam van precies één PT-klant is.

/** Damerau-Levenshtein ≤ 1: één invoeging, weglating, vervanging of omwisseling. */
export function scheeltEenLetter(a: string, b: string): boolean {
  if (a === b) return false
  if (Math.abs(a.length - b.length) > 1) return false
  if (a.length === b.length) {
    const verschil: number[] = []
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) verschil.push(i)
    if (verschil.length === 1) return true
    return (
      verschil.length === 2 &&
      verschil[1] === verschil[0] + 1 &&
      a[verschil[0]] === b[verschil[1]] &&
      a[verschil[1]] === b[verschil[0]]
    )
  }
  const [kort, lang] = a.length < b.length ? [a, b] : [b, a]
  for (let i = 0; i < lang.length; i++) {
    if (lang.slice(0, i) + lang.slice(i + 1) === kort) return true
  }
  return false
}

export interface MogelijkeTypfout {
  /** De titel zoals hij in je agenda staat, bv. "Kevnin". */
  titel: string
  /** De PT-klant die waarschijnlijk bedoeld is. */
  bedoeld: string
  /** ISO-moment van de (eerstvolgende of laatste) afspraak met deze titel. */
  op: string
}

export function bepaalTypfouten(personen: readonly Persoon[], events: readonly PtEvent[]): MogelijkeTypfout[] {
  const bekendeWoorden = new Set(personen.flatMap((p) => woordTokens(p.naam)))
  const klanten = personen.filter((p) => p.groep === 'pt_klant')
  const perTitel = new Map<string, MogelijkeTypfout>()

  for (const e of events) {
    if (!e.titel) continue
    const rest = woordTokens(e.titel).filter((w) => !GEEN_NAAM.has(w))
    if (rest.length !== 1) continue
    const woord = rest[0]
    if (woord.length < 4 || bekendeWoorden.has(woord)) continue

    const kandidaten = klanten.filter((k) => {
      const voornaam = woordTokens(k.naam)[0]
      return voornaam !== undefined && scheeltEenLetter(woord, voornaam)
    })
    if (kandidaten.length !== 1) continue

    const sleutel = e.titel.trim().toLowerCase()
    if (!perTitel.has(sleutel)) perTitel.set(sleutel, { titel: e.titel.trim(), bedoeld: kandidaten[0].naam, op: e.startOp })
  }
  return [...perTitel.values()]
}
