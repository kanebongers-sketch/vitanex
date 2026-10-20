// ─── Club startwizard: voorbeelden om met een klik over te nemen (PUUR) ─────
// Gangbare groepslessen met algemene namen (geen merknamen van lesconcepten)
// en een paar vaste lessen als begin van het weekrooster. Alles is daarna
// gewoon aan te passen in Instellingen.

import type { LesSoort } from '@/lib/club/rooster/typen'

export interface VoorbeeldLestype {
  naam: string
  soort: LesSoort
  duurMin: number
  /** 1 rustig, 2 gemiddeld, 3 zwaar. */
  intensiteit: 1 | 2 | 3
  omschrijving: string
}

export const VOORBEELD_LESTYPEN: readonly VoorbeeldLestype[] = [
  { naam: 'Spinning', soort: 'spinning', duurMin: 45, intensiteit: 3, omschrijving: 'Fietsen op muziek met heuvels, sprints en intervallen. Je bepaalt zelf de weerstand.' },
  { naam: 'Bootcamp', soort: 'functioneel', duurMin: 45, intensiteit: 3, omschrijving: 'Conditie en kracht in een groep, met korte rondes en veel afwisseling.' },
  { naam: 'Circuittraining', soort: 'functioneel', duurMin: 45, intensiteit: 2, omschrijving: 'Langs vaste posten met kracht en conditie. Voor elk niveau.' },
  { naam: 'Kracht in de groep', soort: 'kracht', duurMin: 55, intensiteit: 2, omschrijving: 'Spierkracht met halters en eigen gewicht, met aandacht voor techniek.' },
  { naam: 'HIIT', soort: 'cardio', duurMin: 30, intensiteit: 3, omschrijving: 'Korte, felle intervallen met rust ertussen. Kort en krachtig.' },
  { naam: 'Core', soort: 'kracht', duurMin: 30, intensiteit: 2, omschrijving: 'Buik, rug en heupen sterker maken voor een stevige basis.' },
  { naam: 'Yoga', soort: 'mind_body', duurMin: 60, intensiteit: 1, omschrijving: 'Rustig bewegen, rekken en ademen. Goed voor soepelheid en ontspanning.' },
  { naam: 'Pilates', soort: 'mind_body', duurMin: 55, intensiteit: 2, omschrijving: 'Gecontroleerde oefeningen voor houding, romp en stabiliteit.' },
  { naam: 'Dance fitness', soort: 'dans', duurMin: 55, intensiteit: 2, omschrijving: 'Bewegen op muziek met eenvoudige danspassen. Zweten zonder dat je het merkt.' },
]

/** Lessen voor studio's met een eigen richting (yoga en pilates, vechtsport). */
export const EXTRA_LESTYPEN: readonly VoorbeeldLestype[] = [
  { naam: 'Yin yoga', soort: 'mind_body', duurMin: 75, intensiteit: 1, omschrijving: 'Lang aanhouden in rustige houdingen. Goed voor soepelheid en om tot rust te komen.' },
  { naam: 'Vinyasa flow', soort: 'mind_body', duurMin: 60, intensiteit: 2, omschrijving: 'Vloeiend van houding naar houding, op het ritme van je adem.' },
  { naam: 'Meditatie', soort: 'mind_body', duurMin: 30, intensiteit: 1, omschrijving: 'Begeleid stilzitten en ademen. Geen ervaring nodig.' },
  { naam: 'Kickboksen', soort: 'overig', duurMin: 60, intensiteit: 3, omschrijving: 'Techniek, combinaties en conditie op de pads. Voor beginners en gevorderden.' },
  { naam: 'Boksen', soort: 'overig', duurMin: 60, intensiteit: 3, omschrijving: 'Voetenwerk, stoten en verdedigen, met veel aandacht voor techniek.' },
  { naam: 'Grappling', soort: 'overig', duurMin: 75, intensiteit: 3, omschrijving: 'Worstelen en grondwerk: posities, overgangen en klemmen.' },
  { naam: 'Jeugd vechtsport', soort: 'overig', duurMin: 45, intensiteit: 2, omschrijving: 'Speels leren bewegen, vallen en verdedigen, met respect voor elkaar.' },
  { naam: 'Conditietraining', soort: 'cardio', duurMin: 45, intensiteit: 3, omschrijving: 'Uithoudingsvermogen en explosiviteit met touwtjespringen, sprints en circuits.' },
]

/** Alle voorbeeldlestypen: de gangbare en die voor een eigen richting. */
export const ALLE_LESTYPEN: readonly VoorbeeldLestype[] = [...VOORBEELD_LESTYPEN, ...EXTRA_LESTYPEN]

