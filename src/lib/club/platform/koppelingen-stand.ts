// ─── Systeem: werken mail, meldingen en Stripe? (PUUR) ──────────────────────
// Opdracht Kane (02-11-2026): "Mail en meldingen en Stripe en betalingen werken
// nog niet." Alles is gebouwd, maar hangt aan schakelaars en sleutels in Render.
// Deze module zegt per dienst welke instellingen er zijn, welke ontbreken en
// welke niet kloppen. Alleen namen en stand, NOOIT een waarde (ook niet een
// deel ervan): de pagina toont dit aan Kane, maar het blijft een geheim.

import { leesVapidSleutels } from '@/lib/club/push/sleutels'
import { PAKKET_SLEUTELS } from '@/lib/aiyourgym/pakketten'
import { prijsEnvNaam } from '@/lib/aiyourgym/config'

type Env = Record<string, string | undefined>

export type Stand = 'goed' | 'ontbreekt' | 'klopt_niet'
export type DienstStand = 'werkt' | 'uit' | 'onvolledig'
export type DienstSleutel = 'mail_club' | 'mail_ayg' | 'push' | 'stripe_ayg' | 'betalen' | 'cron'

export interface Instelling {
  naam: string
  stand: Stand
  /** Nodig om de dienst te laten werken; anders optioneel. */
  verplicht: boolean
}

export interface Dienst {
  sleutel: DienstSleutel
  stand: DienstStand
  instellingen: Instelling[]
  /** Live of test (alleen Stripe), afgeleid van het voorvoegsel van de sleutel. */
  modus?: 'live' | 'test' | null
}

function waarde(env: Env, naam: string): string {
  const v = env[naam]?.trim() ?? ''
  return v === 'undefined' ? '' : v
}

/** De stand van een instelling: leeg, ongeldig volgens de vorm, of goed. */
function controleer(env: Env, naam: string, vorm: RegExp | null, verplicht = true): Instelling {
  const v = waarde(env, naam)
  if (!v) return { naam, stand: 'ontbreekt', verplicht }
  return { naam, stand: vorm && !vorm.test(v) ? 'klopt_niet' : 'goed', verplicht }
}

const AAN = /^(1|true)$/
const RESEND_SLEUTEL = /^re_[A-Za-z0-9_]{8,}$/
/** "Naam <adres@domein.nl>" of "adres@domein.nl". */
const AFZENDER = /^([^<>]{1,80}<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/
const STRIPE_SLEUTEL = /^(sk|rk)_(test|live)_[A-Za-z0-9]{10,}$/
const WEBHOOK = /^whsec_[A-Za-z0-9]{10,}$/
const PRIJS = /^price_[A-Za-z0-9]{6,}$/

/** Werkt alles wat verplicht is, staat de schakelaar uit, of mist er iets? */
function standVan(instellingen: readonly Instelling[], schakelaar: string | null): DienstStand {
  const nodig = instellingen.filter((i) => i.verplicht)
  if (nodig.every((i) => i.stand === 'goed')) return 'werkt'
  const uit = schakelaar !== null && instellingen.find((i) => i.naam === schakelaar)?.stand !== 'goed'
  const rest = nodig.filter((i) => i.naam !== schakelaar)
  return uit && rest.every((i) => i.stand === 'ontbreekt') ? 'uit' : 'onvolledig'
}

function modusVan(env: Env, naam: string): 'live' | 'test' | null {
  const v = waarde(env, naam)
  return /^(sk|rk)_live_/.test(v) ? 'live' : /^(sk|rk)_test_/.test(v) ? 'test' : null
}

function mailClub(env: Env): Dienst {
  const instellingen = [
    controleer(env, 'CLUB_MAILS_ACTIEF', AAN),
    controleer(env, 'CLUB_RESEND_API_KEY', RESEND_SLEUTEL),
    controleer(env, 'CLUB_RESEND_FROM', AFZENDER),
  ]
  return { sleutel: 'mail_club', stand: standVan(instellingen, 'CLUB_MAILS_ACTIEF'), instellingen }
}

function mailAyg(env: Env): Dienst {
  const instellingen = [controleer(env, 'RESEND_API_KEY', RESEND_SLEUTEL), controleer(env, 'AIYOURGYM_RESEND_FROM', AFZENDER)]
  return { sleutel: 'mail_ayg', stand: standVan(instellingen, null), instellingen }
}

function push(env: Env): Dienst {
  const instellingen = [
    controleer(env, 'CLUB_PUSH_ACTIEF', AAN),
    controleer(env, 'CLUB_VAPID_PUBLIC_KEY', null),
    controleer(env, 'CLUB_VAPID_PRIVATE_KEY', null),
    controleer(env, 'CLUB_VAPID_SUBJECT', /^(mailto:[^\s@]+@[^\s@]+\.[^\s@]+|https:\/\/\S+)$/),
  ]
  // De drie sleutels samen: horen ze bij elkaar? Dan pas zijn ze goed.
  const allesGevuld = instellingen.slice(1).every((i) => i.stand !== 'ontbreekt')
  if (allesGevuld && !leesVapidSleutels(env)) {
    for (const i of instellingen.slice(1, 3)) i.stand = 'klopt_niet'
  }
  return { sleutel: 'push', stand: standVan(instellingen, 'CLUB_PUSH_ACTIEF'), instellingen }
}

function stripeAyg(env: Env): Dienst {
  const instellingen = [
    controleer(env, 'AIYOURGYM_STRIPE_SECRET_KEY', STRIPE_SLEUTEL),
    controleer(env, 'AIYOURGYM_STRIPE_WEBHOOK_SECRET', WEBHOOK),
    ...PAKKET_SLEUTELS.map((p) => controleer(env, prijsEnvNaam(p), PRIJS)),
  ]
  return { sleutel: 'stripe_ayg', stand: standVan(instellingen, null), instellingen, modus: modusVan(env, 'AIYOURGYM_STRIPE_SECRET_KEY') }
}

function betalen(env: Env): Dienst {
  const instellingen = [
    controleer(env, 'CLUB_BETALEN_ACTIEF', AAN),
    controleer(env, 'CLUB_STRIPE_SECRET_KEY', STRIPE_SLEUTEL),
    controleer(env, 'CLUB_STRIPE_WEBHOOK_SECRET', WEBHOOK),
    controleer(env, 'CLUB_LIDGELD_ACTIEF', AAN, false),
  ]
  return { sleutel: 'betalen', stand: standVan(instellingen, 'CLUB_BETALEN_ACTIEF'), instellingen, modus: modusVan(env, 'CLUB_STRIPE_SECRET_KEY') }
}

function cron(env: Env): Dienst {
  // Een van de twee is genoeg (src/lib/club/kern/cron-geheim.ts); CLUB_CRON_SECRET gaat voor.
  const eigen = controleer(env, 'CLUB_CRON_SECRET', null, false)
  const oud = controleer(env, 'CRON_SECRET', null, eigen.stand !== 'goed')
  const instellingen = [eigen, oud]
  return { sleutel: 'cron', stand: eigen.stand === 'goed' || oud.stand === 'goed' ? 'werkt' : 'onvolledig', instellingen }
}

/** De stand van elke koppeling, in de volgorde van de pagina. */
export function koppelingenStand(env: Env): Dienst[] {
  return [mailClub(env), mailAyg(env), push(env), stripeAyg(env), betalen(env), cron(env)]
}
