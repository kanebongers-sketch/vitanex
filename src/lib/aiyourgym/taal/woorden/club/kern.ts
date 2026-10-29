import { woordenboek } from '../../woordenboek'

// Vaste labels uit de kern van Club die op veel schermen terugkomen: de rollen
// van medewerkers, de onderdelen (modules) die een sportschool aan of uit zet
// en de manieren van inchecken. De Nederlandse bron staat in
// src/lib/club/kern/medewerker.ts, organisatie.ts en org-instellingen.ts; in
// beeld altijd via rolLabel(), moduleTekst() en checkinMethodeLabel().

export const KERN_LABELS = woordenboek({
  nl: {
    rollen: {
      trainer: 'Trainer',
      instructeur: 'Groepslesinstructeur',
      manager: 'Clubmanager',
      administratie: 'Administratie',
    },
    modules: {
      leden: { label: 'Leden', uitleg: 'Ledenlijst, ledenkaart, behoud en ledenbestand inlezen.' },
      checkin: { label: 'Check-in', uitleg: 'Inchecken bij de balie met QR of zoeken.' },
      rooster: { label: 'Groepslessen', uitleg: 'Lesrooster, reserveren en wachtlijsten.' },
      afspraken: { label: 'Afspraken', uitleg: 'Intakes, personal training en metingen met trainers boeken.' },
      personeel: { label: 'Personeelsrooster', uitleg: 'Diensten, beschikbaarheid en uren.' },
      taken: { label: 'Taken en poetslijsten', uitleg: 'Dagelijkse taken, afsluitronde en poetsrooster.' },
      leads: { label: 'Leads', uitleg: 'Proeflessen en aanmeldingen opvolgen.' },
      training: { label: 'Training', uitleg: "Intakes, schema's en de oefenbibliotheek." },
      cijfers: { label: 'Cijfers', uitleg: 'Maandcijfers per vestiging.' },
      app: { label: 'Ledenapp', uitleg: 'De app voor leden met schema, lessen en QR.' },
    },
    checkinMethode: {
      beide: 'Beide: QR-code in de app en zoeken aan de balie',
      qr: 'QR-code in de app (de balie kan altijd nog op naam zoeken)',
      balie: 'Alleen aan de balie (zoeken op naam, lidnummer of pasje)',
    },
    checkinMethodeKort: {
      beide: 'Beide',
      qr: 'QR-code in de app',
      balie: 'Alleen aan de balie',
    },
  },
  en: {
    rollen: {
      trainer: 'Trainer',
      instructeur: 'Group class instructor',
      manager: 'Club manager',
      administratie: 'Admin team',
    },
    modules: {
      leden: { label: 'Members', uitleg: 'Member list, member profile, retention and importing your member file.' },
      checkin: { label: 'Check-in', uitleg: 'Check in at the front desk with QR or by searching.' },
      rooster: { label: 'Group classes', uitleg: 'Class timetable, bookings and waiting lists.' },
      afspraken: { label: 'Appointments', uitleg: 'Book intakes, personal training and measurements with trainers.' },
      personeel: { label: 'Staff rota', uitleg: 'Shifts, availability and hours.' },
      taken: { label: 'Tasks and cleaning lists', uitleg: 'Daily tasks, closing round and cleaning rota.' },
      leads: { label: 'Leads', uitleg: 'Follow up trial classes and sign-ups.' },
      training: { label: 'Training', uitleg: 'Intakes, programmes and the exercise library.' },
      cijfers: { label: 'Metrics', uitleg: 'Monthly metrics per location.' },
      app: { label: 'Member app', uitleg: 'The app for members with their programme, classes and QR.' },
    },
    checkinMethode: {
      beide: 'Both: QR code in the app and searching at the front desk',
      qr: 'QR code in the app (the front desk can always search by name too)',
      balie: 'Front desk only (search by name, member number or card)',
    },
    checkinMethodeKort: {
      beide: 'Both',
      qr: 'QR code in the app',
      balie: 'Front desk only',
    },
  },
})
