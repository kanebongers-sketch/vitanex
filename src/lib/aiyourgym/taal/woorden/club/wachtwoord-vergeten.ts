import { woordenboek } from '../../woordenboek'

// De mail van "wachtwoord vergeten" voor een eigenaar, clubmanager of
// medewerker (src/lib/club/wachtwoord-vergeten). De taal is die van de pagina
// waar de aanvraag vandaan kwam.

export const VERGETEN_MAIL = woordenboek({
  nl: {
    onderwerp: (sportschool: string) => `Nieuw wachtwoord voor ${sportschool}`,
    daar: 'daar',
    aanhef: (voornaam: string) => `Hoi ${voornaam},`,
    aangevraagd: (sportschool: string) => `Je vroeg een nieuw wachtwoord aan voor ${sportschool}.`,
    open: (link: string) => `Open deze link en kies een nieuw wachtwoord: ${link}`,
    geldig: 'De link werkt een keer en is een uur geldig. Tot je een nieuw wachtwoord kiest, blijft je oude wachtwoord werken.',
    nietZelf: 'Vroeg je dit niet zelf aan? Dan kun je deze mail negeren. Er verandert niets.',
  },
  en: {
    onderwerp: (sportschool: string) => `New password for ${sportschool}`,
    daar: 'there',
    aanhef: (voornaam: string) => `Hi ${voornaam},`,
    aangevraagd: (sportschool: string) => `You asked for a new password for ${sportschool}.`,
    open: (link: string) => `Open this link and choose a new password: ${link}`,
    geldig: 'The link works once and is valid for one hour. Your old password keeps working until you choose a new one.',
    nietZelf: 'Did you not ask for this? Then you can ignore this email. Nothing changes.',
  },
})
