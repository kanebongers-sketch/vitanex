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
      'Zo stap je over op AI Your Gym: aanmelden, de startwizard in acht stappen, je ledenbestand inlezen als CSV of Excel en je team uitnodigen per mail. Met hulp bij de start.',
    label: 'Overstappen',
    titel: 'Overstappen zonder dat je club stilvalt.',
    tekst: 'Je ledenadministratie blijft gewoon draaien. Stap voor stap zet je je club erin, en je ziet steeds eerst wat er gebeurt.',
    begin: (dagen: number) => `Begin met ${dagen} dagen gratis`,
    stappenLabel: 'In zes stappen',
    stappenTitel: 'Van export naar een draaiende club.',
    importLabel: 'Een ledenbestand inlezen: kolommen uit het bestand gekoppeld aan velden, met het aantal nieuwe, bijgewerkte, ongewijzigde en dubbele leden',
    stappen: [
      {
        titel: 'Maak je omgeving aan',
        tekst: `Je kiest een pakket en je eigen adres, zoals aiyourgym.com/jouwgym. Je omgeving staat direct klaar en je probeert alles ${PROEFDAGEN} dagen gratis.`,
      },
      {
        titel: 'Kies je soort sportschool',
        tekst:
          'Hier begint de startwizard. Gym, boutique, PT-studio, keten of iets anders: onderdelen, lestypen, openingstijden en rechten staan daarna alvast klaar. Je kiest ook een streefdatum om live te gaan.',
      },
      {
        titel: 'Huisstijl, vestiging en lessen',
        tekst: 'Logo, kleur en adres. Per vestiging de openingstijden en de regels voor reserveren. Je lestypen en je vaste week met zaal en instructeur zet je direct in de wizard.',
      },
      {
        titel: 'Haal je team erbij',
        tekst:
          'Trainers, groepslesinstructeurs en clubmanagers. Je nodigt ze in de wizard uit: ze krijgen een mail met een link om hun wachtwoord te kiezen. De eigenaar bepaalt wat elke rol ziet.',
      },
      {
        titel: 'Lees je ledenbestand in',
        tekst:
          'Exporteer je leden als CSV uit je huidige systeem, of kies je Excel-lijst (.xlsx). AI Your Gym herkent de gangbare kolommen en je koppelt de rest met de hand. Je ziet eerst precies wat er verandert: nieuwe leden komen erbij, bestaande worden bijgewerkt, er wordt nooit iemand verwijderd.',
      },
      {
        titel: 'Live, en je leden op de app',
        tekst:
          'Pas als alles echt staat, staat je sportschool live en gaat de rest van Club open. Dan print je de poster met QR-code, nodig je je leden uit voor de app en check je de eerste leden in. De oefenbibliotheek met coaching staat al klaar voor je schema’s.',
      },
    ],
    checklistKop: 'Gratis overstapchecklist',
    checklistTekst: 'Alles wat je regelt, van voorbereiden tot de eerste maand. Zonder account, ook te printen.',
    vragenLabel: 'Vragen',
    vragenTitel: 'Over overstappen.',
    vragen: [
      {
        vraag: 'Moet ik stoppen met mijn ledenadministratie?',
        antwoord:
          'Nee. AI Your Gym werkt naast je ledenadministratie. Incasso, abonnementen en betalingen blijven daar. Je leest je leden in met een CSV- of Excel-bestand, en later opnieuw als er veel is veranderd.',
      },
      {
        vraag: 'Wat als mijn bestand andere kolomnamen heeft?',
        antwoord: 'Gangbare namen zoals Voornaam, First name of Roepnaam worden herkend. Elke andere kolom koppel je zelf aan het juiste veld, voordat er iets wordt opgeslagen.',
      },
      {
        vraag: 'Kan ik eerst rustig proberen?',
        antwoord: `Ja. Je hebt ${PROEFDAGEN} dagen om alles uit te proberen met je eigen team.`,
      },
      {
        vraag: 'Krijg ik hulp bij de start?',
        antwoord:
          'Een startwizard leidt je in acht stappen door de inrichting, met hulp bij elke stap. In de pakketten Club en Keten zit daarnaast persoonlijke hulp, zonder extra kosten: we lopen je ledenbestand, je rooster en je eerste schema’s samen met je door, zodat je club goed staat voordat je leden de app krijgen.',
      },
    ],
    bandTitel: 'Klaar om over te stappen?',
  },
  en: {
    metaTitel: 'Switching',
    metaOmschrijving:
      'How to switch to AI Your Gym: sign up, the start wizard in eight steps, import your member file as CSV or Excel and invite your team by email. With help getting started.',
    label: 'Switching',
    titel: 'Switch without your club standing still.',
    tekst: 'Your membership administration keeps running as normal. You bring your club in step by step, and you always see what will happen first.',
    begin: (dagen: number) => `Start with ${dagen} days free`,
    stappenLabel: 'In six steps',
    stappenTitel: 'From export to a club that runs.',
    importLabel: 'Importing a member file: columns from the file matched to fields, with the number of new, updated, unchanged and duplicate members',
    stappen: [
      {
        titel: 'Create your environment',
        tekst: `You choose a plan and your own address, such as aiyourgym.com/yourgym. Your environment is ready straight away and you try everything free for ${PROEFDAGEN} days.`,
      },
      {
        titel: 'Choose your kind of gym',
        tekst:
          'This is where the start wizard begins. Gym, boutique, PT studio, chain or something else: sections, class types, opening hours and permissions are then set up for you. You also choose a target date to go live.',
      },
      {
        titel: 'Branding, location and classes',
        tekst: 'Logo, colour and address. For each location, the opening hours and the booking rules. You set up your class types and your regular week with room and instructor directly in the wizard.',
      },
      {
        titel: 'Bring your team in',
        tekst:
          'Trainers, group class instructors and club managers. You invite them in the wizard: they receive an email with a link to choose their password. The owner decides what each role can see.',
      },
      {
        titel: 'Import your member file',
        tekst:
          'Export your members as CSV from your current system, or choose your Excel list (.xlsx). AI Your Gym recognises the common columns and you match the rest by hand. You see exactly what will change first: new members are added, existing ones are updated, and nobody is ever deleted.',
      },
      {
        titel: 'Live, with your members on the app',
        tekst:
          'Only when everything is really in place does your gym go live and the rest of Club open up. Then you print the poster with the QR code, invite your members to the app and check in your first members. The exercise library with coaching is already there for your programmes.',
      },
    ],
    checklistKop: 'Free switching checklist',
    checklistTekst: 'Everything you need to arrange, from preparing to the first month. No account needed, and printable too.',
    vragenLabel: 'Questions',
    vragenTitel: 'About switching.',
    vragen: [
      {
        vraag: 'Do I have to stop using my membership administration?',
        antwoord:
          'No. AI Your Gym works alongside your membership administration. Direct debits, memberships and payments stay there. You import your members from a CSV or Excel file, and again later if a lot has changed.',
      },
      {
        vraag: 'What if my file has different column names?',
        antwoord: 'Common names such as Voornaam, First name or Roepnaam are recognised. You match any other column to the right field yourself, before anything is saved.',
      },
      {
        vraag: 'Can I take my time and try it first?',
        antwoord: `Yes. You have ${PROEFDAGEN} days to try everything with your own team.`,
      },
      {
        vraag: 'Do I get help getting started?',
        antwoord:
          'A start wizard guides you through the set-up in eight steps, with help at every step. The Club and Keten plans also include personal help at no extra cost: together we go through your member file, your timetable and your first programmes, so your club is in good shape before your members get the app.',
      },
    ],
    bandTitel: 'Ready to switch?',
  },
})
