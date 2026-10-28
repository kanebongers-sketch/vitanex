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
      'Alle functies van AI Your Gym in vijf hoofdstukken: beheer, coaching, planning, groei en betrokkenheid. Check-in, schema’s met coaching, groepslessen met wachtlijst, personeelsrooster, leads, cijfers per maand en een ledenapp in je eigen huisstijl.',
    label: 'Functies',
    titel: 'Alles voor je club. Niets wat je niet gebruikt.',
    tekst: 'Vijf hoofdstukken: beheer, coaching, planning, groei en betrokkenheid. Onderdelen die je niet nodig hebt zet je uit, dan zie je ze ook nergens.',
    hoofdstukkenLabel: 'Hoofdstukken op deze pagina',
    band: 'Zie het werken in je eigen club.',
    beeld: {
      beheer: 'De check-in van AI Your Gym met de leden die net binnen zijn en hun status',
      coaching: 'Een oefening met genummerde kernpunten, ademhaling en tempo, zoals in Club',
      planning: 'Het groepslesrooster van een week met de bezetting per les en volle lessen met wachtlijst',
      groei: 'De cijfers van een kalendermaand met tegels en een staafgrafiek',
      betrokkenheid: 'De ledenapp op een telefoon met de volgende les, bezoeken, de QR-code om in te checken en een challenge',
    },
    hoofdstukken: NL_HOOFDSTUKKEN,
  },
  en: {
    metaTitel: 'Features',
    metaOmschrijving:
      'Every AI Your Gym feature in five chapters: management, coaching, planning, growth and engagement. Check-in, training programmes with coaching, group classes with waiting lists, a staff rota, leads, monthly figures and a member app in your own branding.',
    label: 'Features',
    titel: 'Everything for your club. Nothing you won’t use.',
    tekst: 'Five chapters: management, coaching, planning, growth and engagement. Switch off what you don’t need and it disappears everywhere.',
    hoofdstukkenLabel: 'Chapters on this page',
    band: 'See it working in your own club.',
    beeld: {
      beheer: 'AI Your Gym check-in showing the members who just arrived and their status',
      coaching: 'An exercise with numbered coaching cues, breathing and tempo, as shown in Club',
      planning: 'A week of the group class timetable with attendance per class and full classes with a waiting list',
      groei: 'The figures for a calendar month with tiles and a bar chart',
      betrokkenheid: 'The member app on a phone with the next class, visits, the QR code for check-in and a challenge',
    },
    hoofdstukken: {
      beheer: {
        naam: 'Management',
        kop: 'Your club runs, even when you’re not there.',
        intro: 'The front desk, the shift and the settings of your gym. Your team knows what needs doing, you set the rules.',
        functies: [
          {
            titel: 'Set-up wizard',
            tekst: 'Eight steps from type of gym to live, about fifteen minutes in total. Choose your type and the wizard prepares modules, class types, opening hours and permissions. Invite your team from the wizard and import your member list straight in.',
          },
          {
            titel: 'Front desk check-in',
            tekst: 'Check in with the QR code from the member app or by name. You see straight away who is in, and AI Your Gym checks whether the membership gives access to this location.',
          },
          {
            titel: 'Tasks and cleaning lists',
            tekst: 'Daily tasks, the closing round and a cleaning rota with a weekly minimum. In a clear table per day or per week, ticked off with a tap.',
          },
          {
            titel: 'Notes and handover',
            tekst: 'Agreements and know-how for the next shift in one fixed place, instead of on a note behind the desk.',
          },
          {
            titel: 'Multiple locations',
            tekst: 'Each location with its own rooms, classes, opening hours and rules, and memberships that decide where a member can train.',
          },
          {
            titel: 'Permissions per role',
            tekst: 'The owner can do everything. For the club manager, you choose which modules they see. Everyone signs in with an email address and their own password.',
          },
          {
            titel: 'Your own logo, colours and address',
            tekst: 'Your own name, logo and accent colour in the software and the member app, at your own address such as aiyourgym.com/yourgym. A colour with too little contrast is adjusted automatically. Switch off modules you don’t use.',
          },
        ],
      },
      coaching: {
        naam: 'Coaching',
        kop: 'Programmes a trainer can be proud of.',
        intro: 'From intake to programme, with coaching for every exercise the way a good trainer gives it on the gym floor.',
        functies: [
          {
            titel: 'Intakes',
            tekst: 'An intake form you put together yourself, with measurements and a health questionnaire. From the intake, AI Your Gym drafts a starting programme.',
          },
          {
            titel: 'Training programmes',
            tekst: 'Programmes per training day, with supersets and circuits, and for each exercise sets, reps or time, weight, RPE or RIR, rest and tempo. The trainer adjusts the draft in the editor, and the member logs each set in the app.',
          },
          {
            titel: 'Coaching for every exercise',
            tekst: 'For every exercise, 3 to 5 numbered coaching cues, the set-up, the steps, common mistakes with the correction, breathing and tempo.',
          },
          {
            titel: 'Exercise images in 3D',
            tekst: 'Our own 3D images of every exercise in Club and the member app. The image plays at the tempo from the programme and counts the reps, with the coaching cues alongside.',
          },
          {
            titel: 'Nutrition',
            tekst: 'A nutrition plan per member with calories, protein, carbohydrates and fat, meals and advice. A calculator gives the trainer a starting point, and templates save time.',
          },
          {
            titel: 'Progress',
            tekst: 'Measurements, workouts and the logged sets per exercise on a timeline, with a fixed rule for when to go heavier. Members see their own body measurements and workouts, never the trainer’s notes.',
          },
        ],
      },
      planning: {
        naam: 'Planning',
        kop: 'Classes, appointments and shifts without the puzzle.',
        intro: 'The group class timetable, appointments with trainers and the staff rota with hours, all in one place.',
        functies: [
          {
            titel: 'Group classes',
            tekst: 'A timetable per location and room. Members book in the app, with a waiting list for full classes and your own rules for cancellations and no-shows.',
          },
          {
            titel: 'Appointments with trainers',
            tekst: 'Intakes, personal training and measurements per trainer. Members book a free slot and the trainer sees it in their calendar.',
          },
          {
            titel: 'Staff rota and hours',
            tekst: 'Shifts for gym staff per week, with hours that move from planned to worked, approved and processed. Export the hours for your payroll.',
          },
          {
            titel: 'Calendar and closing days',
            tekst: 'Meetings and appointments per week, plus public holidays and special opening hours that are right everywhere at once.',
          },
        ],
      },
      groei: {
        naam: 'Growth',
        kop: 'More members through the door, and seeing what works.',
        intro: 'From trial class to new member, and figures you compare per calendar month. So you know where your growth comes from.',
        functies: [
          {
            titel: 'Leads and trial classes',
            tekst: 'New sign-ups with source and status. You see who had a trial class and who still needs a follow-up.',
          },
          {
            titel: 'Follow-up',
            tekst: 'A list of who to call or speak to today: new members, trial members, members you haven’t seen in a while. So nobody slips through the cracks.',
          },
          {
            titel: 'Figures per calendar month',
            tekst: 'Growth, visits, class attendance and retention, always from the first to the last day of the month.',
          },
          {
            titel: 'Reports and exports',
            tekst: 'Member list, joiners and cancellations, visits, attendance, no-shows, leads, appointments, hours and follow-up. As a table or as CSV.',
          },
        ],
      },
      betrokkenheid: {
        naam: 'Engagement',
        kop: 'Members who stay, because they feel seen.',
        intro: 'A member app of your own, everything about a member on one card, and tools that keep members engaged.',
        functies: [
          {
            titel: 'Member app in your own branding',
            tekst: 'A web app with your name, logo and colours that members add to their home screen. Booking classes, checking in with the QR code, their programme, nutrition and progress.',
          },
          {
            titel: 'Member card',
            tekst: 'Details, visits, membership, labels, notes and status of a member in one place. Health data only with the member’s consent.',
          },
          {
            titel: 'Retention automations',
            tekst: 'Seven rules you switch on or off per gym: welcome conversation, trial member follow-up, not seen in a while, at risk of dropping out, birthday, exit conversation and milestone. Each with its own threshold and a sample message.',
          },
          {
            titel: 'Challenges and badges',
            tekst: 'Goals for your members, such as a number of workouts per month. Progress and badges are visible in the member app.',
          },
          {
            titel: 'Messages',
            tekst: 'News and offers your members see in the member app.',
          },
        ],
      },
    },
  },
})
