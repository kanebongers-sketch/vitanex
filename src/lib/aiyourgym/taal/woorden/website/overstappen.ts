// De pagina Overstappen (src/app/(aiyourgym)/(website)/aiyourgym/(site)/overstappen/page.tsx).
// Alleen wat echt zo is gebouwd: ledenimport (src/lib/club/leden/import), de
// startwizard (src/lib/club/start), uitnodigen per mail. Incasso, abonnementen en
// betalingen van leden blijven in het huidige systeem van de club. Niet
// "ledenadministratie" noemen: zo heet ook ons pakket (verwarrend).

import { woordenboek } from '../../woordenboek'

export const OVERSTAPPEN = woordenboek({
  nl: {
    metaTitel: 'Overstappen',
    metaOmschrijving:
      'Zo stap je over op AI Your Gym: aanmelden, je ledenbestand inlezen als CSV of Excel en live met de startwizard. Incasso en abonnementen blijven in je huidige systeem.',
    label: 'Overstappen',
    titel: 'Overstappen zonder dat je club stilvalt.',
    tekst: 'Incasso en abonnementen blijven in je huidige systeem. Je ziet steeds eerst wat er gebeurt.',
    begin: 'Start je club',
    stappenLabel: 'In drie stappen',
    stappenTitel: 'Van export naar een draaiende club.',
    importLabel: 'Een ledenbestand inlezen: kolommen uit het bestand gekoppeld aan velden, met het aantal nieuwe, bijgewerkte, ongewijzigde en dubbele leden',
    stappen: [
      {
        titel: 'Maak je omgeving aan',
        tekst: `Kies een pakket en je adres, zoals aiyourgym.com/jouwgym. Geen opstartkosten.`,
      },
      {
        titel: 'Lees je ledenbestand in',
        tekst: 'CSV of Excel. Gangbare kolommen worden herkend, en er wordt nooit iemand verwijderd.',
      },
      {
        titel: 'Team en leden erbij',
        tekst: 'Je team krijgt een uitnodiging per mail, je leden de poster met QR-code.',
      },
    ],
    checklistKop: 'Gratis overstapchecklist',
    checklistTekst: 'Van voorbereiden tot de eerste maand. Zonder account, ook te printen.',
    vragenLabel: 'Vragen',
    vragenTitel: 'Over overstappen.',
    vragen: [
      {
        vraag: 'Moet ik stoppen met mijn huidige systeem?',
        antwoord: 'Nee. Incasso, abonnementen en betalingen blijven in je huidige systeem. AI Your Gym werkt ernaast.',
      },
      {
        vraag: 'Wat als mijn bestand andere kolomnamen heeft?',
        antwoord: 'Gangbare namen worden herkend. De rest koppel je zelf, voordat er iets wordt opgeslagen.',
      },
      {
        vraag: 'Krijg ik hulp bij de start?',
        antwoord: 'De startwizard helpt bij elke stap. Wil je dat we meekijken, dan helpen we je ook persoonlijk.',
      },
    ],
    bandTitel: 'Klaar om over te stappen?',
  },
  en: {
    metaTitel: 'Switching',
    metaOmschrijving:
      'How to switch to AI Your Gym: sign up, import your member file as CSV or Excel and go live with the set-up wizard. Direct debits and memberships stay in your current system.',
    label: 'Switching',
    titel: 'Switch without your club standing still.',
    tekst: 'Direct debits and memberships stay in your current system. You always see what will happen first.',
    begin: 'Start your club',
    stappenLabel: 'In three steps',
    stappenTitel: 'From export to a club that runs.',
    importLabel: 'Importing a member file: columns from the file matched to fields, with the number of new, updated, unchanged and duplicate members',
    stappen: [
      {
        titel: 'Create your environment',
        tekst: `Choose a plan and your address, such as aiyourgym.com/yourgym. No set-up fee.`,
      },
      {
        titel: 'Import your member file',
        tekst: 'CSV or Excel. Common columns are recognised, and nobody is ever deleted.',
      },
      {
        titel: 'Bring in team and members',
        tekst: 'Your team gets an invitation by email, your members the poster with the QR code.',
      },
    ],
    checklistKop: 'Free switching checklist',
    checklistTekst: 'From preparing to the first month. No account needed, and printable.',
    vragenLabel: 'Questions',
    vragenTitel: 'About switching.',
    vragen: [
      {
        vraag: 'Do I have to stop using my current system?',
        antwoord: 'No. Direct debits, memberships and payments stay in your current system. AI Your Gym works alongside it.',
      },
      {
        vraag: 'What if my file has different column names?',
        antwoord: 'Common names are recognised. You match the rest yourself, before anything is saved.',
      },
      {
        vraag: 'Do I get help getting started?',
        antwoord: 'The set-up wizard helps at every step. Would you like us to take a look with you, we also help you personally.',
      },
    ],
    bandTitel: 'Ready to switch?',
  },
})
