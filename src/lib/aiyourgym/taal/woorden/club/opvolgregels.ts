import { woordenboek } from '../../woordenboek'
import { REGEL_DEFINITIES, type RegelSleutel } from '@/lib/club/automatisering/regels'

// De pagina Opvolgregels (instellingen) en de kaart per regel. Naam en "waarom"
// van een regel staan al in OPVOLGEN.regel (opvolgen.ts). Hier de uitleg met
// drempel en het invoerveld. Het Nederlands komt uit REGEL_DEFINITIES (bron).
// De voorbeeldtekst (sjabloon) is van de sportschool zelf en wordt niet vertaald.

const nlUitleg = (s: RegelSleutel) => (n: string) => REGEL_DEFINITIES[s].uitleg.replace('{n}', String(n))
const nlDrempel = (s: RegelSleutel) => {
  const d = REGEL_DEFINITIES[s].drempel
  return { label: d?.label ?? '', eenheid: d?.eenheid ?? '' }
}

export const OPVOLGREGELS = woordenboek({
  nl: {
    pagina: {
      titel: 'Opvolgregels',
      intro:
        'Regels die elke dag klaarzetten wie het team even aanspreekt: nieuwe leden, proefleden, wie wegblijft, verjaardagen, opzeggingen en mijlpalen. Ze vullen de opvolglijst met een voorbeeldtekst. Club verstuurt zelf nog niets; automatisch versturen per mail of app komt later.',
      naarLijst: 'Naar de opvolglijst',
      zoWerktHet: 'Zo werkt het',
      stap1: { kop: 'Elke dag', tekst: ' kijkt Club bij het openen van de opvolglijst welke leden aan een regel voldoen.' },
      stap2: { kop: 'Nooit dubbel:', tekst: ' per lid en aanleiding komt er een taak. Een verjaardag een keer per jaar, risico hooguit een keer per maand.' },
      stap3: { kop: 'Vanzelf opgelost:', tekst: ' komt iemand weer trainen voordat je belde, dan verdwijnt de taak van de lijst.' },
      regelsFout: 'De regels konden niet worden gelezen. Probeer het later opnieuw.',
      medewerkersFout: 'De medewerkers konden niet worden gelezen; je kunt nu alleen een functie kiezen.',
    },
    kaart: {
      aan: 'Aan',
      uit: 'Uit',
      staatAan: (regel: string) => `${regel} staat aan.`,
      staatUit: (regel: string) => `${regel} staat uit.`,
      opgeslagen: (regel: string) => `${regel} is opgeslagen.`,
      bereik: (eenheid: string, min: number, max: number) => `${eenheid}, ${min} tot ${max}`,
      wie: 'Wie pakt het op',
      iedereen: 'Iedereen',
      functie: 'Functie',
      vast: 'Vaste medewerker',
      sjabloon: 'Voorbeeldtekst voor het team',
      plekken: (velden: string, lengte: number, max: number) => `Plekken die Club invult: ${velden}. ${lengte} van ${max} tekens.`,
      en: 'en',
      onbekend: (velden: string) => `Club kent ${velden} niet; dat blijft zo in de tekst staan.`,
      voorbeeld: (naam: string) => `Zo ziet het team het bij ${naam}`,
      voorbeeldNaam: 'Sanne',
      opslaan: 'Opslaan',
    },
    uitleg: {
      welkom: nlUitleg('welkom'),
      proefles_opvolgen: nlUitleg('proefles_opvolgen'),
      niet_gezien: nlUitleg('niet_gezien'),
      risico: nlUitleg('risico'),
      verjaardag: nlUitleg('verjaardag'),
      opzegging: nlUitleg('opzegging'),
      mijlpaal: nlUitleg('mijlpaal'),
    },
    drempel: {
      welkom: nlDrempel('welkom'),
      proefles_opvolgen: nlDrempel('proefles_opvolgen'),
      niet_gezien: nlDrempel('niet_gezien'),
      risico: nlDrempel('risico'),
      mijlpaal: nlDrempel('mijlpaal'),
    },
  },
  en: {
    pagina: {
      titel: 'Follow-up rules',
      intro:
        'Rules that list every day who the team should have a word with: new members, trial members, members who stay away, birthdays, cancellations and milestones. They fill the follow-up list with an example text. Club does not send anything itself yet; automatic sending by email or app comes later.',
      naarLijst: 'Go to the follow-up list',
      zoWerktHet: 'How it works',
      stap1: { kop: 'Every day', tekst: ' Club checks which members match a rule when the follow-up list is opened.' },
      stap2: { kop: 'Never twice:', tekst: ' one task per member and reason. A birthday once a year, risk at most once a month.' },
      stap3: { kop: 'Resolves itself:', tekst: ' if someone starts training again before you called, the task disappears from the list.' },
      regelsFout: 'The rules could not be loaded. Please try again later.',
      medewerkersFout: 'The staff could not be loaded; for now you can only choose a role.',
    },
    kaart: {
      aan: 'On',
      uit: 'Off',
      staatAan: (regel: string) => `${regel} is on.`,
      staatUit: (regel: string) => `${regel} is off.`,
      opgeslagen: (regel: string) => `${regel} has been saved.`,
      bereik: (eenheid: string, min: number, max: number) => `${eenheid}, ${min} to ${max}`,
      wie: 'Who picks it up',
      iedereen: 'Everyone',
      functie: 'Role',
      vast: 'Specific staff member',
      sjabloon: 'Example text for the team',
      plekken: (velden: string, lengte: number, max: number) => `Placeholders Club fills in: ${velden}. ${lengte} of ${max} characters.`,
      en: 'and',
      onbekend: (velden: string) => `Club does not recognise ${velden}; it stays in the text as it is.`,
      voorbeeld: (naam: string) => `How the team sees it for ${naam}`,
      voorbeeldNaam: 'Sanne',
      opslaan: 'Save',
    },
    uitleg: {
      welkom: (n: string) => `Every new member is added to the list in their first ${n} days for a short welcome chat.`,
      proefles_opvolgen: (n: string) => `A trial member is added to the list ${n} days after starting, so you can ask how it is going.`,
      niet_gezien: (n: string) => `An active member who has not been in for ${n} days or more is added to the list.`,
      risico: (n: string) => `A member with a retention score below ${n} is added to the list. If someone is already on "Not seen for a while", they are not added twice.`,
      verjaardag: (_n: string) => 'Whoever has a birthday today is added to the list for a congratulation.',
      opzegging: (_n: string) => 'Whoever has cancelled is added to the list for an exit chat: ask why and whether there is anything you can still do.',
      mijlpaal: (n: string) => `At every ${n}th visit (and every multiple of it) a member is added to the list for a congratulation.`,
    },
    drempel: {
      welkom: { label: 'First number of days', eenheid: 'days' },
      proefles_opvolgen: { label: 'After this many days', eenheid: 'days' },
      niet_gezien: { label: 'Days not in', eenheid: 'days' },
      risico: { label: 'Retention score below', eenheid: 'points' },
      mijlpaal: { label: 'Every this many visits', eenheid: 'visits' },
    },
  },
})
