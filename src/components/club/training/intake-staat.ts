// ─── De staat van het intakeformulier (client, puur) ───────────────────────

import type { ParqSleutel } from '@/lib/club/training/intake'
import type { Doel, Niveau, Voorkeur, Zone } from '@/lib/club/training/typen'

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
}

export function beginStaat(vandaag: string, medewerkerId: string): IntakeStaat {
  return {
    datum: vandaag, medewerkerId, doelen: [], niveau: null, dagenPerWeek: 3, minutenPerSessie: 60, voorkeuren: ['sportschool'],
    motivatie: '', toestemming: false, blessures: [], blessureToelichting: '', klachten: '', medicatie: '', parqJa: [], parqBeantwoord: [],
    gewicht: '', lengte: '', vet: '', buik: '', hartslag: '', bloeddruk: '', notitie: '',
  }
}

/** Naar de body van POST /api/club/training/intakes. Zonder toestemming gaat er geen gezondheid mee. */
export function naarVerzoek(s: IntakeStaat, lidId: string) {
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

/** Welke stappen zijn ingevuld (voor de voortgang naast het formulier). */
export function stappenKlaar(s: IntakeStaat, heeftLid: boolean) {
  return {
    lid: heeftLid,
    doel: s.doelen.length > 0 && s.niveau !== null,
    beschikbaarheid: s.dagenPerWeek > 0 && s.minutenPerSessie > 0,
    gezondheid: s.toestemming ? s.parqBeantwoord.length > 0 : true,
    metingen: getal(s.gewicht) !== undefined || getal(s.lengte) !== undefined,
  }
}
