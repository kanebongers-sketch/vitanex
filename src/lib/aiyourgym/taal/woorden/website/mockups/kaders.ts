// De kaders van de productbeelden (mockups/kaders.tsx, een clientcomponent): het
// bijschrift, het menu van Club in het browservenster en de tabbladen van de ledenapp.
// Het Nederlands komt uit Club zelf (src/components/club/shell), zodat het beeld het
// echte menu laat zien; komt er in Club een onderdeel bij, dan faalt de woordenboektest
// tot het Engels er ook staat. Tabbladen per Nederlandse naam (zo geven de schermen ze door).

import { GROEPEN, ONDERDELEN, inMenu, type GroepSleutel } from '@/components/club/shell/onderdelen'
import { HULPBALK, type HulpSleutel } from '@/components/club/shell/hulpbalk-items'
import { woordenboek } from '../../../woordenboek'

const groepen = Object.fromEntries(GROEPEN.map((g) => [g.sleutel, g.label])) as Record<GroepSleutel, string>
const onderdelen: Record<string, string> = Object.fromEntries(ONDERDELEN.filter(inMenu).map((o) => [o.sleutel, o.label]))
const hulpbalk = Object.fromEntries(HULPBALK.map((i) => [i.sleutel, i.label])) as Record<HulpSleutel, string>

export const KADERS = woordenboek({
  nl: {
    bijschrift: 'Schermvoorbeeld met voorbeeldgegevens',
    groepen,
    onderdelen,
    hulpbalk,
    tabs: {
      Home: 'Home',
      Lessen: 'Lessen',
      Afspraken: 'Afspraken',
      Schema: 'Schema',
      Voeding: 'Voeding',
      Voortgang: 'Voortgang',
      Profiel: 'Profiel',
    },
  },
  en: {
    bijschrift: 'Example screen with sample data',
    groepen: { werkvloer: 'Gym floor', leden: 'Members', planning: 'Planning', coaching: 'Coaching', beheer: 'Admin' },
    onderdelen: {
      vandaag: 'Today',
      checkin: 'Check-in',
      taken: 'Tasks',
      opvolgen: 'Follow-up',
      notities: 'Notes',
      leden: 'Members',
      leads: 'Leads',
      berichten: 'Messages',
      community: 'Community',
      challenges: 'Challenges',
      rooster: 'Group classes',
      afspraken: 'Appointments',
      personeel: 'Staff',
      agenda: 'Calendar',
      schemas: 'Training',
      voeding: 'Nutrition',
      cijfers: 'Figures',
      rapporten: 'Reports',
    },
    hulpbalk: { instellingen: 'Settings', koppelingen: 'Integrations', ledenapp: 'Member app', nieuw: 'What’s new', hulp: 'Help' },
    tabs: {
      Home: 'Home',
      Lessen: 'Classes',
      Afspraken: 'Appointments',
      Schema: 'Programme',
      Voeding: 'Nutrition',
      Voortgang: 'Progress',
      Profiel: 'Profile',
    },
  },
})
