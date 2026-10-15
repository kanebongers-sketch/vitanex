// ─── PT-app — de checkup: wat bespreken we, en is de afspraak gehaald? (PUUR)
// Het groeiplan concreet per PT'er. Alles volgt uit wat de PT'er in de app
// invulde, steeds "sinds de vorige checkup" (de datum van de laatste afspraak).
// Vier onderdelen, elk met namen zodat je er één voor één doorheen kunt:
//   1. Leads & opvolging — nieuwe gesprekken; wie te laat of zonder plan staat.
//   2. Pijplijn & conversie — wie staat ingepland; wie werd klant.
//   3. Referrals — bij welke lopende klanten nog niet gevraagd.
//   4. Behoud — wie stopte (met reden), wie nadert het einde van de vaste periode.
// Plus de meetbare afspraken van de vorige checkup: gehaald of niet.

import { OPEN_STATUSSEN, moetOpvolgen, type Lead } from '@/lib/lifeos/leads/leads'
import { eindeVastePeriode, isLopend, plusDagen, type PtKlant } from './abonnementen'

/** Zonder eerdere afspraak kijken we zoveel dagen terug (de coachronde). */
export const STANDAARD_TERUG = 14
/** Einde vaste periode binnen zoveel dagen = "bespreek behoud". */
export const BEHOUD_VOORUIT = 30

// ─── Afspraken ──────────────────────────────────────────────────────────────

export interface AfspraakInvoer {
  /** Minstens zoveel nieuwe gesprekken (leads) vastgelegd. */
  gesprekken: number | null
  /** Minstens zoveel nieuwe klanten gestart. */
  nieuweKlanten: number | null
  /** Bij minstens zoveel klanten om een referral gevraagd. */
  referrals: number | null
  /** Bij de volgende checkup staat er niets te laat. */
  nietsTeLaat: boolean
  notitie: string | null
}

export interface Afspraak extends AfspraakInvoer {
  id: string
  /** YYYY-MM-DD: de checkup waarin dit is afgesproken. */
  gemaaktOp: string
  gemaaktDoor: string | null
}

export const AFSPRAAK_MAX = { gesprekken: 100, nieuweKlanten: 50, referrals: 100 } as const
export type AfspraakSoort = keyof typeof AFSPRAAK_MAX
export const AFSPRAAK_LABEL: Record<AfspraakSoort | 'nietsTeLaat', string> = {
  gesprekken: 'Nieuwe gesprekken',
  nieuweKlanten: 'Nieuwe klanten',
  referrals: 'Referral gevraagd',
  nietsTeLaat: 'Niets te laat',
}

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function leesAantal(v: unknown, soort: AfspraakSoort): Lees<number | null> {
  if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return { ok: true, waarde: null }
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.trim()) : Number.NaN
  if (n === 0) return { ok: true, waarde: null }
  const max = AFSPRAAK_MAX[soort]
  if (!Number.isInteger(n) || n < 0 || n > max) return { ok: false, fout: `${AFSPRAAK_LABEL[soort]}: kies een heel getal van 1 tot en met ${max}.` }
  return { ok: true, waarde: n }
}

/** Het formulier → een afspraak, of een leesbare fout. Minstens één afspraak. */
export function leesAfspraakInvoer(body: unknown): Lees<AfspraakInvoer> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, fout: 'Ongeldige invoer.' }
  const o = body as Record<string, unknown>
  const gesprekken = leesAantal(o.gesprekken, 'gesprekken')
  if (!gesprekken.ok) return gesprekken
  const nieuweKlanten = leesAantal(o.nieuweKlanten, 'nieuweKlanten')
  if (!nieuweKlanten.ok) return nieuweKlanten
  const referrals = leesAantal(o.referrals, 'referrals')
  if (!referrals.ok) return referrals
  const nietsTeLaat = o.nietsTeLaat === true
  const notitie = typeof o.notitie === 'string' && o.notitie.trim() ? o.notitie.replace(/\s+/g, ' ').trim().slice(0, 300) : null
  if (gesprekken.waarde === null && nieuweKlanten.waarde === null && referrals.waarde === null && !nietsTeLaat) {
    return { ok: false, fout: 'Maak minstens één meetbare afspraak.' }
  }
  return { ok: true, waarde: { gesprekken: gesprekken.waarde, nieuweKlanten: nieuweKlanten.waarde, referrals: referrals.waarde, nietsTeLaat, notitie } }
}

// ─── Wat er sinds de vorige checkup gebeurde ────────────────────────────────

export interface CheckupStand {
  /** Vanaf deze dag (inclusief) tellen we. */
  sinds: string
  /** Bron van `sinds`: de vorige afspraak, of gewoon twee weken terug. */
  sindsAfspraak: boolean
  leads: {
    nieuw: Lead[]
    teLaat: Lead[]
    zonderPlan: Lead[]
  }
  pijplijn: {
    /** Open leads met status intake of proefles: wie staat er ingepland? */
    ingepland: Lead[]
    /** Klanten gestart sinds de vorige checkup. */
    nieuweKlanten: PtKlant[]
    /** Van de nieuwe leads: hoeveel inmiddels klant. */
    nieuwKlant: number
    /** Van de nieuwe leads: wie na intake of proefles geen klant werd (met reden). */
    nieuwGeenKlant: Lead[]
  }
  referrals: {
    lopend: number
    /** Lopende klanten waarbij ooit gevraagd. */
    ooitGevraagd: number
    /** Klanten waarbij gevraagd sinds de vorige checkup. */
    gevraagdSinds: number
    /** Lopende klanten waarbij nog nooit gevraagd: de kandidaten. */
    nogNiet: PtKlant[]
    /** Leads met bron referral sinds de vorige checkup. */
    binnen: number
  }
  behoud: {
    /** Opgezegd of gestopt sinds de vorige checkup. */
    gestopt: PtKlant[]
    /** Actieve klanten van wie de vaste periode binnen 30 dagen eindigt. */
    eindeVastePeriode: { klant: PtKlant; einde: string }[]
  }
}

