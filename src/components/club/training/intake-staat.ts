// ─── De staat van het intakeformulier (client, puur) ───────────────────────

import type { ParqSleutel } from '@/lib/club/training/intake'
import type { Doel, Niveau, Voorkeur, Zone } from '@/lib/club/training/typen'
import { isLeeg, type EigenWaarde } from '@/lib/club/intakevragen/eigen'
import { isEigen, type IntakeVraag } from '@/lib/club/intakevragen/soorten'
import { PARQ_PREFIX } from '@/lib/club/intakevragen/kern'

export interface IntakeStaat {
  datum: string
  medewerkerId: string
  doelen: Doel[]
  niveau: Niveau | null
  dagenPerWeek: number
  minutenPerSessie: number
  voorkeuren: Voorkeur[]
  motivatie: string
  toestemming: boolean
  blessures: Zone[]
  blessureToelichting: string
  klachten: string
  medicatie: string
  parqJa: ParqSleutel[]
  parqBeantwoord: ParqSleutel[]
  gewicht: string
  lengte: string
  vet: string
  buik: string
  hartslag: string
  bloeddruk: string
  notitie: string
  /** Antwoorden op de eigen vragen van de sportschool, per vraag-id. */
  eigen: Record<string, EigenWaarde>
}

export function beginStaat(vandaag: string, medewerkerId: string): IntakeStaat {
  return {
    datum: vandaag, medewerkerId, doelen: [], niveau: null, dagenPerWeek: 3, minutenPerSessie: 60, voorkeuren: ['sportschool'],
    motivatie: '', toestemming: false, blessures: [], blessureToelichting: '', klachten: '', medicatie: '', parqJa: [], parqBeantwoord: [],
    gewicht: '', lengte: '', vet: '', buik: '', hartslag: '', bloeddruk: '', notitie: '', eigen: {},
  }
}

/** Alleen ingevulde antwoorden op actieve eigen vragen; gezondheid alleen met toestemming. */
export function eigenVoorVerzoek(s: IntakeStaat, vragen: readonly IntakeVraag[]): Record<string, EigenWaarde> {
  const uit: Record<string, EigenWaarde> = {}
  for (const v of vragen) {
    const w = s.eigen[v.id]
    if (!v.actief || !isEigen(v) || isLeeg(w) || (v.gezondheid && !s.toestemming)) continue
    uit[v.id] = w
  }
  return uit
}

/** Naar de body van POST /api/club/training/intakes. Zonder toestemming gaat er geen gezondheid mee. */
export function naarVerzoek(s: IntakeStaat, lidId: string, vragen: readonly IntakeVraag[] = []) {
  return {
    lidId,
    datum: s.datum,
    medewerkerId: s.medewerkerId || null,
    toestemmingGezondheid: s.toestemming,
    antwoorden: {
      doelen: s.doelen,
      niveau: s.niveau,
      dagenPerWeek: s.dagenPerWeek,
      minutenPerSessie: s.minutenPerSessie,
      voorkeuren: s.voorkeuren,
      motivatie: s.motivatie,
      gezondheid: s.toestemming
        ? { blessures: s.blessures, blessureToelichting: s.blessureToelichting, klachten: s.klachten, medicatie: s.medicatie, parqJa: s.parqJa }
        : null,
      eigen: eigenVoorVerzoek(s, vragen),
    },
    metingen: {
      gewicht_kg: s.gewicht, lengte_cm: s.lengte, vetpercentage: s.vet, buikomtrek_cm: s.buik,
      ...(s.toestemming ? { rusthartslag: s.hartslag, bloeddruk: s.bloeddruk } : {}),
    },
    notitie: s.notitie,
  }
}

const getal = (t: string) => {
  const n = Number(t.replace(',', '.'))
  return t.trim() !== '' && Number.isFinite(n) ? n : undefined
}

export function leesGetal(t: string): number | undefined {
  return getal(t)
}

/** Is deze vraag ingevuld in het formulier? */
export function isBeantwoord(v: IntakeVraag, s: IntakeStaat): boolean {
  if (isEigen(v)) return !isLeeg(s.eigen[v.id])
  const sleutel = v.sleutel ?? ''
  if (sleutel.startsWith(PARQ_PREFIX)) return (s.parqBeantwoord as readonly string[]).includes(sleutel.slice(PARQ_PREFIX.length))
  switch (sleutel) {
    case 'doelen': return s.doelen.length > 0
    case 'niveau': return s.niveau !== null
    case 'dagen_per_week':
    case 'minuten_per_sessie': return true
    case 'voorkeuren': return s.voorkeuren.length > 0
    case 'motivatie': return s.motivatie.trim() !== ''
    case 'blessures': return s.blessures.length > 0
    case 'blessure_toelichting': return s.blessureToelichting.trim() !== ''
    case 'klachten': return s.klachten.trim() !== ''
    case 'medicatie': return s.medicatie.trim() !== ''
    default: return false
  }
}

/** Zichtbaar in het formulier: een gezondheidsvraag alleen met toestemming. */
export function isZichtbaar(v: IntakeVraag, s: Pick<IntakeStaat, 'toestemming'>): boolean {
  return v.actief && (!v.gezondheid || s.toestemming)
}

/** De eerste verplichte vraag die nog open staat, of null. */
export function eersteOpen(vragen: readonly IntakeVraag[], s: IntakeStaat): IntakeVraag | null {
  return vragen.find((v) => v.verplicht && isZichtbaar(v, s) && !isBeantwoord(v, s)) ?? null
}

/** Een sectie is klaar als alle zichtbare verplichte vragen en minstens een vraag zijn ingevuld. */
export function sectieKlaar(vragen: readonly IntakeVraag[], s: IntakeStaat): boolean {
  const zichtbaar = vragen.filter((v) => isZichtbaar(v, s))
  if (zichtbaar.length === 0) return true
  return zichtbaar.every((v) => !v.verplicht || isBeantwoord(v, s)) && zichtbaar.some((v) => isBeantwoord(v, s))
}

export function metingenKlaar(s: IntakeStaat): boolean {
  return getal(s.gewicht) !== undefined || getal(s.lengte) !== undefined
}
