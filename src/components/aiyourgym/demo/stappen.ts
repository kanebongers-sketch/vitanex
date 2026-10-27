// ─── AI Your Gym, demo: de zes stappen van de rondleiding (PUUR) ────────────
// Uitleg per scherm. Alleen wat het scherm echt laat zien of wat Club echt doet.

import type { DemoStapInfo } from './DemoStap'

export const DEMO_STAPPEN = {
  vandaag: {
    sleutel: 'vandaag',
    label: 'Vandaag',
    titel: 'Het eerste scherm van elke dienst.',
    uitleg: 'Wie er binnen is, welke lessen er zijn, wie er werkt en welke leads je vandaag opvolgt. Per vestiging, in een oogopslag.',
    punten: ['Lessen met bezetting en wachtlijst', 'Wie er werkt volgens het personeelsrooster', 'Leads die nog opgevolgd moeten worden'],
  },
  rooster: {
    sleutel: 'rooster',
    label: 'Lesrooster',
    titel: 'Een week groepslessen, met de bezetting erbij.',
    uitleg: 'Elke les met zaal, tijd en het aantal plekken. Volle lessen zie je meteen, leden reserveren zelf in de app.',
    punten: ['Per vestiging en per zaal', 'Wachtlijst bij volle lessen', 'Eigen regels voor annuleren en niet komen'],
  },
  lid: {
    sleutel: 'lid',
    label: 'Ledenkaart',
    titel: 'Alles over een lid op een kaart.',
    uitleg: 'Status, lidmaatschap, bezoek, het schema en de laatste meting. Zo weet iedereen in het team waar een lid staat.',
    punten: ['Bezoek van de laatste 30 dagen en weken op rij', 'Schema en metingen van de trainer', 'Gezondheidsgegevens alleen met toestemming'],
  },
  schema: {
    sleutel: 'schema',
    label: 'Schema met coaching',
    titel: 'Een schema met een trainer erin.',
    uitleg: 'Het schema van dit lid, per trainingsdag. Bij elke oefening de coaching uit onze bibliotheek: kernpunten, een veelgemaakte fout, ademhaling en tempo.',
    punten: ['Sets, herhalingen en rust per oefening', 'Bewegende beelden van begin- en eindhouding', 'Coaching die je zelf kunt aanpassen'],
  },
  cijfers: {
    sleutel: 'cijfers',
    label: 'Cijfers',
    titel: 'Cijfers per kalendermaand.',
    uitleg: 'Bezoeken, actieve leden, bezetting van lessen en niet gekomen. Steeds van de eerste van de maand tot vandaag.',
    punten: ['Bezoeken per dag', 'Hoe leden inchecken', 'Rapporten ook als CSV'],
  },
  app: {
    sleutel: 'app',
    label: 'Ledenapp',
    titel: 'Wat hetzelfde lid in de app ziet.',
    uitleg: 'De ledenapp in de kleur van Kernhal: de volgende les, bezoek deze maand, de QR-code om in te checken, de challenge en het schema.',
    punten: ['Een web-app op het beginscherm', 'Inloggen met e-mail en wachtwoord', 'In jouw naam, logo en kleuren'],
  },
} as const satisfies Record<string, DemoStapInfo>

export type DemoStapSleutel = keyof typeof DEMO_STAPPEN