const opNaam = <T extends { naam: string }>(a: T, b: T) => a.naam.localeCompare(b.naam, 'nl')

/** De begindatum: de dag van de vorige afspraak, anders twee weken terug. */
export function checkupSinds(vorige: Pick<Afspraak, 'gemaaktOp'> | null, vandaag: string): string {
  return vorige ? vorige.gemaaktOp : plusDagen(vandaag, -STANDAARD_TERUG)
}

export function checkupStand(leads: readonly Lead[], klanten: readonly PtKlant[], vorige: Afspraak | null, vandaag: string): CheckupStand {
  const sinds = checkupSinds(vorige, vandaag)
  const inPeriode = (d: string | null) => d !== null && d >= sinds && d <= vandaag
  const open = leads.filter((l) => OPEN_STATUSSEN.includes(l.status))
  const nieuw = leads.filter((l) => inPeriode(l.gesprokenOp))
  const lopend = klanten.filter((k) => isLopend(k, vandaag))
  const tot = plusDagen(vandaag, BEHOUD_VOORUIT)
  return {
    sinds,
    sindsAfspraak: vorige !== null,
    leads: {
      nieuw: [...nieuw].sort(opNaam),
      teLaat: open.filter((l) => moetOpvolgen(l, vandaag) && l.opvolgdatum !== vandaag).sort((a, b) => (a.opvolgdatum ?? '').localeCompare(b.opvolgdatum ?? '')),
      zonderPlan: open.filter((l) => l.opvolgdatum === null && (l.volgendeStap === null || l.volgendeStap === 'afgesloten')).sort(opNaam),
    },
    pijplijn: {
      ingepland: open.filter((l) => l.status === 'intake' || l.status === 'proefles').sort(opNaam),
      nieuweKlanten: klanten.filter((k) => inPeriode(k.startdatum)).sort(opNaam),
      nieuwKlant: nieuw.filter((l) => l.status === 'klant').length,
      nieuwGeenKlant: nieuw.filter((l) => l.status === 'geen_klant').sort(opNaam),
    },
    referrals: {
      lopend: lopend.length,
      ooitGevraagd: lopend.filter((k) => k.referralGevraagdOp !== null).length,
      gevraagdSinds: klanten.filter((k) => inPeriode(k.referralGevraagdOp)).length,
      nogNiet: lopend.filter((k) => k.referralGevraagdOp === null).sort(opNaam),
      binnen: nieuw.filter((l) => l.bron === 'referral').length,
    },
    behoud: {
      gestopt: klanten.filter((k) => (k.status === 'opgezegd' || k.status === 'gestopt') && inPeriode(k.opgezegdOp)).sort(opNaam),
      eindeVastePeriode: klanten
        .filter((k) => k.status === 'actief')
        .map((klant) => ({ klant, einde: eindeVastePeriode(klant.startdatum) }))
        .filter((x) => x.einde >= vandaag && x.einde <= tot)
        .sort((a, b) => a.einde.localeCompare(b.einde)),
    },
  }
}

// ─── Afspraak nameten ───────────────────────────────────────────────────────

export interface AfspraakScore {
  soort: AfspraakSoort | 'nietsTeLaat'
  label: string
  /** "5 van 8" of "2 te laat". */
  stand: string
  gehaald: boolean
}

/** Per gemaakte afspraak: de stand nu en of hij gehaald is (meet vanaf de checkupdag). */
export function scoreAfspraak(a: Afspraak, s: CheckupStand): AfspraakScore[] {
  const uit: AfspraakScore[] = []
  const tel = (soort: AfspraakSoort, doel: number | null, stand: number) => {
    if (doel !== null) uit.push({ soort, label: AFSPRAAK_LABEL[soort], stand: `${stand} van ${doel}`, gehaald: stand >= doel })
  }
  tel('gesprekken', a.gesprekken, s.leads.nieuw.length)
  tel('nieuweKlanten', a.nieuweKlanten, s.pijplijn.nieuweKlanten.length)
  tel('referrals', a.referrals, s.referrals.gevraagdSinds)
  if (a.nietsTeLaat) {
    const n = s.leads.teLaat.length
    uit.push({ soort: 'nietsTeLaat', label: AFSPRAAK_LABEL.nietsTeLaat, stand: n === 0 ? 'niets te laat' : `${n} te laat`, gehaald: n === 0 })
  }
  return uit
}

// ─── Leads doorlopen ────────────────────────────────────────────────────────

/**
 * De open leads in de volgorde waarin je ze in de wekelijkse bespreking
 * doorloopt: te laat (oudste eerst), vandaag, zonder plan, daarna op opvolgdatum.
 */
export function leadsDoorlopen(leads: readonly Lead[], vandaag: string): Lead[] {
  const rang = (l: Lead) =>
    l.opvolgdatum !== null && l.opvolgdatum < vandaag ? 0
    : l.opvolgdatum === vandaag ? 1
    : l.opvolgdatum === null && (l.volgendeStap === null || l.volgendeStap === 'afgesloten') ? 2
    : 3
  return leads
    .filter((l) => OPEN_STATUSSEN.includes(l.status))
    .sort((a, b) => rang(a) - rang(b) || (a.opvolgdatum ?? '9999').localeCompare(b.opvolgdatum ?? '9999') || a.naam.localeCompare(b.naam, 'nl'))
}
