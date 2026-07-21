// Publieke ingang voor Kane's programma-data. Types + constanten op één plek;
// de data zelf leeft in `voeding-data.ts` / `training-data.ts` (bestandsgrootte).
// Importeer altijd via dit bestand: `@/lib/lifeos/programma/programma-data`.

export type {
  Macros,
  VoedingItem,
  Maaltijd,
  VoedingDag,
  BoodschapItem,
  Oefening,
  Sessie,
  Trainingsschema,
} from './types'

export { MACRO_DOEL, VOEDING, BOODSCHAPPEN, VOEDING_TIPS } from './voeding-data'
export { TRAINING } from './training-data'
