// ─── Club startwizard: een voorbeeld van leden inlezen (PUUR) ───────────────
// Een klein, verzonnen ledenbestand dat door precies dezelfde controle gaat
// als een echt bestand (CSV lezen, kolommen herkennen, rij controleren, plan
// maken). Zo ziet de eigenaar wat er gebeurt voordat hij zijn eigen bestand
// kiest. Er wordt niets opgeslagen: dit draait alleen in de browser.

import { leesCsv } from '@/lib/club/leden/import/csv'
import { IMPORT_VELD_LABEL, ontbrekendeVelden, pasKoppelingToe, raadKoppeling, type ImportVeld } from '@/lib/club/leden/import/kolommen'
import { controleerRij } from '@/lib/club/leden/import/rij'
import { maakPlan, type ImportActie, type ImportRegel } from '@/lib/club/leden/import/plan'

/** Verzonnen namen en adressen op example.com (een domein dat nooit echt bestaat). */
export const DEMO_LEDEN_CSV = [
  'Voornaam;Tussenvoegsel;Achternaam;E-mail;Telefoon;Geboortedatum;Abonnement;Lid sinds',
  'Sanne;de;Vries;sanne.devries@example.com;0612345678;14-03-1994;Onbeperkt;01-02-2024',
  'Mehmet;;Yilmaz;mehmet.yilmaz@example.com;0623456789;02-11-1988;Dal;15-06-2023',
  'Lotte;van;Dijk;lotte.vandijk@example.com;;29-07-2001;Onbeperkt;03-09-2025',
  'Daan;;Peeters;daan.peeters@example;0645678901;11-01-1979;Groepslessen;20-01-2022',
  'Fatima;;El Amrani;fatima.elamrani@example.com;0656789012;31-02-1996;Onbeperkt;07-04-2025',
  'Sanne;de;Vries;sanne.devries@example.com;0612345678;14-03-1994;Onbeperkt;01-02-2024',
  'Joris;;;joris@example.com;0667890123;;Dal;',
].join('\n')

export type DemoUitkomst = ImportActie | 'fout'

export interface DemoRij {
  regel: number
  naam: string
  uitkomst: DemoUitkomst
  /** Waarom de rij niet meekan, of de waarschuwingen (velden die leeg blijven). */
  melding: string | null
}

export interface DemoInlezen {
  /** De kolommen die Club zelf herkende, als label. */
  herkend: string[]
  rijen: DemoRij[]
  telling: Record<DemoUitkomst, number>
}

function namen(veld: ImportVeld[]): string[] {
  return veld.map((v) => IMPORT_VELD_LABEL[v])
}

/** Het voorbeeldbestand door de echte controle; `vandaag` als JJJJ-MM-DD. */
export function demoInlezen(vandaag: string, csv: string = DEMO_LEDEN_CSV): DemoInlezen {
  const tabel = leesCsv(csv)
  const koppeling = raadKoppeling(tabel.koppen)
  const herkend = namen((Object.keys(koppeling) as ImportVeld[]).filter((v) => koppeling[v] !== null))
  const ontbreekt = ontbrekendeVelden(koppeling)
  const goed: ImportRegel[] = []
  const meldingen = new Map<number, string | null>()
  const fouten: DemoRij[] = []
  tabel.rijen.forEach((rij, i) => {
    const regel = tabel.regels[i]
    const uitslag = ontbreekt.length > 0 ? null : controleerRij(pasKoppelingToe(rij, koppeling), vandaag)
    if (!uitslag || !uitslag.ok) {
      fouten.push({ regel, naam: rij.slice(0, 3).filter(Boolean).join(' ') || `Regel ${regel}`, uitkomst: 'fout', melding: uitslag ? uitslag.fout : 'Voornaam of achternaam ontbreekt.' })
      return
    }
    goed.push({ regel, lid: uitslag.lid })
    meldingen.set(regel, uitslag.waarschuwingen.length > 0 ? uitslag.waarschuwingen.join(' ') : null)
  })
  const plan = maakPlan(goed, [], 'voorbeeld')
  const rijen: DemoRij[] = [
    ...plan.rijen.map((r) => ({ regel: r.regel, naam: r.naam, uitkomst: r.actie as DemoUitkomst, melding: r.actie === 'dubbel' ? 'Staat al eerder in het bestand en wordt een keer ingelezen.' : (meldingen.get(r.regel) ?? null) })),
    ...fouten,
  ].sort((a, b) => a.regel - b.regel)
  const telling: Record<DemoUitkomst, number> = { nieuw: 0, bijwerken: 0, gelijk: 0, dubbel: 0, fout: 0 }
  for (const r of rijen) telling[r.uitkomst]++
  return { herkend, rijen, telling }
}
