// ─── AI Your Gym: de teksten van de startmails (PUUR) ───────────────────────
// Kort, feitelijk en zonder druk: geen "laatste kans", geen aftellen, alleen
// wat je kunt doen. Geen proefperiode (besluit Kane 30-10-2026), dus ook geen
// einddatum. Nooit een wachtwoord of geheime link in de mail.

import { PROEFMAIL_SOORTEN, volgnummer, type ProefmailSoort } from './planner'

export interface ProefmailGegevens {
  voornaam: string
  sportschool: string
  /** https://aiyourgym.com/<slug>/inloggen (of het subdomein). */
  inlogUrl: string
}

export interface Proefmail {
  onderwerp: string
  tekst: string
}

function inhoud(soort: ProefmailSoort, g: ProefmailGegevens): { onderwerp: string; regels: string[] } {
  switch (soort) {
    case 'dag1':
      return {
        onderwerp: `${g.sportschool}: waar je begint`,
        regels: [
          'Het snelst op weg kom je met de startwizard: een paar korte stappen. Je voortgang wordt steeds bewaard, dus je kunt stoppen en later verder.',
          `Log in op ${g.inlogUrl}. Loop je ergens vast? Onder elke stap staat "Ik kom er niet uit". Je vraag komt dan bij ons binnen en het antwoord lees je bij Hulp in Club.`,
        ],
      }
    case 'dag3':
      return {
        onderwerp: 'Heb je je leden al ingelezen?',
        regels: [
          'Met je eigen leden erin wordt Club pas echt van jou. Exporteer ze uit je huidige systeem als CSV, of kies gewoon je Excel-lijst (.xlsx).',
          'Je ziet eerst precies wat er verandert. Nieuwe leden worden toegevoegd, bestaande bijgewerkt, en er wordt nooit iemand verwijderd. In de startwizard is het stap 6; daar staat ook een voorbeeld dat niets opslaat.',
          `Inloggen: ${g.inlogUrl}`,
        ],
      }
    case 'dag7':
      return {
        onderwerp: 'Bekijk de ledenapp op je eigen telefoon',
        regels: [
          'Wil je zien wat je leden zien? Zet jezelf als lid in Club, maak op je ledenkaart de link voor de ledenapp en open die op je telefoon.',
          'Zet de app daarna op je beginscherm: in Safari via Delen en dan Zet op beginscherm, in Chrome via het menu en dan App installeren.',
          `Inloggen in Club: ${g.inlogUrl}`,
        ],
      }
  }
}

/** De mail voor deze soort. */
export function proefmailTekst(soort: ProefmailSoort, g: ProefmailGegevens): Proefmail {
  const { onderwerp, regels } = inhoud(soort, g)
  const tekst = [
    `Hoi ${g.voornaam},`,
    '',
    ...regels.flatMap((r) => [r, '']),
    'Vragen? Stel ze bij Hulp in Club, dan lezen we ze.',
    '',
    'Team AI Your Gym',
    '',
    `Dit is mail ${volgnummer(soort)} van ${PROEFMAIL_SOORTEN.length} om goed te starten.`,
  ].join('\n')
  return { onderwerp, tekst }
}
