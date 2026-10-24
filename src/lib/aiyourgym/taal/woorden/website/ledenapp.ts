// De pagina Ledenapp ((site)/ledenapp/page.tsx). Alleen wat de ledenapp echt doet
// (src/components/club/app/**, src/lib/club/ledenlogin/**); het Engels zegt precies
// hetzelfde, niets meer.

import { woordenboek } from '../../woordenboek'

export const LEDENAPP_PAGINA = woordenboek({
  nl: {
    metaTitel: 'Ledenapp',
    metaOmschrijving:
      'De ledenapp van AI Your Gym: een web-app op het beginscherm in de huisstijl van je sportschool. Inloggen met e-mailadres en wachtwoord, inchecken met de QR-code, lessen en afspraken boeken, schema met coaching, voeding, voortgang, challenges en bevestigingen per mail.',
    label: 'Ledenapp',
    titel: 'Jouw sportschool op het beginscherm.',
    tekst: 'Een app in jouw naam, logo en kleuren. Leden checken in, boeken lessen en afspraken, volgen het schema van hun trainer en zien hun voortgang.',
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
    instapTekst: 'Een web-app waarin leden inloggen met hun e-mailadres en een eigen wachtwoord. Veilig, en snel geregeld aan de balie.',
    instap: [
      {
        titel: 'Een uitnodiging',
        tekst: 'Een mail met een link, de QR-code op de ledenkaart of de poster bij de balie. Daarmee activeert het lid binnen zeven dagen zijn account.',
      },
      {
        titel: 'Een eigen wachtwoord',
        tekst: 'Het lid kiest zelf een sterk wachtwoord en logt daarna in met e-mailadres en wachtwoord. Te makkelijke wachtwoorden worden geweigerd.',
      },
      {
        titel: 'Op het beginscherm',
        tekst: 'Met een tik staat de app op de telefoon, met de naam van je sportschool. Het lid blijft 90 dagen ingelogd.',
      },
    ],
    functiesLabel: 'In de app',
    functiesTitel: 'Alles wat een lid zelf wil regelen.',
    functiesTekst: 'Minder vragen aan de balie, meer leden die weten wat ze vandaag gaan doen.',
    functies: {
      inchecken: { titel: 'Inchecken', tekst: 'De QR-code staat op het startscherm. Telefoon tonen bij binnenkomst en het lid is binnen.' },
      lessen: { titel: 'Lessen', tekst: 'Het rooster met vrije plekken. Reserveren, annuleren en op de wachtlijst bij een volle les.' },
      afspraken: { titel: 'Afspraken', tekst: 'Een intake, personal training of meting boeken bij een trainer.' },
      schema: {
        titel: 'Schema met coaching',
        tekst: 'Het schema van de trainer per dag, met kernpunten en een bewegend beeld bij elke oefening. Per set invullen wat het lid deed.',
      },
      voeding: { titel: 'Voeding', tekst: 'Het voedingsplan van de trainer: calorieen, eiwit, koolhydraten, vet, maaltijden en adviezen.' },
      voortgang: { titel: 'Voortgang', tekst: 'Trainingen per week en de eigen lichaamsmaten op een tijdlijn.' },
      challenges: { titel: 'Challenges en badges', tekst: 'Doelen zoals een aantal trainingen per maand of weken op rij, met de voortgang erbij.' },
      meldingen: {
        titel: 'Meldingen',
        tekst: 'Bevestiging en herinnering van een les of afspraak per mail, en bericht als iemand van de wachtlijst door mag.',
      },
    },
    vragenLabel: 'Vragen',
    vragenTitel: 'Goed om te weten.',
    vragen: [
      {
        vraag: 'Moeten leden iets downloaden?',
        antwoord: 'Nee. Het is een web-app: leden openen de link en zetten de app met een tik op hun beginscherm. Er is geen account in een app store nodig.',
      },
      {
        vraag: 'Kan ik tabbladen uitzetten?',
        antwoord: 'Ja. Gebruik je bijvoorbeeld geen afspraken of groepslessen, dan zet je dat tabblad uit en zien je leden het niet.',
      },
      {
        vraag: 'Welke regels zien leden bij reserveren?',
        antwoord:
          'De regels van hun vestiging, in gewone taal: hoe ver vooruit ze kunnen reserveren, tot wanneer ze kunnen annuleren en wat er gebeurt bij te vaak niet komen. Die regels stel je zelf in.',
      },
      {
        vraag: 'Wat ziet een lid van zijn metingen?',
        antwoord:
          'Alleen de eigen lichaamsmaten en trainingen. Gezondheidsgegevens zoals bloeddruk en de notities van de trainer blijven bij het team en gaan nooit naar de app.',
      },
      {
        vraag: 'Wat als een lid zijn telefoon kwijt is?',
        antwoord:
          'Je maakt op de ledenkaart een nieuwe link. Alle toestellen worden dan uitgelogd en met de nieuwe link kiest het lid een nieuw wachtwoord. De oude link werkt niet meer.',
      },
    ],
    band: 'Geef je leden een app met jouw naam erop.',
  },
  en: {
    metaTitel: 'Member app',
    metaOmschrijving:
      'The AI Your Gym member app: a web app on the home screen in your gym’s branding. Sign in with email address and password, check in with the QR code, book classes and appointments, a programme with coaching, nutrition, progress, challenges and email confirmations.',
    label: 'Member app',
    titel: 'Your gym on their home screen.',
    tekst: 'An app with your name, logo and colours. Members check in, book classes and appointments, follow their trainer’s programme and see their progress.',
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
    instapTekst: 'A web app where members sign in with their email address and their own password. Secure, and quickly sorted at the front desk.',
    instap: [
      {
        titel: 'An invitation',
        tekst: 'An email with a link, the QR code on the member card or the poster at the front desk. With it, the member activates their account within seven days.',
      },
      {
        titel: 'Their own password',
        tekst: 'The member chooses a strong password and then signs in with email address and password. Passwords that are too easy are refused.',
      },
      {
        titel: 'On the home screen',
        tekst: 'One tap puts the app on their phone, with your gym’s name. The member stays signed in for 90 days.',
      },
    ],
    functiesLabel: 'In the app',
    functiesTitel: 'Everything a member wants to handle themselves.',
    functiesTekst: 'Fewer questions at the front desk, more members who know what they’re doing today.',
    functies: {
      inchecken: { titel: 'Check-in', tekst: 'The QR code is on the home screen. Show the phone on arrival and the member is in.' },
      lessen: { titel: 'Classes', tekst: 'The timetable with free spots. Book, cancel and join the waiting list for a full class.' },
      afspraken: { titel: 'Appointments', tekst: 'Book an intake, personal training or a measurement with a trainer.' },
      schema: {
        titel: 'Programme with coaching',
        tekst: 'The trainer’s programme per day, with coaching cues and a moving image for every exercise. Log each set the member did.',
      },
      voeding: { titel: 'Nutrition', tekst: 'The trainer’s nutrition plan: calories, protein, carbohydrates, fat, meals and advice.' },
      voortgang: { titel: 'Progress', tekst: 'Workouts per week and their own body measurements on a timeline.' },
      challenges: { titel: 'Challenges and badges', tekst: 'Goals such as a number of workouts per month or weeks in a row, with progress alongside.' },
      meldingen: {
        titel: 'Notifications',
        tekst: 'Confirmation and reminder of a class or appointment by email, and a message when someone moves up from the waiting list.',
      },
    },
    vragenLabel: 'Questions',
    vragenTitel: 'Good to know.',
    vragen: [
      {
        vraag: 'Do members need to download anything?',
        antwoord: 'No. It’s a web app: members open the link and add the app to their home screen with a tap. No app store account is needed.',
      },
      {
        vraag: 'Can I switch tabs off?',
        antwoord: 'Yes. If you don’t use appointments or group classes, for example, switch that tab off and your members won’t see it.',
      },
      {
        vraag: 'Which rules do members see when booking?',
        antwoord:
          'The rules of their location, in plain language: how far ahead they can book, until when they can cancel and what happens if they miss too often. You set those rules yourself.',
      },
      {
        vraag: 'What does a member see of their measurements?',
        antwoord:
          'Only their own body measurements and workouts. Health data such as blood pressure and the trainer’s notes stay with the team and never go to the app.',
      },
      {
        vraag: 'What if a member loses their phone?',
        antwoord:
          'You create a new link on the member card. All devices are then signed out and the member chooses a new password with the new link. The old link no longer works.',
      },
    ],
    band: 'Give your members an app with your name on it.',
  },
})
