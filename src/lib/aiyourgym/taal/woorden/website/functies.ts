// De pagina Functies ((site)/functies/page.tsx).
// Het Nederlands van de hoofdstukken is HOOFDSTUKKEN uit inhoud/functies.ts (daar staat
// waarom elke functie klopt; die lijst wordt ook door /nieuw gebruikt en blijft de bron).
// Het Engels zegt precies hetzelfde, niets meer.

import { HOOFDSTUKKEN, type Functie, type HoofdstukSleutel } from '@/components/aiyourgym/inhoud/functies'
import { woordenboek } from '../../woordenboek'

interface HoofdstukTekst {
  naam: string
  kop: string
  intro: string
  functies: readonly Functie[]
}

/** HOOFDSTUKKEN per sleutel, zodat het Engels dezelfde opbouw heeft. */
function perSleutel(): Record<HoofdstukSleutel, HoofdstukTekst> {
  return Object.fromEntries(HOOFDSTUKKEN.map(({ sleutel, ...rest }) => [sleutel, rest])) as Record<HoofdstukSleutel, HoofdstukTekst>
}

const NL_HOOFDSTUKKEN: Record<HoofdstukSleutel, HoofdstukTekst> = perSleutel()

export const FUNCTIES_PAGINA = woordenboek({
  nl: {
    metaTitel: 'Functies',
    metaOmschrijving:
      'AI Your Gym in vijf hoofdstukken: beheer, coaching, planning, groei en betrokkenheid. Van check-in en schema’s tot lesrooster, cijfers en een ledenapp in je eigen huisstijl.',
    titel: 'Alles voor je club. Niets wat je niet gebruikt.',
    tekst: 'Van balie tot ledenapp, in zes losse pakketten. Je kiest alleen wat je nodig hebt.',
    beeld: {
      beheer: 'De check-in van AI Your Gym met de leden die net binnen zijn en hun status',
      coaching: 'Een oefening met genummerde kernpunten, ademhaling en tempo, zoals in Club',
      planning: 'Het groepslesrooster van een week met de bezetting per les en volle lessen met wachtlijst',
      groei: 'De cijfers van een kalendermaand met tegels en een staafgrafiek',
      betrokkenheid: 'De ledenapp op een telefoon met de volgende les, de QR-code om in te checken en een challenge',
    },
    hoofdstukken: NL_HOOFDSTUKKEN,
  },
  en: {
    metaTitel: 'Features',
    metaOmschrijving:
      'AI Your Gym in five chapters: management, coaching, planning, growth and engagement. From check-in and programmes to the class timetable, figures and a member app in your own branding.',
    titel: 'Everything for your club. Nothing you won’t use.',
    tekst: 'From front desk to member app, in six separate packages. You choose only what you need.',
    beeld: {
      beheer: 'AI Your Gym check-in showing the members who just arrived and their status',
      coaching: 'An exercise with numbered coaching cues, breathing and tempo, as shown in Club',
      planning: 'A week of the group class timetable with attendance per class and full classes with a waiting list',
      groei: 'The figures for a calendar month with tiles and a bar chart',
      betrokkenheid: 'The member app on a phone with the next class, the QR code for check-in and a challenge',
    },
    hoofdstukken: {
      beheer: {
        naam: 'Management',
        kop: 'Your club runs, even without you.',
        intro: 'Your team knows what needs doing. You set the rules.',
        functies: [
          { titel: 'Live in fifteen minutes', tekst: 'A short set-up wizard, including your team and your member list.' },
          { titel: 'Front desk and shifts', tekst: 'Check-in by QR or by name, tasks, cleaning lists and handover in one place.' },
          { titel: 'Locations, roles, branding', tekst: 'Rules per location, permissions per role, your logo and colours.' },
        ],
      },
      coaching: {
        naam: 'Coaching',
        kop: 'Programmes a trainer can be proud of.',
        intro: 'From intake to programme, with the coaching you would give on the gym floor.',
        functies: [
          { titel: 'Intake and programme', tekst: 'A draft programme from the intake, with supersets, RPE and tempo.' },
          { titel: 'Coaching in 3D', tekst: '3 to 5 cues per exercise and an image that counts the reps.' },
          { titel: 'Nutrition and progress', tekst: 'A nutrition plan per member and every logged set on a timeline.' },
        ],
      },
      planning: {
        naam: 'Planning',
        kop: 'Classes, appointments and shifts without the puzzle.',
        intro: 'Timetable, calendar and hours in one place.',
        functies: [
          { titel: 'Group classes', tekst: 'Booking in the app, with a waiting list and your cancellation rules.' },
          { titel: 'Appointments with trainers', tekst: 'Intakes and personal training, straight into the trainer’s calendar.' },
          { titel: 'Rota and hours', tekst: 'Shifts per week, hours from planned to processed, ready to export.' },
        ],
      },
      groei: {
        naam: 'Growth',
        kop: 'More members through the door. And seeing what works.',
        intro: 'From trial class to member, measured per calendar month.',
        functies: [
          { titel: 'Leads and follow-up', tekst: 'Every trial class in view and a list of who to call today.' },
          { titel: 'Monthly figures', tekst: 'Growth, visits, attendance and retention, from the first day to the last.' },
          { titel: 'Reports', tekst: 'Every overview as a table or as CSV.' },
        ],
      },
      betrokkenheid: {
        naam: 'Engagement',
        kop: 'Members who stay, because they feel seen.',
        intro: 'An app of your own for your members, and everything about a member on one card.',
        functies: [
          { titel: 'Member app in your branding', tekst: 'Booking, check-in, programme and progress on the home screen.' },
          { titel: 'Member card', tekst: 'Everything about a member in one place. Health data only with consent.' },
          { titel: 'Retention', tekst: 'Seven follow-up rules you switch on or off, plus challenges and messages.' },
        ],
      },
    },
  },
})
