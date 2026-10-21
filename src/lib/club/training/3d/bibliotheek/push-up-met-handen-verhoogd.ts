// 3D-oefening: Push-up met handen verhoogd. Naam exact zoals in de oefenbibliotheek.
// Handen iets breder dan de schouders op de rand van een vlakke bank, vingers
// naar voren, voeten naar achteren op de vloer. Lichaam een plank van hoofd tot
// hielen. Gecontroleerd zakken tot de borst bijna de rand raakt, ellebogen
// ongeveer 45 graden naar achteren, en de bank daarna van je af duwen.

import { pushUp } from '../bouw/push-up'
import type { Oefening3d } from '../typen'

/** Bovenkant van het kussen van de bank (0,43 m), handen zakken een fractie in. */
const VLAK = 0.425

const OEFENING = pushUp({
  naam: 'Push-up met handen verhoogd',
  steun: { soort: 'tenen', teen: { x: 0.1, y: 0, z: -1.02 } },
  hand: { vlak: VLAK, x: 0.22 },
  handVoor: 0.2,
  borstVrij: 0.025,
  bekkenZak: 0.015,
  elleboogRichting: { x: 0.6, y: 0.4, z: -1.4 },
  materiaal: [],
  spieren: ['borst', 'bovenarm', 'schouder'],
  spierenSecundair: ['romp'],
  camera: { hoek: 62, hoogte: 10, afstand: 4.0, doel: { x: 0, y: 0.5, z: -0.2 } },
})

/** Waar de polsen staan: de bank dwars ervoor, polsen 6 cm van de rand aan de kant van de voeten. */
const POLS_Z = OEFENING.sleutels[0].houding.lastZ

export const PUSH_UP_HANDEN_VERHOOGD: Oefening3d = {
  ...OEFENING,
  materiaal: [{ soort: 'bankKaal', draai: 90, plek: { x: 0, y: 0, z: POLS_Z + 0.09 } }],
}
