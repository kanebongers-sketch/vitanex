// De pagina met de gratis overstapchecklist en het afvinkblok
// ((site)/overstapchecklist/page.tsx en src/components/aiyourgym/hulpmiddel).
// De punten zelf staan in beide talen in src/lib/aiyourgym/overstapchecklist.ts.

import { woordenboek } from '../../woordenboek'

export const CHECKLIST = woordenboek({
  nl: {
    metaTitel: 'Overstapchecklist',
    metaOmschrijving:
      'Gratis checklist voor sportscholen die overstappen naar nieuwe clubsoftware: voorbereiden, gegevens verzamelen, inrichten, leden meenemen en de eerste maand. Zonder account, ook te printen.',
    label: 'Gratis hulpmiddel',
    titel: 'De overstapchecklist.',
    tekst: 'Alles wat je regelt als je overstapt naar nieuwe clubsoftware, in vijf fases. Vink af wat klaar is en print hem voor je team. Gratis, zonder account en zonder e-mailadres.',
    sectie: 'Checklist',
    printkop: 'Overstapchecklist | AI Your Gym',
    verderLabel: 'En dan',
    verderTitel: 'Klaar om over te stappen?',
    verderTekst: 'Probeer AI Your Gym in je eigen omgeving, of laat het je eerst persoonlijk zien. De checklist werkt hoe dan ook.',
    zoWerkt: 'Zo werkt overstappen in AI Your Gym',
    // Het afvinkblok
    van: (klaar: number, totaal: number) => `${klaar} van ${totaal}`,
    gedaan: (totaal: number) => ` van ${totaal} gedaan`,
    voortgang: 'Voortgang',
    afgevinkt: 'Punten afgevinkt',
    browser: 'Je vinkjes blijven in deze browser staan. Niets wordt naar ons gestuurd.',
    printen: 'Printen',
    opnieuw: 'Opnieuw beginnen',
    opnieuwVraag: 'Alle vinkjes weghalen en opnieuw beginnen?',
  },
  en: {
    metaTitel: 'Switching checklist',
    metaOmschrijving:
      'A free checklist for gyms switching to new club software: preparing, gathering data, setting up, bringing members along and the first month. No account needed, and printable too.',
    label: 'Free tool',
    titel: 'The switching checklist.',
    tekst: 'Everything you need to arrange when you switch to new club software, in five phases. Tick off what is done and print it for your team. Free, with no account and no email address.',
    sectie: 'Checklist',
    printkop: 'Switching checklist | AI Your Gym',
    verderLabel: 'What next',
    verderTitel: 'Ready to switch?',
    verderTekst: 'Try AI Your Gym in your own environment, or let us show you in person first. The checklist works either way.',
    zoWerkt: 'How switching to AI Your Gym works',
    van: (klaar: number, totaal: number) => `${klaar} of ${totaal}`,
    gedaan: (totaal: number) => ` of ${totaal} done`,
    voortgang: 'Progress',
    afgevinkt: 'Items ticked off',
    browser: 'Your ticks stay in this browser. Nothing is sent to us.',
    printen: 'Print',
    opnieuw: 'Start again',
    opnieuwVraag: 'Remove all ticks and start again?',
  },
})
