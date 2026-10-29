import { KERN_VRAGEN, PARQ_PREFIX } from '@/lib/club/intakevragen/kern'
import type { IntakeVraag } from '@/lib/club/intakevragen/soorten'
import type { Taal } from '../../taal'
import { woordenboek } from '../../woordenboek'
import { TRAINING_LABELS } from './training-labels'

// De intake in Club: het formulier, de detailweergave, de lijst, het verloop
// van de metingen en het beheer van de intakevragen. De vaste vragen van Club
// (kern.ts) krijgen in het Engels een Engelse tekst zolang de sportschool ze
// niet zelf heeft aangepast; eigen tekst van de sportschool blijft zoals hij is.

type KernSleutel = 'doelen' | 'motivatie' | 'niveau' | 'dagen_per_week' | 'minuten_per_sessie' | 'voorkeuren' | 'blessures' | 'blessure_toelichting' | 'klachten' | 'medicatie'
type StandaardSectie = 'Doelen' | 'Ervaring' | 'Leefstijl' | 'Gezondheid' | 'Overig'

interface KernTekst {
  vraag: string
  uitleg: string
}

const kernNl = Object.fromEntries(
  KERN_VRAGEN.filter((k) => !k.sleutel.startsWith(PARQ_PREFIX)).map((k) => [k.sleutel, { vraag: k.vraag, uitleg: k.uitleg ?? '' }]),
) as Record<KernSleutel, KernTekst>

