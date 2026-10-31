// Basis met add-ons (src/lib/aiyourgym/pakketten.ts, besluit Kane 31-10-2026) per taal: voor de
// prijzenpagina, het aanmelden, het abonnement in Club en de menu's. Het
// Nederlands is de bron in pakketten.ts; het Engels zegt precies hetzelfde.

import { KERN_INBEGREPEN, PAKKETTEN, isBasis, type Pakket, type PakketSleutel } from '@/lib/aiyourgym/pakketten'
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
    kern: { naam: 'Altijd in de basis', inbegrepen: KERN_INBEGREPEN },
    kies: 'De basis met ledenadministratie en ledenapp zit er altijd in. Kies daarbovenop alleen de add-ons die je nodig hebt.',
    basisNaam: 'Basis | Ledenadministratie',
    basisLabel: 'Basis',
    addOnLabel: 'Add-on',
    basisVast: 'Altijd inbegrepen. Dit is de basis van AI Your Gym.',
    en: 'en',
  },
  en: {
    pakketten: {
      administratie: {
        naam: 'Membership administration',
        voorWie: 'The core for every gym: members, memberships, visits and metrics.',
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
      naam: 'Always in the core',
      inbegrepen: ['Member list and member profile with name and contact details', 'Member app in your own branding', 'Locations, team and permissions per role', 'Your own address, such as aiyourgym.com/yourgym', 'Import your member file and GDPR per member'],
    },
    kies: 'The core with membership administration and the member app is always included. On top of it, choose only the add-ons you need.',
    basisNaam: 'Core | Membership administration',
    basisLabel: 'Core',
    addOnLabel: 'Add-on',
    basisVast: 'Always included. This is the core of AI Your Gym.',
    en: 'and',
  },
})

/** Naam, voor wie en wat erin zit, in een taal. */
export function pakketInTaal(sleutel: PakketSleutel, taal: Taal): Pick<Pakket, 'naam' | 'voorWie' | 'inbegrepen'> {
  return PAKKET_NAMEN[taal].pakketten[sleutel]
}

/** De naam zoals de klant hem ziet: de basis heet "Basis | Ledenadministratie". */
export function pakketWeergave(sleutel: PakketSleutel, taal: Taal): string {
  return isBasis(sleutel) ? PAKKET_NAMEN[taal].basisNaam : pakketInTaal(sleutel, taal).naam
}

/** "Groepslessen en Groei" of "Lessen, Training en Groei". */
export function pakkettenTekst(lijst: readonly PakketSleutel[], taal: Taal): string {
  const namen = lijst.map((s) => pakketInTaal(s, taal).naam)
  if (namen.length <= 1) return namen.join('')
  return `${namen.slice(0, -1).join(', ')} ${PAKKET_NAMEN[taal].en} ${namen[namen.length - 1]}`
}
