// Titel en omschrijving van de website als geheel (src/app/(aiyourgym)/(website)/aiyourgym/(site)/layout.tsx)
// en van de voorpagina ((site)/page.tsx).

import { woordenboek } from '../../woordenboek'

export const SITE_META = woordenboek({
  nl: {
    titel: 'AI Your Gym | Clubsoftware voor sportscholen',
    omschrijving:
      'Clubsoftware voor sportscholen: leden, check-in, groepslessen, personeel, trainingsschema’s met coaching en een ledenapp in je eigen huisstijl.',
    homeOmschrijving:
      'Balie, vloer, trainers, eigenaar en leden in een systeem, met trainingsschema’s zoals een trainer ze geeft: coaching en een bewegend beeld bij elke oefening. Clubsoftware voor elk soort sportschool, met data in de EU.',
  },
  en: {
    titel: 'AI Your Gym | Club software for gyms',
    omschrijving:
      'Club software for gyms: members, check-in, group classes, staff, training programmes with coaching and a member app in your own branding.',
    homeOmschrijving:
      'Front desk, gym floor, trainers, owner and members in one system, with training programmes the way a trainer delivers them: coaching and a moving image for every exercise. Club software for every kind of gym, with data stored in the EU.',
  },
})
