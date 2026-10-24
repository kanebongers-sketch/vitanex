// De blikvanger met een oefening en haar kernpunten (home/SchemaBlikvanger.tsx, een
// clientcomponent: daarom een eigen klein bestand zonder zware imports). De spieren
// komen uit SPIER_LABEL in inhoud/oefenrenders.ts; hier staan ze per taal, klein
// geschreven voor in een zin. Een spier die hier ontbreekt, valt terug op de eigen naam.

import { woordenboek } from '../../woordenboek'

export const BLIKVANGER = woordenboek({
  nl: {
    beeldLabel: (naam: string) => `${naam} als bewegend 3D-beeld`,
    werktOp: (spieren: string) => `Werkt vooral op ${spieren}`,
    laatsteVoeg: 'en',
    kiesOefening: 'Kies een oefening',
    kernpuntenBij: (naam: string) => `Kernpunten bij ${naam}`,
    spieren: {
      Bovenbenen: 'bovenbenen',
      Hamstrings: 'hamstrings',
      Kuiten: 'kuiten',
      Bilspieren: 'bilspieren',
      Romp: 'romp',
      Borst: 'borst',
      Rug: 'rug',
      Onderrug: 'onderrug',
      Schouders: 'schouders',
      Armen: 'armen',
      Onderarmen: 'onderarmen',
    },
  },
  en: {
    beeldLabel: (naam: string) => `${naam} as a moving 3D image`,
    werktOp: (spieren: string) => `Mainly works the ${spieren}`,
    laatsteVoeg: 'and',
    kiesOefening: 'Choose an exercise',
    kernpuntenBij: (naam: string) => `Coaching cues for ${naam}`,
    spieren: {
      Bovenbenen: 'thighs',
      Hamstrings: 'hamstrings',
      Kuiten: 'calves',
      Bilspieren: 'glutes',
      Romp: 'core',
      Borst: 'chest',
      Rug: 'back',
      Onderrug: 'lower back',
      Schouders: 'shoulders',
      Armen: 'arms',
      Onderarmen: 'forearms',
    },
  },
})
