// ─── Club, afspraken: boekregels en statussen (PUUR) ────────────────────────
// Wie mag een type geven, tot wanneer mag een lid boeken of annuleren, en welke
// status mag een afspraak krijgen. De balie en trainers mogen meer dan een lid
// in de app: zij boeken ook op korte termijn en buiten de app-regels.

import type { MedewerkerRol } from '@/lib/club/kern/medewerker'
import type { Afspraak, AfspraakStatus, AfspraakType } from './model'

/** Zo ver vooruit kan een lid in de app boeken. */
export const BOEK_HORIZON_DAGEN = 28

const UUR = 3_600_000

export type Uitkomst = { ok: true } | { ok: false; fout: string }

const OK: Uitkomst = { ok: true }
const nee = (fout: string): Uitkomst => ({ ok: false, fout })

interface MedewerkerInfo {
  id: string
  rollen: readonly MedewerkerRol[]
  vestigingen: readonly string[]
}

/** Mag deze medewerker dit type geven in deze vestiging? Geen lijst = elke trainer. */
export function magGeven(type: Pick<AfspraakType, 'medewerkerIds'>, m: MedewerkerInfo, vestiging: string): boolean {
  if (!m.vestigingen.includes(vestiging)) return false
  return type.medewerkerIds.length === 0 ? m.rollen.includes('trainer') : type.medewerkerIds.includes(m.id)
}

/** Eind en "bezet tot" (eind plus buffer) bij een begin. */
export function eindVan(start: Date, type: Pick<AfspraakType, 'duurMin' | 'bufferMin'>): { eind: Date; bezetTot: Date } {
  const eind = new Date(start.getTime() + type.duurMin * 60_000)
  return { eind, bezetTot: new Date(eind.getTime() + type.bufferMin * 60_000) }
}

/** Vanaf en tot wanneer een lid dit type in de app kan boeken. */
export function boekVenster(type: Pick<AfspraakType, 'boekenUrenVooraf'>, nu: Date): { vanaf: Date; tot: Date } {
  return {
    vanaf: new Date(nu.getTime() + type.boekenUrenVooraf * UUR),
    tot: new Date(nu.getTime() + BOEK_HORIZON_DAGEN * 24 * UUR),
  }
}

function urenTekst(uren: number): string {
  if (uren % 24 === 0 && uren >= 48) return `${uren / 24} dagen`
  return uren === 1 ? '1 uur' : `${uren} uur`
}

/** Mag een lid dit type op dit moment boeken (los van of het slot vrij is)? */
export function magLidBoeken(type: AfspraakType, start: Date, nu: Date): Uitkomst {
  if (!type.actief || !type.appBoekbaar) return nee('Deze afspraak kun je niet zelf boeken. Vraag het aan de balie.')
  const { vanaf, tot } = boekVenster(type, nu)
  if (start.getTime() < vanaf.getTime()) {
    return nee(type.boekenUrenVooraf > 0 ? `Boek minstens ${urenTekst(type.boekenUrenVooraf)} van tevoren.` : 'Dit tijdstip is al voorbij.')
  }
  if (start.getTime() > tot.getTime()) return nee(`Je kunt tot ${BOEK_HORIZON_DAGEN} dagen vooruit boeken.`)
  return OK
}

/** Mag een lid deze afspraak zelf annuleren? */
export function magLidAnnuleren(type: Pick<AfspraakType, 'annulerenUrenVooraf'>, afspraak: Pick<Afspraak, 'status' | 'start'>, nu: Date): Uitkomst {
  if (afspraak.status !== 'gepland') return nee('Deze afspraak staat niet meer gepland.')
  const grens = new Date(afspraak.start).getTime() - type.annulerenUrenVooraf * UUR
  if (nu.getTime() > grens) {
    return nee(`Annuleren kan tot ${urenTekst(type.annulerenUrenVooraf)} van tevoren. Bel of mail de sportschool.`)
  }
  return OK
}

/** Welke statussen kan de balie of trainer nu kiezen? Geannuleerd is definitief. */
export function volgendeStatussen(afspraak: Pick<Afspraak, 'status' | 'start'>, nu: Date): AfspraakStatus[] {
  if (afspraak.status === 'geannuleerd') return []
  const begonnen = new Date(afspraak.start).getTime() <= nu.getTime()
  const alle: AfspraakStatus[] = begonnen ? ['gepland', 'geweest', 'niet_gekomen', 'geannuleerd'] : ['gepland', 'geannuleerd']
  return alle.filter((s) => s !== afspraak.status)
}

export function magStatusZetten(afspraak: Pick<Afspraak, 'status' | 'start'>, nieuw: AfspraakStatus, nu: Date): Uitkomst {
  if (afspraak.status === nieuw) return OK
  if (afspraak.status === 'geannuleerd') return nee('Een geannuleerde afspraak kan niet terug. Maak een nieuwe afspraak.')
  if (volgendeStatussen(afspraak, nu).includes(nieuw)) return OK
  return nee('Geweest of niet gekomen kan pas als de afspraak begonnen is.')
}

/** Alleen een geplande afspraak kun je verplaatsen. */
export function magVerplaatsen(afspraak: Pick<Afspraak, 'status'>): Uitkomst {
  return afspraak.status === 'gepland' ? OK : nee('Alleen een geplande afspraak kun je verplaatsen.')
}
