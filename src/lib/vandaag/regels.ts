// ─── MentaForce Vandaag-kaart — de regelbibliotheek ────────────────────────────────────
// Van signalen naar de kaart. Elke regel hieronder is één soort beslissing uit
// het strategisch advies (§4). De volgorde is de prioriteit; de kaart toont er
// hooguit drie. "Alles normaal" is een volwaardige uitkomst: geen verzonnen
// advies om de kaart te vullen.
//
// Regels in volgorde:
//   1. Training: zoals gepland / lichter / rust (grenzen van de trainer winnen)
//   2. Minder doen, als meerdere signalen tegelijk laag staan
//   3. Pauze vóór de zwaarste afspraak (alleen met agenda)
//   4. Rustig ademen of kort wandelen bij hoge stress
//   5. Vroeg naar bed na een korte nacht
//   6. Bewegen inhalen na een zittende dag (niet op een trainingsdag)
//   7. Nog geen check-in / nog geen plan: daar om vragen
//
// Puur: geen klok, geen database, geen netwerk. Alles komt via `Feiten` binnen.

import { bepaalSignalen, duur, feitZinnen, herstelZin, type Signalen } from './signalen'
import type { Actie, Feiten, Kaart, Toon } from './types'
import { NL, type Taalset } from '@/lib/i18n/taalset'

export const MAX_ACTIES = 3

/** Standaard bedtijd als het profiel er geen heeft. */
export const STANDAARD_BEDTIJD = '22:30'

type TrainingAdvies = 'zoals_gepland' | 'lichter' | 'rust'

function tijd(iso: string, ts: Taalset): string {
  return new Intl.DateTimeFormat(ts.locale, { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso))
}

/** Regel 1: wat doen we met de training van vandaag? */
export function trainingAdvies(f: Feiten, s: Signalen): TrainingAdvies | null {
  if (!f.training) return null
  if (s.aantalLaag >= 3) return 'rust'
  if (f.training.intensiteit === 'zwaar') {
    if (s.slaapKort) return f.grenzen?.naSlechteNacht === 'rust' ? 'rust' : 'lichter'
    if (s.energieLaag || s.herstelLaag) return 'lichter'
  }
  return 'zoals_gepland'
}

function trainingReden(f: Feiten, s: Signalen, ts: Taalset): string {
  if (s.slaapKort) {
    return s.slaapVerschil !== null ? ts.t('kaart.reden.slaapMinder', { duur: duur(s.slaapVerschil, ts) }) : ts.t('kaart.reden.nachtKort')
  }
  if (s.energieLaag) return ts.t('kaart.reden.energieLaag')
  if (s.herstelLaag) return ts.t('kaart.reden.herstel', { herstel: herstelZin(s, ts) })
  return ts.t('kaart.reden.meerdere')
}

function trainingActie(f: Feiten, s: Signalen, advies: TrainingAdvies, ts: Taalset): Actie | null {
  const t = f.training
  if (!t || advies === 'zoals_gepland') return null
  const params = { reden: trainingReden(f, s, ts), grens: f.grenzen ? ts.t('kaart.reden.grens') : '', soort: t.soort }
  if (advies === 'lichter') {
    return { id: 'training', titel: ts.t('kaart.lichter.titel', params), waarom: ts.t('kaart.lichter.waarom', params), knop: 'oke' }
  }
  return {
    id: 'rust',
    titel: ts.t('kaart.rust.titel', { ...params, soort: t.soort.toLocaleLowerCase(ts.locale) }),
    waarom: ts.t('kaart.rust.waarom', params),
    knop: 'oke',
  }
}

/** Een actie met titel en uitleg uit het woordenboek (kaart.<id>.titel/waarom). */
function actie(id: Actie['id'], knop: Actie['knop'], ts: Taalset, params?: Record<string, string | number>, waaromSleutel = 'waarom'): Actie {
  return { id, knop, titel: ts.t(`kaart.${id}.titel`, params), waarom: ts.t(`kaart.${id}.${waaromSleutel}`, params) }
}

/** Alle kandidaat-acties in volgorde van prioriteit (nog niet afgekapt). */
function kandidaten(f: Feiten, s: Signalen, advies: TrainingAdvies | null, ts: Taalset): Actie[] {
  const uit: Actie[] = []
  const training = advies ? trainingActie(f, s, advies, ts) : null
  if (training) uit.push(training)
  if (s.aantalLaag >= 3) uit.push(actie('minder', 'oke', ts))
  if (s.zwaarsteAfspraak && (s.stressHoog || s.slaapKort)) {
    const a = s.zwaarsteAfspraak
    uit.push(actie('pauze', 'agenda', ts, { afspraak: a.titel, tijd: tijd(a.start, ts) }, s.stressHoog ? 'waaromStress' : 'waaromSlaap'))
  }
  if (s.stressHoog) uit.push(actie('ademhaling', 'herinner', ts, { stress: f.checkin?.stress ?? '' }))
  if (s.slaapKort) uit.push(actie('bedtijd', 'herinner', ts, { tijd: f.bedtijdStreef ?? STANDAARD_BEDTIJD }))
  if (s.weinigBewogen && !f.training) uit.push(actie('bewegen', 'oke', ts))
  if (!f.checkin) uit.push(actie('checkin', 'checkin', ts))
  if (!f.heeftPlan) uit.push(actie('plan', 'plan', ts))
  return uit
}

function bepaalToon(s: Signalen, advies: TrainingAdvies | null, aanpassingen: number, f: Feiten): Toon {
  if (!s.ietsBekend) return 'onbekend'
  if (s.aantalLaag >= 3 || advies === 'rust') return 'rustig'
  if (aanpassingen > 0) return 'aanpassen'
  return f.checkin ? 'normaal' : 'onbekend'
}

function bepaalKop(toon: Toon, f: Feiten, advies: TrainingAdvies | null, acties: readonly Actie[], ts: Taalset): string {
  if (toon === 'onbekend') return ts.t('kaart.kop.onbekend')
  if (toon === 'rustig') return ts.t('kaart.kop.rustig')
  if (toon === 'aanpassen') {
    if (advies === 'lichter') return ts.t('kaart.kop.lichter')
    if (acties.some((a) => a.id === 'pauze' || a.id === 'ademhaling')) return ts.t('kaart.kop.druk')
    if (acties.length === 1 && acties[0].id === 'bedtijd') return ts.t('kaart.kop.vroegBed')
    return ts.t('kaart.kop.aanpassing')
  }
  if (f.training) return ts.t('kaart.kop.normaalPlan')
  return ts.t(f.heeftPlan ? 'kaart.kop.normaalRust' : 'kaart.kop.normaal')
}

/** Acties die iets aan je dag veranderen (dus niet: om een check-in of plan vragen). */
const AANPASSINGEN = new Set(['training', 'rust', 'minder', 'pauze', 'ademhaling', 'bedtijd', 'bewegen'])

/** De kaart van vandaag. */
export function maakKaart(f: Feiten, ts: Taalset = NL): Kaart {
  const s = bepaalSignalen(f)
  const advies = trainingAdvies(f, s)
  const alle = kandidaten(f, s, advies, ts)
  const aanpassingen = alle.filter((a) => AANPASSINGEN.has(a.id)).length
  const acties = alle.slice(0, MAX_ACTIES)
  const toon = bepaalToon(s, advies, aanpassingen, f)

  return {
    datum: f.datum,
    toon,
    kop: bepaalKop(toon, f, advies, acties, ts),
    feiten: feitZinnen(f, s, ts),
    acties,
    training: f.training && advies ? { soort: f.training.soort, advies, tijd: f.training.tijd } : null,
  }
}
