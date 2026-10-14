// ─── Fit Factory Club, personeel: snel plannen (PUUR) ───────────────────────
// Een week kopieren en een week als vast patroon opslaan en vooruit zetten.
// Ziek en verlof worden weer de gewone dienst van de vaste persoon; een
// vervangende dienst (na een ziekmelding) gaat niet mee.

import { isoWeekdag, plusDagen } from '@/lib/club/rooster/tijd'
import type { Dienst, NieuweDienst, SjabloonDienst } from './typen'

/** Diensten die het vaste patroon van een week vormen. */
function patroonDiensten(diensten: readonly Dienst[]): Dienst[] {
  return diensten.filter((d) => d.vervangtId === null)
}

/** De diensten van een week verschoven met een aantal dagen, als nieuwe gewone diensten. */
export function kopieerDiensten(diensten: readonly Dienst[], dagen: number): NieuweDienst[] {
  return patroonDiensten(diensten).map((d) => ({
    datum: plusDagen(d.datum, dagen),
    begin: d.begin,
    eind: d.eind,
    medewerkerId: d.medewerkerId,
    soortId: d.soortId,
    notitie: d.notitie,
  }))
}

/** Een week als sjabloon (weekdag in plaats van datum). */
export function sjabloonUitWeek(diensten: readonly Dienst[]): SjabloonDienst[] {
  return patroonDiensten(diensten)
    .map((d) => ({ weekdag: isoWeekdag(d.datum), begin: d.begin, eind: d.eind, medewerkerId: d.medewerkerId, soortId: d.soortId, notitie: d.notitie }))
    .sort((a, b) => a.weekdag - b.weekdag || a.begin.localeCompare(b.begin))
}

/** Een sjabloon toegepast op een rij weken (maandagen). */
export function sjabloonToepassen(sjabloon: readonly SjabloonDienst[], maandagen: readonly string[]): NieuweDienst[] {
  return maandagen.flatMap((maandag) =>
    sjabloon.map((s) => ({
      datum: plusDagen(maandag, s.weekdag - 1),
      begin: s.begin,
      eind: s.eind,
      medewerkerId: s.medewerkerId,
      soortId: s.soortId,
      notitie: s.notitie,
    })),
  )
}

/** De maandagen vanaf een maandag, n weken lang. */
export function wekenVanaf(maandag: string, aantal: number): string[] {
  return Array.from({ length: Math.max(0, aantal) }, (_, i) => plusDagen(maandag, i * 7))
}

/** Laat nieuwe diensten weg die precies gelijk zijn aan een bestaande (dubbel toepassen). */
export function zonderDubbele(nieuw: readonly NieuweDienst[], bestaand: readonly Pick<Dienst, 'datum' | 'begin' | 'eind' | 'medewerkerId'>[]): NieuweDienst[] {
  const sleutel = (d: Pick<Dienst, 'datum' | 'begin' | 'eind' | 'medewerkerId'>) => `${d.datum}|${d.begin}|${d.eind}|${d.medewerkerId ?? ''}`
  const er = new Set(bestaand.map(sleutel))
  return nieuw.filter((d) => !er.has(sleutel(d)))
}
