// ─── AI Your Gym, demo: de zes stappen van de rondleiding (PUUR) ────────────
// Uitleg per scherm. Alleen wat het scherm echt laat zien of wat Club echt doet.

import type { DemoStapInfo } from './DemoStap'

export const DEMO_STAPPEN = {
  vandaag: {
    sleutel: 'vandaag',
    label: 'Vandaag',
    titel: 'Het eerste scherm van elke dienst.',
    uitleg: 'Wie er binnen is, welke lessen er zijn en wat je vandaag opvolgt.',
    punten: ['Lessen met bezetting en wachtlijst', 'Wie er werkt volgens het personeelsrooster', 'Leads die nog opgevolgd moeten worden'],
  },
  rooster: {
    sleutel: 'rooster',
    label: 'Lesrooster',
    titel: 'Een week groepslessen, met de bezetting erbij.',
    uitleg: 'Volle lessen zie je meteen. Leden reserveren zelf in de app.',
    punten: ['Per vestiging en per zaal', 'Wachtlijst bij volle lessen', 'Eigen regels voor annuleren en niet komen'],
  },
  lid: {
    sleutel: 'lid',
    label: 'Ledenkaart',
    titel: 'Alles over een lid op een kaart.',
    uitleg: 'Zo weet iedereen in het team waar een lid staat.',
    punten: ['Bezoek van de laatste 30 dagen en weken op rij', 'Schema en metingen van de trainer', 'Gezondheidsgegevens alleen met toestemming'],
  },
  schema: {
    sleutel: 'schema',
    label: 'Schema met coaching',
    titel: 'Een schema met een trainer erin.',
    uitleg: 'Per trainingsdag, met coaching uit onze bibliotheek bij elke oefening.',
    punten: ['Sets, herhalingen en rust per oefening', 'Bewegende beelden van begin- en eindhouding', 'Coaching die je zelf kunt aanpassen'],
  },
  cijfers: {
    sleutel: 'cijfers',
    label: 'Cijfers',
    titel: 'Cijfers per kalendermaand.',
    uitleg: 'Bezoek, actieve leden, bezetting en no-shows, van de eerste van de maand tot vandaag.',
    punten: ['Bezoeken per dag', 'Hoe leden inchecken', 'Rapporten ook als CSV'],
  },
  app: {
    sleutel: 'app',
    label: 'Ledenapp',
    titel: 'Wat hetzelfde lid in de app ziet.',
    uitleg: 'Volgende les, bezoek, QR-code, challenge en schema, in de kleur van Kernhal.',
    punten: ['Een web-app op het beginscherm', 'Inloggen met e-mail en wachtwoord', 'In jouw naam, logo en kleuren'],
  },
} as const satisfies Record<string, DemoStapInfo>

export type DemoStapSleutel = keyof typeof DEMO_STAPPEN
