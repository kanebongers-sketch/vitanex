// ─── Club: een icoon per onderdeel (PUUR, alleen de koppeling) ──────────────
// Idee geleend van HubFit (besluit Kane 30-10-2026), op onze manier: een rustig
// lucide-icoon bij elk onderdeel, overal hetzelfde: rij 2 in de kop, het
// menupaneel op de telefoon, de onderbalk en het zoekvenster (Ctrl K). Een
// icoon is altijd versiering naast de naam (aria-hidden), nooit de enige uitleg.
// Een nieuw onderdeel krijgt hier een icoon; iconen.test.ts dwingt dat af.

import type { LucideIcon } from 'lucide-react'
import {
  Apple, Building2, Calendar, CalendarCheck, CalendarClock, CalendarDays, CalendarOff, ChartColumn, Dumbbell, FileSpreadsheet,
  House, IdCard, LayoutGrid, LifeBuoy, ListChecks, Megaphone, MessagesSquare, Palette, PhoneCall, Plug, Rocket, ScanLine,
  Settings2, SlidersHorizontal, Smartphone, Sparkles, StickyNote, Trophy, UserPlus, UserRound, Users,
} from 'lucide-react'

/** Per sleutel van een onderdeel (shell/onderdelen.ts). */
export const ONDERDEEL_ICOON: Readonly<Record<string, LucideIcon>> = {
  vandaag: House,
  checkin: ScanLine,
  taken: ListChecks,
  opvolgen: PhoneCall,
  notities: StickyNote,
  leden: Users,
  leads: UserPlus,
  berichten: Megaphone,
  community: MessagesSquare,
  challenges: Trophy,
  rooster: CalendarDays,
  afspraken: CalendarCheck,
  personeel: CalendarClock,
  agenda: Calendar,
  schemas: Dumbbell,
  voeding: Apple,
  cijfers: ChartColumn,
  rapporten: FileSpreadsheet,
  beheer: Settings2,
  hulp: LifeBuoy,
  instellingen: SlidersHorizontal,
  app: Smartphone,
  start: Rocket,
  huisstijl: Palette,
  bedrijf: Building2,
  lidmaatschappen: IdCard,
  sluiting: CalendarOff,
}

/** Per item van de hulpbalk (hulpbalk-items.ts). */
export const HULP_ICOON: Readonly<Record<string, LucideIcon>> = {
  instellingen: Settings2,
  koppelingen: Plug,
  ledenapp: Smartphone,
  nieuw: Sparkles,
  hulp: LifeBuoy,
}

/** Iconen in het zoekvenster die geen onderdeel zijn: een lid, een instel-pagina. */
const ZOEK_ICOON: Readonly<Record<string, LucideIcon>> = {
  lid: UserRound,
  instelling: SlidersHorizontal,
}

/** Het icoon van een onderdeel; onbekend: het rustige raster (nooit niets). */
export function onderdeelIcoon(sleutel: string): LucideIcon {
  return ONDERDEEL_ICOON[sleutel] ?? LayoutGrid
}

/**
 * Het icoon achter een zoeksleutel uit zoeken.ts: "onderdeel:<sleutel>",
 * "hulp:<sleutel>", "lid" of "instelling".
 */
export function zoekIcoon(sleutel: string): LucideIcon {
  const [soort, naam = ''] = sleutel.split(':')
  if (soort === 'onderdeel') return onderdeelIcoon(naam)
  if (soort === 'hulp') return HULP_ICOON[naam] ?? LifeBuoy
  return ZOEK_ICOON[soort] ?? LayoutGrid
}

/** Bestaat er een eigen icoon voor deze zoeksleutel (voor de test)? */
export function heeftZoekIcoon(sleutel: string): boolean {
  const [soort, naam = ''] = sleutel.split(':')
  if (soort === 'onderdeel') return naam in ONDERDEEL_ICOON
  if (soort === 'hulp') return naam in HULP_ICOON
  return soort in ZOEK_ICOON
}
