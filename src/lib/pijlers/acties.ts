// ─── Eerlijke, concrete acties per pijler ───────────────────────────────────
// Gebruikt door Home (Today's Focus + Daily Challenge), de pijler-detailpagina's
// en Vita. Geen verzonnen cijfers — alleen algemeen geldende, doe-bare tips.
//
// Waarom meerdere challenges per pijler: één vaste zin is geen loop maar een
// poster. Wie chronisch slecht slaapt zag anders maandenlang exact dezelfde
// regel. De rotatie is DETERMINISTISCH op de dag — geen willekeur, want dan
// verspringt de tekst bij elke refresh en voelt de app kapot.
import type { PijlerKey } from './pijlers'

export interface PijlerActie {
  /** Korte hefboom-tip (waarom deze pijler beweegt). */
  tip: string
  /** Concrete dag-uitdagingen; roteert per dag. Minimaal één. */
  challenges: readonly [string, ...string[]]
  /** Waar de gebruiker naartoe gaat om te loggen/handelen. */
  href: string
  /** Label van die actie-knop. */
  actie: string
}

export const PIJLER_ACTIE: Record<PijlerKey, PijlerActie> = {
  energie: {
    tip: 'Daglicht, water en even bewegen: drie kleine dingen die je energie door de dag dragen.',
    challenges: [
      'Pak vandaag 10 minuten daglicht, het liefst voor 10:00.',
      'Drink een glas water voor je eerste koffie.',
      'Sta elk uur even op en rek je uit.',
      'Loop je eerste telefoongesprek van vandaag staand of buiten.',
    ],
    href: '/stemming',
    actie: 'Log je energie',
  },
  slaap: {
    tip: 'Een avond eerder naar bed is klein. Het patroon eromheen doet het werk.',
    challenges: [
      'Ga vanavond 30 minuten eerder naar bed dan gisteren.',
      'Leg je telefoon het laatste half uur voor het slapen weg.',
      'Sta morgen op je normale tijd op, ook als je later inslaapt.',
      'Drink na 16:00 geen koffie meer.',
      'Maak je slaapkamer vanavond een graad koeler en donkerder.',
    ],
    href: '/slaap',
    actie: 'Log je slaap',
  },
  stress: {
    tip: 'Een korte pauze onderbreekt de spanning. Meerdere korte pauzes houden dat vol.',
    challenges: [
      'Neem vandaag 3 minuten om rustig te ademen.',
      'Plan een pauze van 5 minuten zonder scherm.',
      'Schrijf op wat nu het zwaarst weegt. Een zin is genoeg.',
      'Zeg vandaag nee tegen iets kleins.',
    ],
    href: '/ademhaling',
    actie: 'Ademoefening',
  },
  stemming: {
    tip: 'Benoemen wat je voelt geeft je er grip op en maakt je patroon zichtbaar.',
    challenges: [
      'Schrijf 1 ding op waar je dankbaar voor bent.',
      'Stuur iemand een bericht met wat je in ze waardeert.',
      'Benoem in 1 woord hoe je je nu voelt, zonder oordeel.',
      'Doe vandaag 1 ding puur omdat je het leuk vindt.',
    ],
    href: '/stemming',
    actie: 'Log je stemming',
  },
  beweging: {
    tip: 'Bewegen hoeft niet groot te zijn. Elke stap telt mee.',
    challenges: [
      'Loop vandaag 15 minuten achter elkaar.',
      'Neem de trap in plaats van de lift.',
      'Loop een blokje om na het eten.',
      'Zet 10 minuten muziek op en beweeg gewoon.',
    ],
    href: '/sport',
    actie: 'Log je beweging',
  },
  voeding: {
    tip: 'Drinken lukt het makkelijkst als je het koppelt aan iets dat je toch al doet.',
    challenges: [
      'Drink je eerste glas water binnen 30 minuten na het opstaan.',
      'Voeg bij 1 maaltijd iets groens toe.',
      'Eet vandaag 1 maaltijd zonder scherm erbij.',
      'Zet een fles water binnen handbereik op je bureau.',
    ],
    href: '/voeding',
    actie: 'Log je voeding',
  },
}

/**
 * De challenge van vandaag voor een pijler. Deterministisch: dezelfde dag geeft
 * dezelfde challenge (stabiel bij refresh), maar morgen is het een andere.
 */
export function challengeVoorVandaag(key: PijlerKey, datum: Date = new Date()): string {
  const lijst = PIJLER_ACTIE[key].challenges
  // Dagnummer sinds epoch — wisselt om middernacht, niet per render.
  const dagNummer = Math.floor(datum.getTime() / 86_400_000)
  return lijst[dagNummer % lijst.length] ?? lijst[0]
}
