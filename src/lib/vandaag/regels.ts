// ─── MentaForce /1 — de regelbibliotheek ────────────────────────────────────
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

import { bepaalSignalen, duur, feitZinnen, type Signalen } from './signalen'
import type { Actie, Feiten, Kaart, Toon } from './types'

export const MAX_ACTIES = 3

/** Standaard bedtijd als het profiel er geen heeft. */
export const STANDAARD_BEDTIJD = '22:30'

type TrainingAdvies = 'zoals_gepland' | 'lichter' | 'rust'

const TIJD = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** Regel 1: wat doen we met de training van vandaag? */
export function trainingAdvies(f: Feiten, s: Signalen): TrainingAdvies | null {
  if (!f.training) return null
  if (s.aantalLaag >= 3) return 'rust'
  if (f.training.intensiteit === 'zwaar') {
    if (s.slaapKort) return f.grenzen?.naSlechteNacht === 'rust' ? 'rust' : 'lichter'
    if (s.energieLaag) return 'lichter'
  }
  return 'zoals_gepland'
}

function trainingActie(f: Feiten, s: Signalen, advies: TrainingAdvies): Actie | null {
  const t = f.training
  if (!t || advies === 'zoals_gepland') return null
  const reden = s.slaapKort
    ? s.slaapVerschil !== null
      ? `Je sliep ${duur(s.slaapVerschil)} minder dan normaal.`
      : 'Je nacht was kort.'
    : s.energieLaag
      ? 'Je energie staat laag.'
      : 'Meerdere signalen staan vandaag laag.'
  const grens = f.grenzen ? ' Zo heeft je trainer het afgesproken.' : ''
  if (advies === 'lichter') {
    return {
      id: 'training',
      titel: `${t.soort} wordt een lichte sessie: zo'n 30 minuten rustig.`,
      waarom: `${reden} Licht bewegen helpt vandaag meer dan zwaar trainen.${grens}`,
      knop: 'oke',
    }
  }
  return {
    id: 'rust',
    titel: `Sla ${t.soort.toLowerCase()} vandaag over. Een wandeling mag, hoeft niet.`,
    waarom: `${reden} Rust is vandaag het plan; morgen pak je het weer op.${grens}`,
    knop: 'oke',
  }
}

/** Alle kandidaat-acties in volgorde van prioriteit (nog niet afgekapt). */
function kandidaten(f: Feiten, s: Signalen, advies: TrainingAdvies | null): Actie[] {
  const uit: Actie[] = []
  const training = advies ? trainingActie(f, s, advies) : null
  if (training) uit.push(training)

  if (s.aantalLaag >= 3) {
    uit.push({
      id: 'minder',
      titel: 'Schrap of verschuif vandaag één ding van je lijst.',
      waarom: 'Meerdere signalen staan tegelijk laag. Minder doen is vandaag het plan, geen achterstand.',
      knop: 'oke',
    })
  }

  if (s.zwaarsteAfspraak && (s.stressHoog || s.slaapKort)) {
    const a = s.zwaarsteAfspraak
    uit.push({
      id: 'pauze',
      titel: `Plan 20 minuten pauze vóór "${a.titel}" (${TIJD.format(new Date(a.start))}).`,
      waarom: s.stressHoog ? 'Je stress is hoog en dit is je zwaarste afspraak.' : 'Na een korte nacht helpt een adempauze vóór je zwaarste afspraak.',
      knop: 'agenda',
    })
  }

  if (s.stressHoog) {
    uit.push({
      id: 'ademhaling',
      titel: 'Neem vandaag 5 minuten om rustig te ademen, of wandel even kort.',
      waarom: `Je stress staat op ${f.checkin?.stress}/5. Een korte pauze haalt de piek eraf.`,
      knop: 'herinner',
    })
  }

  if (s.slaapKort) {
    uit.push({
      id: 'bedtijd',
      titel: `Lichten uit om ${f.bedtijdStreef ?? STANDAARD_BEDTIJD}.`,
      waarom: 'Eén vroege avond haalt het meeste van een korte nacht in.',
      knop: 'herinner',
    })
  }

  if (s.weinigBewogen && !f.training) {
    uit.push({
      id: 'bewegen',
      titel: 'Wandel vandaag 20 minuten.',
      waarom: 'Gisteren bewoog je minder dan normaal. Een wandeling maakt het verschil.',
      knop: 'oke',
    })
  }

  if (!f.checkin) {
    uit.push({
      id: 'checkin',
      titel: 'Hoe voel je je? Drie schuifjes, 20 seconden.',
      waarom: 'Met je check-in kan ik zien of vandaag een gewone dag is.',
      knop: 'checkin',
    })
  }

  if (!f.heeftPlan) {
    uit.push({
      id: 'plan',
      titel: 'Zet je weekplan neer: op welke dagen train je?',
      waarom: 'Dan kan ik elke ochtend zeggen of je je plan kunt volgen of beter kunt aanpassen.',
      knop: 'plan',
    })
  }
  return uit
}

function bepaalToon(s: Signalen, advies: TrainingAdvies | null, aanpassingen: number, f: Feiten): Toon {
  if (!s.ietsBekend) return 'onbekend'
  if (s.aantalLaag >= 3 || advies === 'rust') return 'rustig'
  if (aanpassingen > 0) return 'aanpassen'
  return f.checkin ? 'normaal' : 'onbekend'
}

function bepaalKop(toon: Toon, f: Feiten, advies: TrainingAdvies | null, acties: readonly Actie[]): string {
  if (toon === 'onbekend') return 'Goedemorgen. Hoe gaat het vandaag?'
  if (toon === 'rustig') return 'Rustige dag. Minder is vandaag het plan.'
  if (toon === 'aanpassen') {
    if (advies === 'lichter') return 'Licht trainen, rustig aan.'
    if (acties.some((a) => a.id === 'pauze' || a.id === 'ademhaling')) return 'Drukke dag. Bouw rust in.'
    if (acties.length === 1 && acties[0].id === 'bedtijd') return 'Gewone dag, vroeg naar bed.'
    return 'Kleine aanpassing vandaag.'
  }
  if (f.training) return 'Alles normaal. Je plan staat.'
  return f.heeftPlan ? 'Alles normaal. Geniet van je rustdag.' : 'Alles normaal.'
}

/** Acties die iets aan je dag veranderen (dus niet: om een check-in of plan vragen). */
const AANPASSINGEN = new Set(['training', 'rust', 'minder', 'pauze', 'ademhaling', 'bedtijd', 'bewegen'])

/** De kaart van vandaag. */
export function maakKaart(f: Feiten): Kaart {
  const s = bepaalSignalen(f)
  const advies = trainingAdvies(f, s)
  const alle = kandidaten(f, s, advies)
  const aanpassingen = alle.filter((a) => AANPASSINGEN.has(a.id)).length
  const acties = alle.slice(0, MAX_ACTIES)
  const toon = bepaalToon(s, advies, aanpassingen, f)

  return {
    datum: f.datum,
    toon,
    kop: bepaalKop(toon, f, advies, acties),
    feiten: feitZinnen(f, s),
    acties,
    training: f.training && advies ? { soort: f.training.soort, advies, tijd: f.training.tijd } : null,
  }
}
