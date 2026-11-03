import { woordenboek } from '../../woordenboek'

// De eerste-keer-uitleg in Club (opdracht Kane 30-10-2026): per rol hoogstens
// drie korte kaarten, wegklikbaar. Elke kaart: een kop, een korte regel en een
// knop. Sinds 03-11-2026 volgens de vijf plekken (docs/club/EENVOUD-10-MINUTEN.md):
// Vandaag, Leden, Rooster, Training en Beheer; Hulp onder het vraagteken in de
// kop; het Prikbord voor het team. De adressen achter de knoppen staan in
// src/components/club/welkom/WelkomVoorRol.tsx (doelen), in dezelfde volgorde.

export const WELKOM = woordenboek({
  nl: {
    label: 'Zo werkt het',
    stap: (nu: number, totaal: number) => `${nu} van ${totaal}`,
    volgende: 'Volgende',
    klaar: 'Begrepen',
    sluiten: 'Uitleg sluiten',
    // De ledenapp: een nieuw lid op Home.
    leden: [
      { kop: 'Boek een les', tekst: 'Bij Boeken tik je op een les om je plek vast te zetten.', knop: 'Naar Boeken' },
      { kop: 'Volg je schema', tekst: 'Bij Schema staan je oefeningen. Vink per set af wat je deed.', knop: 'Naar Schema' },
      { kop: 'Maak het je eigen', tekst: 'Zet een foto en je gegevens bij Profiel.', knop: 'Naar Profiel' },
    ],
    rollen: {
      manager: [
        { kop: 'Alles op vijf plekken', tekst: 'Vandaag, Leden, Rooster, Training en Beheer. Op je telefoon dezelfde vijf onderin.', knop: 'Naar Vandaag' },
        { kop: 'Je team op het Prikbord', tekst: 'Plaats een mededeling of werkwijze en zie wie hem bevestigde.', knop: 'Naar Prikbord' },
        { kop: 'Kwijt? Druk Ctrl K', tekst: 'Zoek een lid, scherm of instelling. Hulp staat onder het vraagteken rechtsboven.', knop: 'Naar Hulp' },
      ],
      trainer: [
        { kop: 'Begin op Vandaag', tekst: 'Bovenaan check je leden in. Daaronder je lessen, taken en wie je belt.', knop: 'Naar Check-in' },
        { kop: 'Lees het Prikbord', tekst: 'Mededelingen en werkwijzen voor het team. Bevestig wat je gelezen hebt.', knop: 'Naar Prikbord' },
        { kop: 'Alles van een lid op de ledenkaart', tekst: 'Notitie, intake en schema start je daar. Je afspraken staan in de Agenda.', knop: 'Naar Leden' },
      ],
      instructeur: [
        { kop: 'Je lessen staan bij Lessen', tekst: 'Kies Mijn lessen. Open een les om te zien wie er komt.', knop: 'Naar Mijn lessen' },
        { kop: 'Aanwezigheid afvinken', tekst: 'Vink in de les af wie er is. Wie al incheckte staat er al op.', knop: 'Naar Lessen' },
        { kop: 'Lees het Prikbord', tekst: 'Mededelingen, werkwijzen en de overdracht. Bevestig wat je gelezen hebt.', knop: 'Naar Prikbord' },
      ],
      roosteraar: [
        { kop: 'Diensten plannen', tekst: 'Klik in de week op een uur. Gaten vallen vanzelf op.', knop: 'Naar Diensten' },
        { kop: 'Snel een nieuwe week', tekst: 'Kopieer vorige week en pas alleen aan wat anders is.', knop: 'Naar Diensten' },
        { kop: 'Groepslessen bij Lessen', tekst: 'Een les verzetten of een vervanger kiezen doe je bij Lessen.', knop: 'Naar Lessen' },
      ],
      administratie: [
        { kop: 'Uren goedkeuren', tekst: 'Per medewerker gepland, gewerkt en contract naast elkaar. Keur goed wat klopt.', knop: 'Naar Uren' },
        { kop: 'Naar de salarisadministratie', tekst: 'Zet de uren op verwerkt en download de CSV. Andere exports staan bij Cijfers.', knop: 'Naar exports' },
        { kop: 'Lees het Prikbord', tekst: 'Mededelingen en werkwijzen voor het team. Bevestig wat je gelezen hebt.', knop: 'Naar Prikbord' },
      ],
      eigenaar: [
        { kop: 'Alles op vijf plekken', tekst: 'Vandaag, Leden, Rooster, Training en Beheer. Op je telefoon dezelfde vijf onderin.', knop: 'Naar Vandaag' },
        { kop: 'Je team op het Prikbord', tekst: 'Plaats een mededeling of werkwijze en zie wie hem bevestigde.', knop: 'Naar Prikbord' },
        { kop: 'Cijfers en instellingen in Beheer', tekst: 'Cijfers per maand met exports. Team, rollen en abonnement bij Instellingen.', knop: 'Naar Instellingen' },
      ],
    },
  },
  en: {
    label: 'How it works',
    stap: (nu: number, totaal: number) => `${nu} of ${totaal}`,
    volgende: 'Next',
    klaar: 'Got it',
    sluiten: 'Close the guide',
    leden: [
      { kop: 'Book a class', tekst: 'Under Book, tap a class to secure your spot.', knop: 'Go to Book' },
      { kop: 'Follow your programme', tekst: 'Your exercises are under Programme. Tick off each set you did.', knop: 'Go to Programme' },
      { kop: 'Make it yours', tekst: 'Add a photo and your details under Profile.', knop: 'Go to Profile' },
    ],
    rollen: {
      manager: [
        { kop: 'Everything in five places', tekst: 'Today, Members, Schedule, Training and Management. The same five at the bottom of your phone.', knop: 'Go to Today' },
        { kop: 'Your team on the Notice board', tekst: 'Post an announcement or procedure and see who confirmed it.', knop: 'Go to Notice board' },
        { kop: 'Lost? Press Ctrl K', tekst: 'Find a member, screen or setting. Help is under the question mark top right.', knop: 'Go to Help' },
      ],
      trainer: [
        { kop: 'Start on Today', tekst: 'Check members in at the top. Below are your classes, tasks and who to call.', knop: 'Go to Check-in' },
        { kop: 'Read the Notice board', tekst: 'Announcements and procedures for the team. Confirm what you have read.', knop: 'Go to Notice board' },
        { kop: 'Everything about a member on the member card', tekst: 'Start a note, intake or programme there. Your appointments are in the Calendar.', knop: 'Go to Members' },
      ],
      instructeur: [
        { kop: 'Your classes are under Classes', tekst: 'Choose My classes. Open a class to see who is coming.', knop: 'Go to My classes' },
        { kop: 'Mark attendance', tekst: 'Tick off who is there in the class. Anyone who checked in is already marked.', knop: 'Go to Classes' },
        { kop: 'Read the Notice board', tekst: 'Announcements, procedures and the handover. Confirm what you have read.', knop: 'Go to Notice board' },
      ],
      roosteraar: [
        { kop: 'Plan shifts', tekst: 'Click an hour in the week. Gaps stand out on their own.', knop: 'Go to Shifts' },
        { kop: 'A new week, fast', tekst: 'Copy last week and only change what is different.', knop: 'Go to Shifts' },
        { kop: 'Group classes under Classes', tekst: 'Move a class or pick a substitute under Classes.', knop: 'Go to Classes' },
      ],
      administratie: [
        { kop: 'Approve hours', tekst: 'Per staff member: planned, worked and contract side by side. Approve what is right.', knop: 'Go to Hours' },
        { kop: 'To payroll', tekst: 'Mark the hours as processed and download the CSV. Other exports are under Metrics.', knop: 'Go to exports' },
        { kop: 'Read the Notice board', tekst: 'Announcements and procedures for the team. Confirm what you have read.', knop: 'Go to Notice board' },
      ],
      eigenaar: [
        { kop: 'Everything in five places', tekst: 'Today, Members, Schedule, Training and Management. The same five at the bottom of your phone.', knop: 'Go to Today' },
        { kop: 'Your team on the Notice board', tekst: 'Post an announcement or procedure and see who confirmed it.', knop: 'Go to Notice board' },
        { kop: 'Metrics and settings in Management', tekst: 'Monthly metrics with exports. Team, roles and subscription under Settings.', knop: 'Go to Settings' },
      ],
    },
  },
})
