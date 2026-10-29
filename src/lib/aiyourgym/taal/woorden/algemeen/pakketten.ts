// De losse pakketten (src/lib/aiyourgym/pakketten.ts) per taal: voor de
// prijzenpagina, het aanmelden, het abonnement in Club en de menu's. Het
// Nederlands is de bron in pakketten.ts; het Engels zegt precies hetzelfde.

import { KERN_INBEGREPEN, PAKKETTEN, type Pakket, type PakketSleutel } from '@/lib/aiyourgym/pakketten'
import { woordenboek } from '../../woordenboek'
import type { Taal } from '../../taal'

function nl(sleutel: PakketSleutel): Pick<Pakket, 'naam' | 'voorWie' | 'inbegrepen'> {
  const p = PAKKETTEN.find((x) => x.sleutel === sleutel)
  if (!p) throw new Error(`Onbekend pakket ${sleutel}`)
  return { naam: p.naam, voorWie: p.voorWie, inbegrepen: p.inbegrepen }
}

export const PAKKET_NAMEN = woordenboek({
  nl: {
    pakketten: {
      administratie: nl('administratie'),
      lessen: nl('lessen'),
      training: nl('training'),
      afspraken: nl('afspraken'),
      team: nl('team'),
      groei: nl('groei'),
    },
    kern: { naam: 'Altijd inbegrepen', inbegrepen: KERN_INBEGREPEN },
    kies: 'Kies alleen wat je nodig hebt. Elk pakket werkt los van de andere.',
    en: 'en',
  },
  en: {
    pakketten: {
      administratie: {
        naam: 'Membership administration',
        voorWie: 'For gyms that track memberships, visits and metrics.',
        inbegrepen: ['Membership types, pausing and cancelling on the member profile', 'Check-in with QR in the app or at the front desk', 'Monthly metrics: new members, leavers and visits', 'Reports and exports for Excel'],
      },
      lessen: {
        naam: 'Group classes',
        voorWie: 'For studios and clubs with a class timetable.',
        inbegrepen: ['Class timetable with class types, rooms and instructors', 'Members book and cancel in the app themselves', 'Waiting lists and booking rules', 'Booking widget for your own website', 'Class reminders'],
      },
      training: {
        naam: 'Training and coaching',
        voorWie: 'For trainers who write programmes and coach members.',
        inbegrepen: ['Intakes with your own questionnaire', 'Training programmes with supersets, tempo and rest', 'Exercise library with 3D images and coaching per exercise', 'Nutrition and progress per member', 'Members log their sets in the app'],
      },
      afspraken: {
        naam: 'Appointments',
        voorWie: 'For personal training, intakes and measurements.',
        inbegrepen: ['Appointment types with their own duration', 'Members book a free slot in the app themselves', 'Availability per trainer', 'Appointment reminders'],
      },
      team: {
        naam: 'Team and floor',
        voorWie: 'For clubs with staff on the floor.',
        inbegrepen: ['Staff rota with shifts', 'Hours: planned, worked and approved', 'Daily tasks, closing round and cleaning rota'],
      },
      groei: {
        naam: 'Growth',
        voorWie: 'For gyms that want to win and keep more members.',
        inbegrepen: ['Follow up leads and trial classes', 'A follow-up list for the team', 'Follow-up rules that prepare tasks', 'Challenges, badges and community in the member app', 'Messages to members'],
      },
    },
    kern: {
      naam: 'Always included',
      inbegrepen: ['Member list and member profile with name and contact details', 'Member app in your own branding', 'Locations, team and permissions per role', 'Your own address, such as aiyourgym.com/yourgym', 'Import your member file and GDPR per member'],
    },
    kies: 'Choose only what you need. Each package works on its own.',
    en: 'and',
  },
})

/** Naam, voor wie en wat erin zit, in een taal. */
export function pakketInTaal(sleutel: PakketSleutel, taal: Taal): Pick<Pakket, 'naam' | 'voorWie' | 'inbegrepen'> {
  return PAKKET_NAMEN[taal].pakketten[sleutel]
}

/** "Groepslessen en Groei" of "Lessen, Training en Groei". */
export function pakkettenTekst(lijst: readonly PakketSleutel[], taal: Taal): string {
  const namen = lijst.map((s) => pakketInTaal(s, taal).naam)
  if (namen.length <= 1) return namen.join('')
  return `${namen.slice(0, -1).join(', ')} ${PAKKET_NAMEN[taal].en} ${namen[namen.length - 1]}`
}