/** Het voorbeeldlestype bij een naam, of null. */
export function lestypeOpNaam(naam: string): VoorbeeldLestype | null {
  return ALLE_LESTYPEN.find((v) => zelfdeNaam(v.naam, naam)) ?? null
}

export interface VoorbeeldLes {
  /** De naam van het lestype waar deze les bij hoort. */
  lestype: string
  /** 1 = maandag ... 7 = zondag. */
  weekdag: number
  starttijd: string
  capaciteit: number
}

/** Een eenvoudige startweek: alleen de lessen van lestypen die er al zijn worden getoond. */
export const VOORBEELD_LESSEN: readonly VoorbeeldLes[] = [
  { lestype: 'Spinning', weekdag: 1, starttijd: '19:00', capaciteit: 20 },
  { lestype: 'Bootcamp', weekdag: 2, starttijd: '19:30', capaciteit: 16 },
  { lestype: 'Yoga', weekdag: 3, starttijd: '09:30', capaciteit: 15 },
  { lestype: 'Circuittraining', weekdag: 3, starttijd: '19:00', capaciteit: 16 },
  { lestype: 'Kracht in de groep', weekdag: 4, starttijd: '19:00', capaciteit: 16 },
  { lestype: 'HIIT', weekdag: 5, starttijd: '07:00', capaciteit: 14 },
  { lestype: 'Pilates', weekdag: 5, starttijd: '10:00', capaciteit: 15 },
  { lestype: 'Spinning', weekdag: 6, starttijd: '09:00', capaciteit: 20 },
  { lestype: 'Dance fitness', weekdag: 6, starttijd: '10:30', capaciteit: 20 },
  { lestype: 'Core', weekdag: 7, starttijd: '10:00', capaciteit: 14 },
]

/** De startweek voor de extra lestypen. */
export const EXTRA_LESSEN: readonly VoorbeeldLes[] = [
  { lestype: 'Yin yoga', weekdag: 1, starttijd: '20:00', capaciteit: 15 },
  { lestype: 'Vinyasa flow', weekdag: 2, starttijd: '07:00', capaciteit: 15 },
  { lestype: 'Vinyasa flow', weekdag: 4, starttijd: '19:30', capaciteit: 15 },
  { lestype: 'Meditatie', weekdag: 7, starttijd: '11:30', capaciteit: 15 },
  { lestype: 'Kickboksen', weekdag: 1, starttijd: '19:00', capaciteit: 20 },
  { lestype: 'Kickboksen', weekdag: 3, starttijd: '19:00', capaciteit: 20 },
  { lestype: 'Boksen', weekdag: 2, starttijd: '19:30', capaciteit: 20 },
  { lestype: 'Grappling', weekdag: 4, starttijd: '20:00', capaciteit: 16 },
  { lestype: 'Jeugd vechtsport', weekdag: 3, starttijd: '16:30', capaciteit: 16 },
  { lestype: 'Jeugd vechtsport', weekdag: 6, starttijd: '10:00', capaciteit: 16 },
  { lestype: 'Conditietraining', weekdag: 6, starttijd: '11:00', capaciteit: 20 },
]

/** Alle voorbeeldlessen: de gangbare week en die voor de extra lestypen. */
export const ALLE_LESSEN: readonly VoorbeeldLes[] = [...VOORBEELD_LESSEN, ...EXTRA_LESSEN]

/** Namen vergelijken zonder hoofdletters en dubbele spaties. */
export function zelfdeNaam(a: string, b: string): boolean {
  const schoon = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()
  return schoon(a) === schoon(b)
}

export interface BestaandLestype {
  id: string
  naam: string
  duurMin: number
}

export interface BestaandeLes {
  lestypeId: string
  weekdag: number
  starttijd: string
}

export interface LesVoorstel extends VoorbeeldLes {
  lestypeId: string
  duurMin: number
  /** Staat deze les al in het weekrooster van de vestiging? */
  bestaat: boolean
}

/** De voorbeeldlessen waarvan het lestype er is, met of ze al in het rooster staan. */
export function lesVoorstellen(lestypen: readonly BestaandLestype[], lessen: readonly BestaandeLes[], voorbeelden: readonly VoorbeeldLes[] = VOORBEELD_LESSEN): LesVoorstel[] {
  return voorbeelden.flatMap((v) => {
    const type = lestypen.find((t) => zelfdeNaam(t.naam, v.lestype))
    if (!type) return []
    const bestaat = lessen.some((l) => l.lestypeId === type.id && l.weekdag === v.weekdag && l.starttijd.slice(0, 5) === v.starttijd)
    return [{ ...v, lestypeId: type.id, duurMin: type.duurMin, bestaat }]
  })
}
