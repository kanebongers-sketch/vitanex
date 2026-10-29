// ─── AI Your Gym: foutmeldingen van formulieren en API's in het Engels (PUUR) ─
// De controles (aanmelding.ts, demo-aanvraag.ts, prijs-aanvraag.ts en de regels
// voor wachtwoord en adres in src/lib/club/kern) geven Nederlandse meldingen: dat
// blijft de bron. De Nederlandse tekst is hier de sleutel voor het Engels.
// - De API's van de website geven beide talen terug: { fout, fouten, melding }
//   in het Nederlands plus `en` met hetzelfde in het Engels (metEngels()).
// - De browser kiest met kiesMeldingen(json, taal); eigen controles in de
//   browser vertaalt hij met foutenIn(fouten, taal).
// Een melding zonder vertaling blijft Nederlands; de test (meldingen.test.ts)
// zorgt dat elke melding die de controles kunnen geven hier staat.

import type { Taal } from '../../taal'

/** Vaste meldingen, Nederlands naar Engels. */
const VAST: Readonly<Record<string, string>> = {
  // Aanmelden (src/lib/aiyourgym/aanmelding.ts)
  'Kies minstens een pakket.': 'Choose at least one package.',
  // Pakketten erbij of opzeggen in Club (src/app/(aiyourgym)/api/aiyourgym/pakketten)
  'Kies een pakket.': 'Choose a package.',
  'Dit pakket heb je al.': 'You already have this package.',
  'Dit pakket heb je niet.': 'You do not have this package.',
  'Je houdt minstens een pakket. Wil je helemaal stoppen, zeg dan je abonnement op.': 'You keep at least one package. To stop completely, cancel your subscription.',
  'Het pakket kon niet worden aangepast. Probeer het later opnieuw.': 'The package could not be changed. Please try again later.',
  'Vul de naam van je sportschool in.': 'Enter the name of your gym.',
  'Vul je naam in.': 'Enter your name.',
  'Gebruik geen speciale tekens zoals < of >.': 'Do not use special characters such as < or >.',
  'Vul een geldig e-mailadres in.': 'Enter a valid email address.',
  'Vul een geldig telefoonnummer in.': 'Enter a valid phone number.',
  'De twee wachtwoorden zijn niet gelijk.': 'The two passwords do not match.',
  'Ga akkoord met de voorwaarden en de privacyverklaring.': 'Please accept the terms and the privacy statement.',
  // Wachtwoord (src/lib/club/kern/wachtwoord-regels.ts)
  'Kies een wachtwoord.': 'Choose a password.',
  'Gebruik meer verschillende tekens.': 'Use more different characters.',
  'Dit wachtwoord bevat een woord dat te makkelijk te raden is.': 'This password contains a word that is too easy to guess.',
  'Gebruik niet je naam of e-mailadres in je wachtwoord.': 'Do not use your name or email address in your password.',
  'Gebruik 16 tekens of meer, of mix kleine letters, hoofdletters, cijfers en tekens.':
    'Use 16 characters or more, or mix lower case, upper case, numbers and symbols.',
  // Adres (src/lib/club/kern/subdomein.ts)
  'Gebruik 3 tot 40 kleine letters, cijfers of koppeltekens (niet aan het begin of eind).':
    'Use 3 to 40 lower-case letters, numbers or hyphens (not at the start or end).',
  'Gebruik geen twee koppeltekens achter elkaar.': 'Do not use two hyphens in a row.',
  'Dit adres is gereserveerd. Kies een ander.': 'This address is reserved. Choose another one.',
  'Dit adres is al bezet. Kies een ander.': 'This address is already taken. Choose another one.',
  'Dit adres is al bezet.': 'This address is already taken.',
  // Demo en prijs op maat (demo-aanvraag.ts, prijs-aanvraag.ts)
  'Vul een geldig telefoonnummer in, zodat we je kunnen bellen.': 'Enter a valid phone number so we can call you.',
  'Kies het soort sportschool.': 'Choose your kind of gym.',
  'Kies wanneer het je uitkomt.': 'Choose when suits you.',
  'Geef aan dat je de privacyverklaring hebt gelezen.': 'Please confirm that you have read the privacy statement.',
  'Kies een pakket, of "Weet ik nog niet".': 'Choose a plan, or "Not sure yet".',
  'Kies ongeveer hoeveel leden je hebt.': 'Choose roughly how many members you have.',
  // API's van de website
  'Niet gevonden.': 'Not found.',
  'Even rustig aan. Probeer het zo opnieuw.': 'Slow down a little. Please try again in a moment.',
  'Even niet te controleren.': 'This cannot be checked right now.',
  'Dit verzoek komt niet van de website zelf.': 'This request did not come from the website itself.',
  'Te veel pogingen. Probeer het over een paar minuten opnieuw.': 'Too many attempts. Please try again in a few minutes.',
  'Te veel pogingen. Probeer het later opnieuw.': 'Too many attempts. Please try again later.',
  'Het verzoek is te groot.': 'The request is too large.',
  'Controleer de gemarkeerde velden.': 'Please check the highlighted fields.',
  'Aanmelden is nog niet open.': 'Sign-up is not open yet.',
  'Aanmelden is nog niet open. We hebben je gegevens ontvangen en nemen zelf contact met je op.':
    'Sign-up is not open yet. We have received your details and will get in touch with you ourselves.',
  'Aanmelden lukte niet. Probeer het later opnieuw.': 'Signing up did not work. Please try again later.',
  'Met dit e-mailadres is al een account. Log in, of gebruik een ander adres.': 'There is already an account with this email address. Sign in, or use a different address.',
  'Betalen kon niet worden gestart. Probeer het later opnieuw.': 'Payment could not be started. Please try again later.',
  'Afronden lukt nu niet. Probeer het later opnieuw.': 'Finishing is not possible right now. Please try again later.',
  'Deze betaling kennen we niet (meer). Meld je opnieuw aan.': 'We do not recognise this payment (any more). Please sign up again.',
  'Je sportschool klaarzetten lukte niet. Probeer het opnieuw.': 'Setting up your gym did not work. Please try again.',
  'Versturen lukte niet. Probeer het later opnieuw.': 'Sending did not work. Please try again later.',
  'Te veel aanvragen. Probeer het later opnieuw.': 'Too many requests. Please try again later.',
  'We hebben je aanvraag ontvangen.': 'We have received your request.',
  // Inloggen (API van Club, /api/club/inloggen)
  'Vul je e-mailadres en wachtwoord in.': 'Enter your email address and password.',
  'Inloggen mislukt. Probeer het opnieuw.': 'Signing in failed. Please try again.',
  'Te vaak een fout wachtwoord: dit account is dicht. Neem contact met ons op.': 'Too many wrong passwords: this account is locked. Please contact us.',
  'Te veel inlogpogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.': 'Too many sign-in attempts from this network. Please try again in a quarter of an hour.',
  'Dit verzoek komt niet van de app zelf.': 'This request did not come from the app itself.',
  'E-mailadres of wachtwoord klopt niet.': 'Email address or password is incorrect.',
}

