import { woordenboek } from '../../woordenboek'

// De eerste-keer-uitleg in Club (opdracht Kane 30-10-2026): per rol hoogstens
// drie korte kaarten, wegklikbaar. Elke kaart: een kop, een zin en een knop.
// De adressen achter de knoppen staan in src/components/club/welkom/paden.ts,
// in dezelfde volgorde.

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
        { kop: 'Vandaag is je startpunt', tekst: 'Lessen, wie er werkt, taken en wie je belt staan op een scherm.', knop: 'Naar Vandaag' },
        { kop: 'Zoek alles met Ctrl K', tekst: 'Een lid, een pagina of een instelling: typ een paar letters.', knop: 'Naar Leden' },
        { kop: 'Instellen op een plek', tekst: 'Team, rooster en regels staan onder Instellingen, onderaan het scherm.', knop: 'Naar Instellingen' },
      ],
      trainer: [
        { kop: 'Begin op Vandaag', tekst: 'Je lessen, je taken en wie je vandaag belt staan op een scherm.', knop: 'Naar Vandaag' },
        { kop: 'Een lid inchecken', tekst: 'Scan de QR-code uit de app of typ een naam bij Check-in.', knop: 'Naar Check-in' },
        { kop: 'Alles van een lid op de ledenkaart', tekst: 'Open een lid. Schema, intake en notities start je daar.', knop: 'Naar Leden' },
      ],
      instructeur: [
        { kop: 'Je lessen staan bij Groepslessen', tekst: 'Tik op Mijn lessen. Open een les om te zien wie er komt.', knop: 'Naar Groepslessen' },
        { kop: 'Aanwezigheid afvinken', tekst: 'Vink in de les af wie er is. Wie al incheckte staat er al op.', knop: 'Naar Groepslessen' },
        { kop: 'Lees de overdracht', tekst: 'Wat collega\'s doorgeven staat op Vandaag.', knop: 'Naar Vandaag' },
      ],
      roosteraar: [
        { kop: 'Diensten plannen', tekst: 'Klik in het weekrooster op een uur. Gaten vallen vanzelf op.', knop: 'Naar Personeel' },
        { kop: 'Snel een nieuwe week', tekst: 'Kopieer vorige week en pas alleen aan wat anders is.', knop: 'Naar Personeel' },
        { kop: 'Groepslessen', tekst: 'Een les verzetten of een vervanger kiezen doe je bij Groepslessen.', knop: 'Naar Groepslessen' },
      ],
      administratie: [
        { kop: 'De uren per periode', tekst: 'Per medewerker: gepland, gewerkt en het contract naast elkaar.', knop: 'Naar Uren' },
        { kop: 'Goedkeuren', tekst: 'Keur goed wat klopt. Afwijkingen open je en keur je apart goed.', knop: 'Naar Uren' },
        { kop: 'Naar de salarisadministratie', tekst: 'Download de CSV en zet de uren op verwerkt. Dan liggen ze vast.', knop: 'Naar Uren' },
      ],
      eigenaar: [
        { kop: 'Je cijfers', tekst: 'Groei, bezoek en behoud per maand op een scherm.', knop: 'Naar Cijfers' },
        { kop: 'Team en rollen', tekst: 'Nodig je team uit en kies per rol wat ze zien.', knop: 'Naar Team' },
        { kop: 'Je abonnement', tekst: 'Je pakketten en facturen staan bij Instellingen.', knop: 'Naar Abonnement' },
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
        { kop: 'Today is where you start', tekst: 'Classes, who is working, tasks and who to call on one screen.', knop: 'Go to Today' },
        { kop: 'Find anything with Ctrl K', tekst: 'A member, a page or a setting: type a few letters.', knop: 'Go to Members' },
        { kop: 'Set up in one place', tekst: 'Team, schedule and rules live under Settings, at the bottom of the screen.', knop: 'Go to Settings' },
      ],
      trainer: [
        { kop: 'Start on Today', tekst: 'Your classes, your tasks and who to call today on one screen.', knop: 'Go to Today' },
        { kop: 'Check in a member', tekst: 'Scan the QR code from the app or type a name at Check-in.', knop: 'Go to Check-in' },
        { kop: 'Everything about a member on the member card', tekst: 'Open a member. Start a programme, intake or note from there.', knop: 'Go to Members' },
      ],
      instructeur: [
        { kop: 'Your classes are under Group classes', tekst: 'Tap My classes. Open a class to see who is coming.', knop: 'Go to Group classes' },
        { kop: 'Mark attendance', tekst: 'Tick off who is there in the class. Anyone who checked in is already marked.', knop: 'Go to Group classes' },
        { kop: 'Read the handover', tekst: 'What colleagues pass on is on Today.', knop: 'Go to Today' },
      ],
      roosteraar: [
        { kop: 'Plan shifts', tekst: 'Click an hour in the week schedule. Gaps stand out on their own.', knop: 'Go to Staff' },
        { kop: 'A new week, fast', tekst: 'Copy last week and only change what is different.', knop: 'Go to Staff' },
        { kop: 'Group classes', tekst: 'Move a class or pick a substitute under Group classes.', knop: 'Go to Group classes' },
      ],
      administratie: [
        { kop: 'Hours per period', tekst: 'Per staff member: planned, worked and contract side by side.', knop: 'Go to Hours' },
        { kop: 'Approve', tekst: 'Approve what is right. Open differences and approve them one by one.', knop: 'Go to Hours' },
        { kop: 'To payroll', tekst: 'Download the CSV and mark the hours as processed. Then they are locked.', knop: 'Go to Hours' },
      ],
      eigenaar: [
        { kop: 'Your metrics', tekst: 'Growth, visits and retention per month on one screen.', knop: 'Go to Metrics' },
        { kop: 'Team and roles', tekst: 'Invite your team and choose what each role sees.', knop: 'Go to Team' },
        { kop: 'Your subscription', tekst: 'Your packages and invoices are under Settings.', knop: 'Go to Subscription' },
      ],
    },
  },
})