export const INTAKE = woordenboek({
  nl: {
    pagina: {
      titel: 'Intake',
      boventitel: (vestiging: string) => `${vestiging} · Training`,
      intro: 'Alle stappen op een scherm, met de vragen van je sportschool. Gezondheidsgegevens alleen met toestemming van het lid.',
      trainersFout: 'De trainers konden niet worden geladen; je kunt de intake wel opslaan.',
      vragenFout: 'De intakevragen van je sportschool konden niet worden gelezen. Je ziet nu de standaardvragen; opslaan lukt pas weer als ze te lezen zijn.',
      training: 'Training',
    },
    formulier: {
      lidGekozen: 'Lid gekozen',
      metingen: 'Metingen',
      kiesLid: 'Kies eerst een lid.',
      vulIn: (vraag: string) => `Vul "${vraag}" in.`,
      mislukt: 'Opslaan lukte niet.',
      opgeslagen: 'Intake opgeslagen',
      volgende: 'Volgende stap: een schemavoorstel op basis van deze intake. Je past het aan in de editor en activeert het daar.',
      later: (voornaam: string) => `Later, naar de intakes van ${voornaam}`,
      stapLid: 'Lid en afname',
      anderLid: 'Ander lid',
      datum: 'Datum',
      trainer: 'Trainer',
      geen: 'Geen',
      notitie: 'Notitie van de trainer',
      voortgang: 'Voortgang',
      klaar: ' (klaar)',
      open: ' (nog open)',
      metToestemming: 'Gezondheidsgegevens worden opgeslagen met toestemming.',
      zonderToestemming: 'Zonder toestemming: geen gezondheidsgegevens.',
      opslaan: 'Intake opslaan',
      opslaanBezig: 'Opslaan...',
    },
    toestemming: {
      titel: 'Het lid geeft toestemming om gezondheidsgegevens vast te leggen',
      uitleg: 'Blessures, klachten, medicatie, de gezondheidsvragen, rusthartslag en bloeddruk zijn bijzondere persoonsgegevens. Vraag het lid hardop of dat mag. Zonder vinkje wordt hier niets van opgeslagen.',
    },
    metingen: {
      zonder: 'Metingen zijn gezondheidsgegevens. Vink eerst de toestemming van het lid aan; zonder toestemming slaat Club geen metingen op.',
      gewicht: 'Gewicht',
      lengte: 'Lengte',
      vet: 'Vetpercentage',
      buik: 'Buikomtrek',
      hartslag: 'Rusthartslag',
      perMinuut: 'per min',
      bloeddruk: 'Bloeddruk',
      bmiLeeg: 'vul gewicht en lengte in',
    },
    sectie: {
      verplicht: 'Verplicht',
      slot: (n: number) => (n === 1 ? '1 gezondheidsvraag alleen met toestemming van het lid.' : `${n} gezondheidsvragen alleen met toestemming van het lid.`),
      parqJa: 'Een of meer keer ja: laat het lid eerst met de huisarts overleggen voordat de intensiteit omhoog gaat.',
    },
    janee: { ja: 'Ja', nee: 'Nee' },
    detail: {
      afgenomenDoor: (naam: string) => ` · afgenomen door ${naam}`,
      doelen: 'Doelen',
      ervaring: 'Ervaring',
      beschikbaar: 'Beschikbaar',
      beschikbaarTekst: (dagen: number, minuten: number) => `${dagen} ${dagen === 1 ? 'dag' : 'dagen'} per week, ${minuten} minuten`,
      voorkeur: 'Voorkeur',
      geenVoorkeur: 'geen voorkeur',
      motivatie: 'Motivatie',
      onleesbaar: 'De antwoorden van deze intake zijn niet leesbaar.',
      metingen: 'Metingen',
      gewicht: 'Gewicht',
      lengte: 'Lengte',
      bmiNiet: 'niet te berekenen',
      vet: 'Vetpercentage',
      buik: 'Buikomtrek',
      hartslag: 'Rusthartslag',
      slagen: 'slagen per minuut',
      bloeddruk: 'Bloeddruk',
      nietGemeten: 'niet gemeten',
      gezondheid: 'Gezondheid',
      toestemming: 'Toestemming gegeven',
      blessures: 'Blessures',
      geen: 'geen',
      toelichting: 'Toelichting',
      klachten: 'Klachten',
      medicatie: 'Medicatie',
      gezondheidsvragen: 'Gezondheidsvragen',
      overalNee: 'Overal nee',
      ja: (vraag: string) => `Ja: ${vraag}`,
      geenToestemming: 'Geen toestemming: er zijn geen gezondheidsgegevens vastgelegd.',
      notitie: 'Notitie',
    },
    lijst: {
      intake: 'Intake',
      avgTitel: 'Toestemming voor gezondheidsgegevens',
      avg: 'AVG',
      voorstel: 'Schemavoorstel',
      allesVan: (naam: string) => `Alles van ${naam}`,
      ditLid: 'dit lid',
    },
    verloop: {
      label: 'Verloop van de metingen',
      leeg: 'Nog geen metingen vastgelegd.',
      kies: 'Kies meting',
      sinds: (verschil: string, eenheid: string, datum: string) => `${verschil}${eenheid ? ` ${eenheid}` : ''} sinds ${datum}`,
      reeks: { gewicht: 'Gewicht', bmi: 'BMI', vet: 'Vet', buik: 'Buik', hartslag: 'Rusthartslag' },
    },
    beheer: {
      standaard: 'Je gebruikt nu de standaardvragen van Club. Zodra je iets aanpast, wordt het je eigen vragenlijst.',
      toevoegen: 'Vraag toevoegen',
      telling: (aan: number, totaal: number, secties: number) => `${aan} van ${totaal} vragen aan, in ${secties} secties`,
      toegevoegd: 'Vraag toegevoegd.',
      opgeslagen: 'Vraag opgeslagen.',
      volgorde: 'Volgorde opgeslagen.',
      volgordeSecties: 'Volgorde van de secties opgeslagen.',
      staatUit: (vraag: string) => `"${vraag}" staat uit.`,
      staatAan: (vraag: string) => `"${vraag}" staat aan.`,
      verwijderVraag: (vraag: string) => `"${vraag}" verwijderen? Intakes die al zijn afgenomen houden hun antwoord.`,
      verwijderd: 'Vraag verwijderd.',
      nieuweSectie: 'Doelen',
    },
    vragenLijst: {
      omhoog: (label: string) => `${label} omhoog`,
      omlaag: (label: string) => `${label} omlaag`,
      verplicht: 'Verplicht',
      toestemming: 'Toestemming',
      vastVoorstel: 'Vast, voor het schemavoorstel',
      vast: 'Vaste vraag',
      eigen: 'Eigen vraag',
      aanUit: (vraag: string, aan: boolean) => `${vraag}: ${aan ? 'aan' : 'uit'}`,
      aan: 'Aan',
      uit: 'Uit',
      aanpassen: (vraag: string) => `${vraag} aanpassen`,
      verwijderen: (vraag: string) => `${vraag} verwijderen`,
      aantalAan: (aan: number, totaal: number) => `${aan} van ${totaal} aan`,
      sectie: (naam: string) => `Sectie ${naam}`,
    },
    vraagFormulier: {
      nieuw: 'Nieuwe vraag',
      vastAanpassen: 'Vaste vraag aanpassen',
      aanpassen: 'Vraag aanpassen',
      vastUitleg: (vast: boolean) => `Een vaste vraag van Club vult een veld van de intake${vast ? ' waar het schemavoorstel op draait, dus hij blijft aan' : ''}. Je past de tekst, uitleg en sectie aan.`,
      vraag: 'Vraag',
      uitleg: 'Uitleg voor de trainer (optioneel)',
      sectie: 'Sectie',
      soort: 'Soort antwoord',
      opties: (max: number) => `Opties, een per regel (2 tot ${max})`,
      eigenschappen: 'Eigenschappen',
      verplicht: 'Verplicht',
      gezondheid: 'Gezondheidsvraag (alleen met toestemming)',
      actief: 'Aan in het formulier',
      gezondheidUitleg: 'Een gezondheidsvraag ziet de trainer pas als het lid toestemming geeft. Zonder toestemming wordt het antwoord niet opgeslagen.',
      opslaan: 'Opslaan',
      opslaanBezig: 'Opslaan...',
      annuleren: 'Annuleren',
    },
    beheerPagina: {
      titel: 'Intakeformulier',
      intro: 'De vragen die je trainers bij een intake stellen, in jouw volgorde en secties. Doelen, ervaring, dagen en minuten blijven altijd staan: daar maakt Club het schemavoorstel mee. Gezondheidsvragen ziet de trainer alleen als het lid toestemming geeft.',
      fout: 'De intakevragen konden niet worden gelezen. Probeer het later opnieuw.',
    },
    voorbeeld: {
      boventitel: 'Live voorbeeld',
      titel: 'Zo ziet de trainer het',
      uitleg: 'Probeer het uit. Hier wordt niets opgeslagen. Lid, datum en metingen staan er in het echte formulier omheen.',
      leeg: 'Er staan geen vragen aan.',
    },
    kern: kernNl,
    secties: { Doelen: 'Doelen', Ervaring: 'Ervaring', Leefstijl: 'Leefstijl', Gezondheid: 'Gezondheid', Overig: 'Overig' },
  },
  en: {
    pagina: {
      titel: 'Intake',
      boventitel: (vestiging: string) => `${vestiging} · Training`,
      intro: "Every step on one screen, with your gym's questions. Health details only with the member's consent.",
      trainersFout: 'The trainers could not be loaded; you can still save the intake.',
      vragenFout: "Your gym's intake questions could not be read. You are seeing the default questions; saving works again once they can be read.",
      training: 'Training',
    },
    formulier: {
      lidGekozen: 'Member chosen',
      metingen: 'Measurements',
      kiesLid: 'Choose a member first.',
      vulIn: (vraag: string) => `Fill in "${vraag}".`,
      mislukt: 'Saving did not work.',
      opgeslagen: 'Intake saved',
      volgende: 'Next step: a draft programme based on this intake. You adjust it in the editor and activate it there.',
      later: (voornaam: string) => `Later, go to ${voornaam}'s intakes`,
      stapLid: 'Member and session',
      anderLid: 'Other member',
      datum: 'Date',
      trainer: 'Trainer',
      geen: 'None',
      notitie: "Trainer's note",
      voortgang: 'Progress',
      klaar: ' (done)',
      open: ' (still open)',
      metToestemming: 'Health details are saved with consent.',
      zonderToestemming: 'Without consent: no health details.',
      opslaan: 'Save intake',
      opslaanBezig: 'Saving...',
    },
    toestemming: {
      titel: 'The member consents to their health details being recorded',
      uitleg: 'Injuries, complaints, medication, the health questions, resting heart rate and blood pressure are special category personal data. Ask the member out loud whether that is OK. Without the tick, none of it is saved.',
    },
    metingen: {
      zonder: "Measurements are health details. Tick the member's consent first; without consent Club saves no measurements.",
      gewicht: 'Weight',
      lengte: 'Height',
      vet: 'Body fat',
      buik: 'Waist',
      hartslag: 'Resting heart rate',
      perMinuut: 'per min',
      bloeddruk: 'Blood pressure',
      bmiLeeg: 'enter weight and height',
    },
    sectie: {
      verplicht: 'Required',
      slot: (n: number) => (n === 1 ? "1 health question, only with the member's consent." : `${n} health questions, only with the member's consent.`),
      parqJa: 'One or more yes answers: have the member talk to their GP first before the intensity goes up.',
    },
    janee: { ja: 'Yes', nee: 'No' },
    detail: {
      afgenomenDoor: (naam: string) => ` · run by ${naam}`,
      doelen: 'Goals',
      ervaring: 'Experience',
      beschikbaar: 'Availability',
      beschikbaarTekst: (dagen: number, minuten: number) => `${dagen} ${dagen === 1 ? 'day' : 'days'} a week, ${minuten} minutes`,
      voorkeur: 'Preference',
      geenVoorkeur: 'no preference',
      motivatie: 'Motivation',
      onleesbaar: 'The answers of this intake cannot be read.',
      metingen: 'Measurements',
      gewicht: 'Weight',
      lengte: 'Height',
      bmiNiet: 'cannot be calculated',
      vet: 'Body fat',
      buik: 'Waist',
      hartslag: 'Resting heart rate',
      slagen: 'beats per minute',
      bloeddruk: 'Blood pressure',
      nietGemeten: 'not measured',
      gezondheid: 'Health',
      toestemming: 'Consent given',
      blessures: 'Injuries',
      geen: 'none',
      toelichting: 'Details',
      klachten: 'Complaints',
      medicatie: 'Medication',
      gezondheidsvragen: 'Health questions',
      overalNee: 'No to all',
      ja: (vraag: string) => `Yes: ${vraag}`,
      geenToestemming: 'No consent: no health details have been recorded.',
      notitie: 'Note',
    },
    lijst: {
      intake: 'Intake',
      avgTitel: 'Consent for health details',
      avg: 'GDPR',
      voorstel: 'Draft programme',
      allesVan: (naam: string) => `Everything for ${naam}`,
      ditLid: 'this member',
    },
    verloop: {
      label: 'Measurement trend',
      leeg: 'No measurements recorded yet.',
      kies: 'Choose measurement',
      sinds: (verschil: string, eenheid: string, datum: string) => `${verschil}${eenheid ? ` ${eenheid}` : ''} since ${datum}`,
      reeks: { gewicht: 'Weight', bmi: 'BMI', vet: 'Fat', buik: 'Waist', hartslag: 'Resting heart rate' },
    },
    beheer: {
      standaard: "You are currently using Club's default questions. As soon as you change something, it becomes your own question list.",
      toevoegen: 'Add question',
      telling: (aan: number, totaal: number, secties: number) => `${aan} of ${totaal} questions on, in ${secties} sections`,
      toegevoegd: 'Question added.',
      opgeslagen: 'Question saved.',
      volgorde: 'Order saved.',
      volgordeSecties: 'Section order saved.',
      staatUit: (vraag: string) => `"${vraag}" is off.`,
      staatAan: (vraag: string) => `"${vraag}" is on.`,
      verwijderVraag: (vraag: string) => `Delete "${vraag}"? Intakes already completed keep their answer.`,
      verwijderd: 'Question deleted.',
      nieuweSectie: 'Goals',
    },
    vragenLijst: {
      omhoog: (label: string) => `Move ${label} up`,
      omlaag: (label: string) => `Move ${label} down`,
      verplicht: 'Required',
      toestemming: 'Consent',
      vastVoorstel: 'Fixed, used for the draft programme',
      vast: 'Fixed question',
      eigen: 'Own question',
      aanUit: (vraag: string, aan: boolean) => `${vraag}: ${aan ? 'on' : 'off'}`,
      aan: 'On',
      uit: 'Off',
      aanpassen: (vraag: string) => `Edit ${vraag}`,
      verwijderen: (vraag: string) => `Delete ${vraag}`,
      aantalAan: (aan: number, totaal: number) => `${aan} of ${totaal} on`,
      sectie: (naam: string) => `Section ${naam}`,
    },
    vraagFormulier: {
      nieuw: 'New question',
      vastAanpassen: 'Edit fixed question',
      aanpassen: 'Edit question',
      vastUitleg: (vast: boolean) => `A fixed Club question fills a field of the intake${vast ? ' that the draft programme relies on, so it stays on' : ''}. You can change the text, explanation and section.`,
      vraag: 'Question',
      uitleg: 'Note for the trainer (optional)',
      sectie: 'Section',
      soort: 'Answer type',
      opties: (max: number) => `Options, one per line (2 to ${max})`,
      eigenschappen: 'Properties',
      verplicht: 'Required',
      gezondheid: 'Health question (only with consent)',
      actief: 'On in the form',
      gezondheidUitleg: 'The trainer only sees a health question once the member gives consent. Without consent the answer is not saved.',
      opslaan: 'Save',
      opslaanBezig: 'Saving...',
      annuleren: 'Cancel',
    },
    beheerPagina: {
      titel: 'Intake form',
      intro: 'The questions your trainers ask during an intake, in your order and sections. Goals, experience, days and minutes always stay: Club uses them for the draft programme. The trainer only sees health questions once the member gives consent.',
      fout: 'The intake questions could not be read. Please try again later.',
    },
    voorbeeld: {
      boventitel: 'Live preview',
      titel: 'What the trainer sees',
      uitleg: 'Try it out. Nothing is saved here. Member, date and measurements surround it in the real form.',
      leeg: 'No questions are switched on.',
    },
    kern: {
      doelen: { vraag: 'What are your goals?', uitleg: '' },
      motivatie: { vraag: 'Motivation in their own words', uitleg: 'Why now, and what does the member want to be able to do in three months?' },
      niveau: { vraag: 'Strength training experience', uitleg: '' },
      dagen_per_week: { vraag: 'Days per week', uitleg: '' },
      minuten_per_sessie: { vraag: 'Minutes per session', uitleg: '' },
      voorkeuren: { vraag: 'Preference', uitleg: '' },
      blessures: { vraag: 'Injuries or complaints in', uitleg: '' },
      blessure_toelichting: { vraag: 'Injury details', uitleg: 'For example: left meniscus, 2024' },
      klachten: { vraag: 'Other complaints', uitleg: '' },
      medicatie: { vraag: 'Medication', uitleg: '' },
    },
    secties: { Doelen: 'Goals', Ervaring: 'Experience', Leefstijl: 'Lifestyle', Gezondheid: 'Health', Overig: 'Other' },
  },
})

