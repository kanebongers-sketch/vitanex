import { woordenboek } from '../../woordenboek'
import { ARTIKELEN } from '@/lib/club/hulp/artikelen'

// De handleidingen van het helpcentrum in Club. De Nederlandse bron staat in
// src/lib/club/hulp/artikelen.ts (getest op links en onderdelen); hier staat het
// Engels ernaast met precies dezelfde opbouw (even veel stappen en links). In
// beeld via zichtbareArtikelenIn() (src/lib/club/hulp/artikelen-taal.ts).

type ArtikelSleutel =
  | 'eerste-stappen'
  | 'leden-inlezen'
  | 'checkin'
  | 'rooster'
  | 'afspraken'
  | 'personeel'
  | 'taken'
  | 'training'
  | 'voeding'
  | 'challenges'
  | 'opvolgen'
  | 'rapporten'
  | 'instellingen'
  | 'ledenapp'

export interface ArtikelTekst {
  readonly titel: string
  readonly samenvatting: string
  readonly stappen: readonly string[]
  /** De labels van de links, in dezelfde volgorde als in ARTIKELEN. */
  readonly links: readonly string[]
}

/** De Nederlandse teksten, uit de handleidingen zelf (bron). */
const artikelenNl = Object.fromEntries(
  ARTIKELEN.map((a) => [a.sleutel, { titel: a.titel, samenvatting: a.samenvatting, stappen: a.stappen, links: a.links.map((l) => l.label) }]),
) as unknown as Record<ArtikelSleutel, ArtikelTekst>

