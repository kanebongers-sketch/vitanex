// De contactbalk boven de kop (site/ContactBalk.tsx) en de vaste aanmeldknop op de
// telefoon (site/PlakActie.tsx, een clientcomponent). De knopteksten zelf komen uit ACTIE.

import { woordenboek } from '../../woordenboek'

export const CONTACT_BALK = woordenboek({
  nl: { contactLabel: 'Contact' },
  en: { contactLabel: 'Contact' },
})

export const PLAK_ACTIE = woordenboek({
  nl: { planDemo: 'Plan demo' },
  en: { planDemo: 'Book a demo' },
})
