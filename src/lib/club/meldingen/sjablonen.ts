// ─── Club, meldingen: de teksten (PUUR) ─────────────────────────────────────
// Per soort een onderwerp, de volledige tekst voor de mail en een korte regel
// voor de lijst in de ledenapp. Nederlands, zonder gedachtestreepjes. Tijden
// altijd in Europe/Amsterdam (zie rooster/tijd.ts).

import { ZONE, nlDelen } from '@/lib/club/rooster/tijd'
import type { AfspraakSoort, LesSoort } from './soorten'

export interface LesGegevens {
  naam: string
  /** ISO-tijdstip (UTC). */
  start: string
  vestigingNaam: string
  instructeur: string | null
  wachtpositie?: number | null
  reden?: string | null
}

export interface AfspraakGegevens {
  typeNaam: string
  start: string
  vestigingNaam: string
  trainer: string | null
}

export interface Ontvanger {
  voornaam: string
  sportschool: string
}

export type Onderwerp = { soort: LesSoort; les: LesGegevens } | { soort: AfspraakSoort; afspraak: AfspraakGegevens }

export interface Tekst {
  onderwerp: string
  /** De volledige tekst voor de mail. */
  mail: string
  /** Een korte regel voor de meldingenlijst in de app. */
  kort: string
}

const DAG = new Intl.DateTimeFormat('nl-NL', { timeZone: ZONE, weekday: 'long', day: 'numeric', month: 'long' })

/** "dinsdag 21 oktober om 19:00". */
export function moment(iso: string): string {
  const d = new Date(iso)
  return `${DAG.format(d)} om ${nlDelen(d).tijd}`
}

/** "vandaag om 19:00", "morgen om 9:30" of "op dinsdag 21 oktober om 19:00", gezien vanaf `vanaf`. */
export function wanneer(iso: string, vanaf: Date): string {
  const d = new Date(iso)
  const dag = nlDelen(d).datum
  const nu = nlDelen(vanaf).datum
  const morgen = nlDelen(new Date(vanaf.getTime() + 86_400_000)).datum
  const tijd = nlDelen(d).tijd
  if (dag === nu) return `vandaag om ${tijd}`
  if (dag === morgen) return `morgen om ${tijd}`
  return `op ${moment(iso)}`
}

function mail(o: Ontvanger, alineas: readonly string[]): string {
  return [`Hoi ${o.voornaam},`, ...alineas, `Sportieve groet,\n${o.sportschool}`].join('\n\n')
}

function lesTekst(soort: LesSoort, les: LesGegevens, o: Ontvanger, vanaf: Date): Tekst {
  const waar = `${les.naam} ${wanneer(les.start, vanaf)} in ${les.vestigingNaam}`
  const bij = les.instructeur ? ` Je les wordt gegeven door ${les.instructeur}.` : ''
  switch (soort) {
    case 'les_geboekt':
      return {
        onderwerp: `Je bent ingeschreven voor ${les.naam}`,
        kort: `Je plek voor ${waar} is gereserveerd.`,
        mail: mail(o, [`Je plek voor ${waar} is gereserveerd.${bij}`, 'Kun je toch niet? Meld je dan op tijd af in de app, dan krijgt iemand anders je plek.']),
      }
    case 'les_wachtlijst': {
      const plek = les.wachtpositie ? `Je staat op plek ${les.wachtpositie}.` : 'Je staat op de wachtlijst.'
      return {
        onderwerp: `Je staat op de wachtlijst voor ${les.naam}`,
        kort: `${les.naam} is vol. ${plek} Komt er een plek vrij, dan schuif je vanzelf door.`,
        mail: mail(o, [`${waar[0].toUpperCase()}${waar.slice(1)} is vol. ${plek}`, 'Komt er een plek vrij, dan schuif je vanzelf door en krijg je meteen bericht.']),
      }
    }
    case 'les_afgemeld':
      return {
        onderwerp: `Je bent afgemeld voor ${les.naam}`,
        kort: `Je bent afgemeld voor ${waar}.`,
        mail: mail(o, [`Je bent afgemeld voor ${waar}.`, 'Wil je toch meedoen? Boek de les dan opnieuw in de app, zolang er plek is.']),
      }
    case 'les_doorgeschoven':
      return {
        onderwerp: `Er is een plek vrij: je doet mee met ${les.naam}`,
        kort: `Je bent doorgeschoven van de wachtlijst en doet mee met ${waar}.`,
        mail: mail(o, [`Goed nieuws: er kwam een plek vrij. Je bent doorgeschoven van de wachtlijst en doet mee met ${waar}.${bij}`, 'Kun je toch niet? Meld je dan af in de app, dan gaat de plek naar de volgende.']),
      }
    case 'les_herinnering':
      return {
        onderwerp: `Herinnering: ${les.naam} ${wanneer(les.start, vanaf)}`,
        kort: `${les.naam} begint ${wanneer(les.start, vanaf)} in ${les.vestigingNaam}.`,
        mail: mail(o, [`Even een herinnering: ${waar}.${bij}`, 'Kun je toch niet? Meld je dan af in de app, dan krijgt iemand anders je plek.']),
      }
    case 'les_geannuleerd': {
      const schoon = (les.reden ?? '').replace(/\s+/g, ' ').trim().replace(/[.!\s]+$/, '')
      const reden = schoon ? ` Reden: ${schoon}.` : ''
      return {
        onderwerp: `${les.naam} ${wanneer(les.start, vanaf)} gaat niet door`,
        kort: `${les.naam} ${wanneer(les.start, vanaf)} gaat niet door.${reden}`,
        mail: mail(o, [`Helaas gaat ${waar} niet door.${reden}`, 'Je reservering is vervallen. Kies gerust een andere les in de app. Sorry voor het ongemak.']),
      }
    }
  }
}