const artikelenEn: Record<ArtikelSleutel, ArtikelTekst> = {
  'eerste-stappen': {
    titel: 'First steps',
    samenvatting: 'How the menu works, choosing a location and what Today shows.',
    stappen: [
      'At the top are five groups: Gym floor, Members, Planning, Coaching and Management. Choose a group; its sections appear below it. On a phone you open everything with the More button. Looking for something? Press Search (or Ctrl K): it finds every section and every setting.',
      'Choose the location on the right of the bar. You stay on the same page; only the location changes. Without a choice, the default location opens.',
      'Today is the day screen for the gym floor: at the top the check-in and who is in now, then the figures, classes and trial classes, who is working and the handover, today\'s tasks to tick off, follow-up (members and leads) with birthdays, and the members to keep an eye on. Check-in and Follow-up have no tab of their own; searching for those words takes you to the right place on Today.',
      'No location yet? Add one first under Settings, Locations. After that every page works per location.',
      'Turn off the sections your gym does not use under Settings, Features on or off. They then disappear from the menu.',
    ],
    links: ['Today', 'Add location', 'Settings'],
  },
  'leden-inlezen': {
    titel: 'Importing members and the member list',
    samenvatting: 'Import an export from your current system or Excel, and search and filter members.',
    stappen: [
      'Export your members from your current system (such as Virtuagym or Sportivity) as CSV (semicolon, comma or tab; Club detects it itself), or simply choose your Excel list (.xlsx). Club reads the first worksheet. At most 10 MB and 5000 rows per file.',
      'Go to Members, Import members, and drag the file in. Match the columns: first name and last name are required (or a column with the full name); choose the rest or set it to Do not import.',
      'Press Check. Every row gets New, Update, Already the same or Duplicate. Then import the members for the chosen location.',
      'Importing never removes anyone, and an empty cell clears nothing. Coach, tags and QR code stay as they are.',
      'In the member list you search by name and filter by status, membership, tag and coach. The At risk tile shows members with a retention score below 45. Click a member for the member profile with visits, bookings, appointments, progress and notes. There you also change status, coach and tags, for example when a trial member becomes a member.',
    ],
    links: ['Import members', 'Member list'],
  },
  checkin: {
    titel: 'Check-in at the front desk',
    samenvatting: 'Check members in with QR, wristband, name or member number.',
    stappen: [
      'The check-in is at the top of Today: scan the QR code (Scan with camera) or the wristband, and the member is checked in straight away. For a fixed front desk with a scanner or wristband reader, open Full screen.',
      'Or type a name or member number, choose with the arrow keys and press Enter. Esc clears the field.',
      'You see the result at once: Welcome, Already in, Not active, No access, or Note with the choice Check in anyway or Do not check in.',
      'Next to it are In now and the latest check-ins with their source (front desk, QR, wristband or class). In now is an estimate: there is no checking out.',
      'A second check-in within 30 minutes does not count again. Today refreshes by itself every few minutes, the full screen every minute.',
    ],
    links: ['Check-in on Today', 'Full screen'],
  },
  rooster: {
    titel: 'Group classes, bookings and waiting list',
    samenvatting: 'The weekly timetable, managing attendees and changing classes.',
    stappen: [
      'You set up the regular classes per week under Settings, Weekly timetable. Class types and studios are there too.',
      'In Group classes you browse by week and filter by studio, class and instructor. The tiles show the number of classes, average occupancy, the waiting list and no-shows.',
      'Click a class to see the attendees. As soon as check-in opens, you mark someone as Present or No-show.',
      'To add someone: search by name, member number or phone and press Book. If the class is full, the member goes on the waiting list and moves up automatically when a place frees up.',
      'With Edit this class you change capacity, studio or instructor. Cancelling a class asks for a reason; the bookings then lapse.',
    ],
    links: ['Group classes', 'Weekly timetable', 'Rules and opening hours'],
  },
  afspraken: {
    titel: 'Planning appointments',
    samenvatting: 'Intakes, personal training and measurements per trainer.',
    stappen: [
      'First set up your kinds of appointments under Appointment types: name, duration, buffer afterwards, colour, who runs it and up to how many hours beforehand members can book and cancel in the app.',
      'In the calendar you choose Week or Day and filter by trainer.',
      'New appointment: choose the type, a trainer (or the first one who is free), the day and a free time. Only free times can be chosen, so double booking is impossible.',
      'Afterwards you mark the appointment as Attended or No-show. Moving, cancelling and adding a note are possible too.',
    ],
    links: ['Appointments', 'Appointment types'],
  },
  personeel: {
    titel: 'Staff rota and hours',
    samenvatting: 'Plan shifts, confirm hours worked and export them.',
    stappen: [
      'In the Weekly rota you create shifts with date, start, end, staff member and type of hours (work, sick or leave). Copy last week or use a fixed pattern.',
      'Staff enter their regular week and absences under Availability.',
      'After a shift you fill in the time worked and the break and press Confirm worked. A shift moves from Planned to Worked, Approved and Processed.',
      'On the Hours tab (owner, club manager and admin team) you choose a week or month. Approve everything at once (exceptions remain), mark as processed and download the CSV for payroll. Trainers and instructors only confirm their own hours.',
    ],
    links: ['Staff', 'Hours', 'Availability'],
  },
  taken: {
    titel: 'Tasks and cleaning lists',
    samenvatting: 'Tick off daily tasks and the closing round.',
    stappen: [
      'Today\'s tasks are on Today. Choose who you are under Ticking off as, and tick tasks off. Did something else? Add it as a note.',
      'Close the day with the Closing round.',
      'Week shows the same table for the whole week; Overview shows missed daily tasks, weekly tasks running behind and closing rounds that were signed off.',
      'Under Manage you create lists and tasks with how often (every day, a minimum number of times per week, when needed) and the moment. You can copy a list to another location.',
    ],
    links: ['Tasks on Today', 'Day (other days)', 'Week', 'Overview', 'Manage tasks'],
  },
  training: {
    titel: 'Intakes and training programmes',
    samenvatting: 'Run an intake, create a programme and use templates.',
    stappen: [
      'Go to Training and press Start intake for a member. All questions are on one screen. Health data is only stored with consent.',
      'After Save intake, Create programme suggestion makes a first programme. Or start with an empty programme or a template.',
      'In the programme you set the name, status (draft, active or completed), goal, level and weeks, and per day (A to G) the exercises with sets, reps, kg and rest.',
      'You can also save with Ctrl+S. On the right you see what the member ticked off in the app. Save a good programme as a template.',
      'You change the intake questions under Settings, Intake form; exercises and coaching are on the Exercises tab.',
    ],
    links: ['Programmes', 'Intakes', 'Exercises'],
  },
  voeding: {
    titel: 'Nutrition per member',
    samenvatting: 'A daily target with a calculator, advice and templates.',
    stappen: [
      'Find a member under Nutrition and open the plan.',
      'Set the daily target: kcal, protein, carbohydrates and fat. The calculator estimates it with the Mifflin-St Jeor formula based on sex, activity and goal.',
      'Add advice and an example of a day. The note for trainers is not visible to the member.',
      'Under Templates you create a fixed plan that you apply to more members.',
    ],
    links: ['Nutrition', 'Templates'],
  },
  challenges: {
    titel: 'Challenges and badges',
    samenvatting: 'Goals for members with progress and a leaderboard.',
    stappen: [
      'Press New challenge and choose what counts: visits, workouts, group classes or weeks in a row. Set a goal, start and end.',
      'Choose which locations it applies to, and whether everyone takes part or members sign up.',
      'Choose whether it appears in the member app and whether the leaderboard is visible (first name and first letter).',
      'Challenges are listed as running, planned and finished. You can stop a running challenge.',
    ],
    links: ['Challenges'],
  },
  opvolgen: {
    titel: 'Follow-up and follow-up rules',
    samenvatting: 'Who to call or talk to today, and the rules behind it.',
    stappen: [
      'On Today, Follow-up shows per rule who to speak to today, with a suggested message, and next to it the leads that are due today. Add a note and press Done or Skip.',
      'Club never sends anything itself: you or the team call, message or talk to the member.',
      'You turn the seven rules (welcome call, trial member, not seen for a while, risk of leaving, birthday, exit call and milestone) on or off under Follow-up rules (Settings), with a threshold, who picks it up and the suggested message.',
      'The full list also shows what was handled in the last 7 days.',
    ],
    links: ['Follow-up on Today', 'Full list', 'Follow-up rules'],
  },
  rapporten: {
    titel: 'Reports and metrics',
    samenvatting: 'Exports per calendar month and the metrics of your club.',
    stappen: [
      'Under Reports, choose the report, the calendar month and the locations. Nothing ticked means the location from the bar.',
      'There are nine reports, including the member list, new members and cancellations, visits, occupancy, no-shows, leads, appointments, hours and follow-up tasks.',
      'Download CSV gives a semicolon-separated file that opens well in Excel. Every download is logged.',
      'Metrics shows members, visits, classes and leads per month, compared with the previous month and the same month last year. Choose All locations for the total.',
    ],
    links: ['Reports', 'Metrics'],
  },
  instellingen: {
    titel: 'Branding and settings',
    samenvatting: 'Logo and colours, features on or off, and everything in one place.',
    stappen: [
      'Everything you set up is in one place: Settings at the bottom of Club. Each line shows the current setting; a click opens the place where you change it, with the way back at the top.',
      'Under Branding you set the name, tagline, logo (PNG, WebP, SVG or JPEG, at most 1 MB), dark or light and your own colour. It applies straight away to Club and the member app.',
      'Also under Branding you turn off features you do not use, such as check-in or staff.',
      'Per location you set the rules and opening hours, studios, the weekly timetable and staff. Class types apply to all locations.',
      'Under Permissions per role you choose which sections trainers, instructors, club managers and the admin team see.',
      'Your team logs in on the login page with their own email address and their own password. Open someone under Staff and choose Invite; you get a link (or QR code) to pass on. With it the staff member chooses a password once. You invite a second owner or a club manager who helps manage in the same way under Branding, Administrators.',
    ],
    links: ['Settings', 'Branding', 'Staff', 'Permissions per role'],
  },
  ledenapp: {
    titel: 'Member app and messages',
    samenvatting: 'What members see in the app, and posting news and offers.',
    stappen: [
      'You invite a member on the member profile, Member app block: the member scans the QR code, confirms their email address and chooses a password. After that they log in with email address and password.',
      'Under Member app at the bottom of Club you see the app as a member sees it: choose a member and browse Home, Classes, Appointments, Programme, Nutrition, Progress and Profile.',
      'Under Settings, Member app settings, you set the welcome text, which tabs are on and whether the QR code for check-in is visible.',
      'Under Messages you post news, an offer or something important, with a start and end, for which locations and optionally only for certain members. You can pin a message or stop it straight away.',
      'Memberships and direct debits of members stay in your own member administration; Club does not handle them.',
    ],
    links: ['View member app', 'Member app', 'Messages'],
  },
}

export const HULP_ARTIKELEN = woordenboek({ nl: artikelenNl, en: artikelenEn })