/** Een sectienaam in de taal, als het een standaardsectie van Club is; een eigen naam blijft gelijk. */
export function sectieInTaal(naam: string, taal: Taal): string {
  const s = INTAKE.nl.secties as Record<string, string>
  return naam in s ? (INTAKE[taal].secties as Record<string, string>)[naam] : naam
}

/**
 * Een vraag in de taal. Een vaste vraag van Club die de sportschool niet heeft
 * aangepast krijgt de Engelse tekst; een eigen of aangepaste tekst blijft gelijk.
 */
export function vraagInTaal(v: IntakeVraag, taal: Taal): IntakeVraag {
  if (taal === 'nl' || !v.sleutel) return { ...v, sectie: sectieInTaal(v.sectie, taal) }
  const sleutel = v.sleutel
  let vraag = v.vraag
  let uitleg = v.uitleg
  if (sleutel.startsWith(PARQ_PREFIX)) {
    const p = sleutel.slice(PARQ_PREFIX.length) as keyof (typeof TRAINING_LABELS)['nl']['parq']
    if (TRAINING_LABELS.nl.parq[p] === v.vraag) vraag = TRAINING_LABELS.en.parq[p]
  } else if (sleutel in INTAKE.nl.kern) {
    const k = sleutel as KernSleutel
    if (INTAKE.nl.kern[k].vraag === v.vraag) vraag = INTAKE.en.kern[k].vraag
    if ((INTAKE.nl.kern[k].uitleg || null) === v.uitleg) uitleg = INTAKE.en.kern[k].uitleg || null
  }
  return { ...v, vraag, uitleg, sectie: sectieInTaal(v.sectie, taal) }
}

export type StandaardSectieNaam = StandaardSectie
