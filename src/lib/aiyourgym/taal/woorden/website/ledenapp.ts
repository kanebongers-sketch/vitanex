// De pagina Ledenapp ((site)/ledenapp/page.tsx). Alleen wat de ledenapp echt doet
// (src/components/club/app/**, src/lib/club/ledenlogin/**); het Engels zegt precies
// hetzelfde, niets meer.

import { woordenboek } from '../../woordenboek'

export const LEDENAPP_PAGINA = woordenboek({
  nl: {
    metaTitel: 'Ledenapp',
    metaOmschrijving:
      'De ledenapp van AI Your Gym: een web-app op het beginscherm in de huisstijl van je sportschool. Inchecken, lessen en afspraken boeken, schema met coaching, voeding en voortgang.',
    label: 'Ledenapp',
    titel: 'Jouw sportschool op het beginscherm.',
    tekst: 'Een app in jouw naam en kleuren. Inchecken, boeken en trainen in een.',
    demoKnop: 'Bekijk de app in de demo',
    schermenLabel: 'De ledenapp op vier schermen',
    voorbeelden: 'Schermvoorbeelden met voorbeeldgegevens',
    schermen: {
      inloggen: { titel: 'Inloggen', label: 'Inloggen: het lid logt in met e-mailadres en een eigen wachtwoord' },
      home: { titel: 'Home', label: 'Home: volgende les, bezoeken deze maand, weken op rij, QR-code en een challenge' },
      schema: { titel: 'Schema', label: 'Schema: dag A met vier oefeningen, twee afgevinkt' },
      voeding: { titel: 'Voeding', label: 'Voeding: calorieen per dag, eiwit, koolhydraten en vet, en de maaltijden' },
    },
    instapLabel: 'Zo komt een lid erin',
    instapTitel: 'Geen app store, wel veilig.',
    instapTekst: 'Leden loggen in met hun e-mailadres en een eigen wachtwoord.',
    instap: [
      { titel: 'Een uitnodiging', tekst: 'Per mail, via de ledenkaart of de poster bij de balie. Zeven dagen geldig.' },
      { titel: 'Een eigen wachtwoord', tekst: 'Het lid kiest zelf een sterk wachtwoord. Zwakke worden geweigerd.' },
      { titel: 'Op het beginscherm', tekst: 'Met een tik op de telefoon, 90 dagen ingelogd.' },
    ],
    functiesLabel: 'In de app',
    functiesTitel: 'Alles wat een lid zelf wil regelen.',
    functiesTekst: 'Minder vragen aan de balie.',
    functies: {
      inchecken: { titel: 'Inchecken en boeken', tekst: 'QR-code op het startscherm, lessen met wachtlijst en afspraken met een trainer. Bevestiging per mail.' },
      schema: { titel: 'Schema en voeding', tekst: 'Het schema van de trainer met coaching bij elke oefening, per set in te vullen, en het voedingsplan.' },
      voortgang: { titel: 'Voortgang en challenges', tekst: 'Trainingen, lichaamsmaten en doelen zoals weken op rij.' },
    },
    vragenLabel: 'Vragen',
    vragenTitel: 'Goed om te weten.',
    vragen: [
      {
        vraag: 'Moeten leden iets downloaden?',
        antwoord: 'Nee. Het is een web-app: link openen en met een tik op het beginscherm zetten. Geen app store nodig.',
      },
      {
        vraag: 'Wat ziet een lid van zijn metingen?',
        antwoord: 'Alleen de eigen maten en trainingen. Gezondheidsgegevens en notities van de trainer blijven bij het team.',
      },
      {
        vraag: 'Wat als een lid zijn telefoon kwijt is?',
        antwoord: 'Maak op de ledenkaart een nieuwe link. Alle toestellen worden uitgelogd en de oude link werkt niet meer.',
      },
    ],
    band: 'Geef je leden een app met jouw naam erop.',
  },
  en: {
    metaTitel: 'Member app',
    metaOmschrijving:
      'The AI Your Gym member app: a web app on the home screen in your gym’s branding. Check in, book classes and appointments, a programme with coaching, nutrition and progress.',
    label: 'Member app',
    titel: 'Your gym on their home screen.',
    tekst: 'An app in your name and colours. Check in, book and train in one place.',
    demoKnop: 'See the app in the demo',
    schermenLabel: 'The member app on four screens',
    voorbeelden: 'Example screens with sample data',
    schermen: {
      inloggen: { titel: 'Sign in', label: 'Sign in: the member signs in with an email address and their own password' },
      home: { titel: 'Home', label: 'Home: next class, visits this month, weeks in a row, QR code and a challenge' },
      schema: { titel: 'Programme', label: 'Programme: day A with four exercises, two ticked off' },
      voeding: { titel: 'Nutrition', label: 'Nutrition: calories per day, protein, carbohydrates and fat, and the meals' },
    },
    instapLabel: 'How a member gets in',
    instapTitel: 'No app store, still secure.',
    instapTekst: 'Members sign in with their email address and their own password.',
    instap: [
      { titel: 'An invitation', tekst: 'By email, from the member card or the poster at the front desk. Valid for seven days.' },
      { titel: 'Their own password', tekst: 'The member chooses a strong password. Weak ones are refused.' },
      { titel: 'On the home screen', tekst: 'One tap onto their phone, signed in for 90 days.' },
    ],
    functiesLabel: 'In the app',
    functiesTitel: 'Everything a member wants to handle themselves.',
    functiesTekst: 'Fewer questions at the front desk.',
    functies: {
      inchecken: { titel: 'Check-in and booking', tekst: 'QR code on the home screen, classes with a waiting list and appointments with a trainer. Confirmation by email.' },
      schema: { titel: 'Programme and nutrition', tekst: 'The trainer’s programme with coaching for every exercise, logged set by set, and the nutrition plan.' },
      voortgang: { titel: 'Progress and challenges', tekst: 'Workouts, body measurements and goals such as weeks in a row.' },
    },
    vragenLabel: 'Questions',
    vragenTitel: 'Good to know.',
    vragen: [
      {
        vraag: 'Do members need to download anything?',
        antwoord: 'No. It’s a web app: open the link and add it to the home screen with a tap. No app store needed.',
      },
      {
        vraag: 'What does a member see of their measurements?',
        antwoord: 'Only their own measurements and workouts. Health data and the trainer’s notes stay with the team.',
      },
      {
        vraag: 'What if a member loses their phone?',
        antwoord: 'Create a new link on the member card. All devices are signed out and the old link stops working.',
      },
    ],
    band: 'Give your members an app with your name on it.',
  },
})
