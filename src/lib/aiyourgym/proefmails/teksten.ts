// ─── AI Your Gym: de teksten van de proefmails (PUUR) ───────────────────────
// Kort, feitelijk en zonder druk: geen "laatste kans", geen aftellen, alleen
// wat je kunt doen en de datum. Nooit een wachtwoord of geheime link in de mail.

import { nlDatum } from '../abonnement'
import { PROEFMAIL_SOORTEN, volgnummer, type ProefmailSoort } from './planner'

export interface ProefmailGegevens {
  voornaam: string
  sportschool: string
  /** https://aiyourgym.com/<slug>/inloggen (of het subdomein). */
  inlogUrl: string
  /** De abonnementspagina in Club. */
  abonnementUrl: string
  einde: Date
  /** Loopt er een abonnement via Stripe (dan volgt na de proefperiode de eerste betaling)? */
  metBetaling: boolean
}

export interface Proefmail {
  onderwerp: string
  tekst: string
}

function inhoud(soort: ProefmailSoort, g: ProefmailGegevens): { onderwerp: string; regels: string[] } {
  const datum = nlDatum(g.einde)
  switch (soort) {
    case 'dag1':
      return {
        onderwerp: `${g.sportschool}: waar je begint`,
        regels: [
          'Het snelst op weg kom je met de startwizard: acht korte stappen, elk over te slaan. Je voortgang wordt steeds bewaard, dus je kunt stoppen en later verder.',
          `Log in op ${g.inlogUrl}. Loop je ergens vast? Onder elke stap staat "Ik kom er niet uit". Je vraag komt dan bij ons binnen en het antwoord lees je bij Hulp in Club.`,
          `Je proefperiode loopt tot ${datum}.`,
        ],
      }
    case 'dag3':
      return {
        onderwerp: 'Heb je je leden al ingelezen?',
        regels: [
          'Met je eigen leden erin wordt Club pas echt van jou. Exporteer ze uit je huidige systeem als CSV, of kies gewoon je Excel-lijst (.xlsx).',
          'Je ziet eerst precies wat er verandert. Nieuwe leden worden toegevoegd, bestaande bijgewerkt, en er wordt nooit iemand verwijderd. In de startwizard is het stap 7; daar staat ook een voorbeeld dat niets opslaat.',
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
    case 'einde':
      return {
        onderwerp: `Je proefperiode loopt tot ${datum}`,
        regels: g.metBetaling
          ? [
              `Je proefperiode van ${g.sportschool} loopt tot ${datum}. Daarna loopt je abonnement door en volgt de eerste betaling vanzelf, zoals bij het aanmelden afgesproken.`,
              `Wil je niet verder? Zeg dan voor ${datum} op bij Abonnement in Club: ${g.abonnementUrl}. Er wordt dan niets afgeschreven.`,
              'Wil je wel verder? Dan hoef je niets te doen.',
            ]
          : [
              `Je proefperiode van ${g.sportschool} loopt tot ${datum}.`,
              'Online betalen is nog niet gekoppeld, dus er wordt niets afgeschreven. We spreken samen af hoe je daarna verder betaalt; tot die tijd blijft alles gewoon werken.',
              `Je abonnement zie je in Club: ${g.abonnementUrl}`,
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
    `Dit is mail ${volgnummer(soort)} van ${PROEFMAIL_SOORTEN.length} in je proefperiode.`,
  ].join('\n')
  return { onderwerp, tekst }
}
