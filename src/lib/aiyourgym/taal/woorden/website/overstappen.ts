// De pagina Overstappen (src/app/(aiyourgym)/(website)/aiyourgym/(site)/overstappen/page.tsx).
// Alleen wat echt zo is gebouwd: ledenimport (src/lib/club/leden/import), de
// startwizard (src/lib/club/start), uitnodigen per mail. Ledenadministratie,
// incasso en abonnementen blijven waar ze nu zijn.

import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { woordenboek } from '../../woordenboek'

export const OVERSTAPPEN = woordenboek({
  nl: {
    metaTitel: 'Overstappen',
    metaOmschrijving:
      'Zo stap je over op AI Your Gym: aanmelden, je ledenbestand inlezen als CSV of Excel en live met de startwizard. Je ledenadministratie blijft draaien.',
    label: 'Overstappen',
    titel: 'Overstappen zonder dat je club stilvalt.',
    tekst: 'Je ledenadministratie blijft draaien. Je ziet steeds eerst wat er gebeurt.',
    begin: (dagen: number) => `Begin met ${dagen} dagen gratis`,
    stappenLabel: 'In drie stappen',
    stappenTitel: 'Van export naar een draaiende club.',
    importLabel: 'Een ledenbestand inlezen: kolommen uit het bestand gekoppeld aan velden, met het aantal nieuwe, bijgewerkte, ongewijzigde en dubbele leden',
    stappen: [
      {
        titel: 'Maak je omgeving aan',
        tekst: `Kies een pakket en je adres, zoals aiyourgym.com/jouwgym. ${PROEFDAGEN} dagen gratis.`,
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
        vraag: 'Moet ik stoppen met mijn ledenadministratie?',
        antwoord: 'Nee. Incasso, abonnementen en betalingen blijven daar. AI Your Gym werkt ernaast.',
      },
      {
        vraag: 'Wat als mijn bestand andere kolomnamen heeft?',
        antwoord: 'Gangbare namen worden herkend. De rest koppel je zelf, voordat er iets wordt opgeslagen.',
      },
      {
        vraag: 'Krijg ik hulp bij de start?',
        antwoord: 'De startwizard helpt bij elke stap. In Club en Keten zit ook persoonlijke hulp, zonder extra kosten.',
      },
    ],
    bandTitel: 'Klaar om over te stappen?',
  },
  en: {
    metaTitel: 'Switching',
    metaOmschrijving:
      'How to switch to AI Your Gym: sign up, import your member file as CSV or Excel and go live with the set-up wizard. Your membership administration keeps running.',
    label: 'Switching',
    titel: 'Switch without your club standing still.',
    tekst: 'Your membership administration keeps running. You always see what will happen first.',
    begin: (dagen: number) => `Start with ${dagen} days free`,
    stappenLabel: 'In three steps',
    stappenTitel: 'From export to a club that runs.',
    importLabel: 'Importing a member file: columns from the file matched to fields, with the number of new, updated, unchanged and duplicate members',
    stappen: [
      {
        titel: 'Create your environment',
        tekst: `Choose a plan and your address, such as aiyourgym.com/yourgym. ${PROEFDAGEN} days free.`,
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
        vraag: 'Do I have to stop using my membership administration?',
        antwoord: 'No. Direct debits, memberships and payments stay there. AI Your Gym works alongside it.',
      },
      {
        vraag: 'What if my file has different column names?',
        antwoord: 'Common names are recognised. You match the rest yourself, before anything is saved.',
      },
      {
        vraag: 'Do I get help getting started?',
        antwoord: 'The set-up wizard helps at every step. Club and Keten also include personal help, at no extra cost.',
      },
    ],
    bandTitel: 'Ready to switch?',
  },
})