/** Meldingen met een getal of tijd erin. */
const PATRONEN: readonly { nl: RegExp; en: (...d: string[]) => string }[] = [
  { nl: /^Maximaal (\d+) tekens\.$/, en: (n) => `No more than ${n} characters.` },
  { nl: /^Kies 1 tot (\d+) vestigingen\.$/, en: (n) => `Choose 1 to ${n} locations.` },
  { nl: /^Gebruik minstens (\d+) tekens\.$/, en: (n) => `Use at least ${n} characters.` },
  { nl: /^Gebruik hooguit (\d+) tekens\.$/, en: (n) => `Use no more than ${n} characters.` },
  { nl: /^Vul een aantal van 1 tot (\d+) in\.$/, en: (n) => `Enter a number from 1 to ${n}.` },
  { nl: /^Te vaak een fout wachtwoord\. Probeer het na (\d{1,2}:\d{2}) opnieuw\.$/, en: (t) => `Too many wrong passwords. Please try again after ${t}.` },
]

/** Een Nederlandse melding in een taal. Onbekend blijft Nederlands. */
export function meldingIn(nl: string, taal: Taal): string {
  if (taal === 'nl') return nl
  const vast = VAST[nl]
  if (vast) return vast
  for (const p of PATRONEN) {
    const m = p.nl.exec(nl)
    if (m) return p.en(...m.slice(1))
  }
  return nl
}

/** Heeft deze Nederlandse melding een Engelse vertaling? Voor de test. */
export function heeftVertaling(nl: string): boolean {
  return meldingIn(nl, 'en') !== nl
}

/** Fouten per veld in een taal. */
export function foutenIn<K extends string>(fouten: Partial<Record<K, string>>, taal: Taal): Partial<Record<K, string>> {
  if (taal === 'nl') return fouten
  return Object.fromEntries(Object.entries(fouten).map(([veld, t]) => [veld, typeof t === 'string' ? meldingIn(t, taal) : t])) as Partial<Record<K, string>>
}

export interface Meldingen {
  fout?: string
  melding?: string
  fouten?: Partial<Record<string, string>>
}

/** Een API-antwoord met daarnaast `en`: dezelfde meldingen in het Engels. */
export function metEngels<T extends Meldingen>(data: T): T & { en?: Meldingen } {
  const en: Meldingen = {}
  if (typeof data.fout === 'string') en.fout = meldingIn(data.fout, 'en')
  if (typeof data.melding === 'string') en.melding = meldingIn(data.melding, 'en')
  if (data.fouten) en.fouten = foutenIn(data.fouten, 'en')
  return Object.keys(en).length > 0 ? { ...data, en } : data
}

/** In de browser: de meldingen uit een API-antwoord in de taal van de pagina. */
export function kiesMeldingen(json: unknown, taal: Taal): Meldingen {
  if (typeof json !== 'object' || json === null) return {}
  const d = json as Meldingen & { en?: unknown }
  const basis: Meldingen = {
    fout: typeof d.fout === 'string' ? d.fout : undefined,
    melding: typeof d.melding === 'string' ? d.melding : undefined,
    fouten: typeof d.fouten === 'object' && d.fouten !== null ? d.fouten : undefined,
  }
  if (taal === 'nl') return basis
  const en = typeof d.en === 'object' && d.en !== null ? (d.en as Meldingen) : {}
  return {
    fout: typeof en.fout === 'string' ? en.fout : basis.fout && meldingIn(basis.fout, taal),
    melding: typeof en.melding === 'string' ? en.melding : basis.melding && meldingIn(basis.melding, taal),
    fouten: typeof en.fouten === 'object' && en.fouten !== null ? en.fouten : basis.fouten && foutenIn(basis.fouten, taal),
  }
}