function afspraakTekst(soort: AfspraakSoort, a: AfspraakGegevens, o: Ontvanger, vanaf: Date): Tekst {
  const met = a.trainer ? ` met ${a.trainer}` : ''
  const waar = `${a.typeNaam}${met} ${wanneer(a.start, vanaf)} in ${a.vestigingNaam}`
  switch (soort) {
    case 'afspraak_geboekt':
      return {
        onderwerp: `Je afspraak staat: ${a.typeNaam} ${wanneer(a.start, vanaf)}`,
        kort: `Je afspraak staat: ${waar}.`,
        mail: mail(o, [`Je afspraak staat: ${waar}.`, 'Kun je niet? Annuleer de afspraak dan op tijd in de app of laat het de sportschool weten.']),
      }
    case 'afspraak_verplaatst':
      return {
        onderwerp: `Je afspraak is verplaatst naar ${wanneer(a.start, vanaf)}`,
        kort: `Je afspraak is verplaatst: ${waar}.`,
        mail: mail(o, [`Je afspraak is verplaatst. De nieuwe tijd: ${waar}.`, 'Past dit niet? Laat het de sportschool dan weten.']),
      }
    case 'afspraak_herinnering':
      return {
        onderwerp: `Herinnering: ${a.typeNaam} ${wanneer(a.start, vanaf)}`,
        kort: `Je afspraak is ${wanneer(a.start, vanaf)}: ${a.typeNaam}${met}.`,
        mail: mail(o, [`Even een herinnering aan je afspraak: ${waar}.`, 'Kun je toch niet? Annuleer de afspraak dan in de app of laat het de sportschool weten.']),
      }
    case 'afspraak_afgemeld':
      return {
        onderwerp: `Je afspraak is geannuleerd`,
        kort: `Je hebt je afspraak geannuleerd: ${waar}.`,
        mail: mail(o, [`Je hebt je afspraak geannuleerd: ${waar}.`, 'Wil je een nieuwe afspraak? Die maak je zo in de app.']),
      }
    case 'afspraak_geannuleerd':
      return {
        onderwerp: `Je afspraak ${wanneer(a.start, vanaf)} gaat niet door`,
        kort: `Je afspraak gaat niet door: ${waar}.`,
        mail: mail(o, [`Helaas gaat je afspraak niet door: ${waar}.`, 'Maak gerust een nieuwe afspraak in de app of neem contact op met de sportschool. Sorry voor het ongemak.']),
      }
  }
}

/** De tekst voor een melding, gezien vanaf het moment `vanaf` waarop hij aankomt. */
export function tekstVoor(o: Onderwerp, ontvanger: Ontvanger, vanaf: Date): Tekst {
  return 'les' in o ? lesTekst(o.soort, o.les, ontvanger, vanaf) : afspraakTekst(o.soort, o.afspraak, ontvanger, vanaf)
}
