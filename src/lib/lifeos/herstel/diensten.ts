// ─── LifeOS — registry van koppelbare herstelbronnen ───────────────────────
// Eén plek waar staat WAT een dienst is: endpoints, scopes, env-namen. De
// route-handlers kennen geen URL's; ze vragen het hier op. Zo staat een
// endpoint-wijziging op één plek, en kan `[dienst]` in de URL nooit iets anders
// betekenen dan wat hier is toegestaan.
//
// ── Waarom maar twee van de vier ───────────────────────────────────────────
// `herstel.ts` normaliseert vier bronnen. Er zijn er hier maar twee koppelbaar,
// en dat is een bewuste keuze, geen halve implementatie:
//
//   • GARMIN — de Garmin Connect Developer Program-aanvraag staat op dit moment
//     op pauze; de Health API is niet self-serve. Zonder consumer key valt er
//     niets te bouwen dat werkt. Bovendien loopt Garmin van OAuth 1.0a naar
//     OAuth 2.0 PKCE (OAuth 1 gaat 31-12-2026 uit), dus wie nu tegen OAuth 1.0a
//     bouwt, bouwt iets dat binnen een jaar sloopt.
//     Bron: developer.garmin.com/gc-developer-program/health-api/ (juli 2026)
//
//   • SAMSUNG HEALTH — heeft geen open cloud-API. Data gaat via Health Connect
//     ÓP het toestel, en Health Connect leest alleen vanuit een app op de
//     voorgrond. Een server-route kan er per definitie niet bij; dat vraagt een
//     Capacitor-plugin op de telefoon. Een ander soort werk.
//     Bron: developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect
//
// De normalizers `vanGarmin`/`vanSamsung` blijven staan: ze zijn af en getest,
// en de dag dat er een toestel-koppeling ligt, hoeft er niets aan.

/** De diensten die LifeOS vandaag écht kan koppelen. */
export type KoppelbareDienst = 'whoop' | 'oura'

export const KOPPELBARE_DIENSTEN: readonly KoppelbareDienst[] = ['whoop', 'oura']

/** Narrowing voor de `[dienst]`-parameter uit de URL. */
export function isKoppelbareDienst(v: unknown): v is KoppelbareDienst {
  return v === 'whoop' || v === 'oura'
}

export interface DienstConfig {
  dienst: KoppelbareDienst
  label: string
  autoriseerUrl: string
  tokenUrl: string
  /** Scopes die we vragen. Zo min mogelijk: alleen wat de sync echt leest. */
  bereik: readonly string[]
  /**
   * Scope die mee moet in het refresh-request, of null als de dienst dat niet
   * wil. WHOOP verlangt hier `offline` — laat je 'm weg, dan krijg je bij het
   * verversen geen nieuw refresh token terug en sterft de koppeling alsnog.
   */
  verversBereik: string | null
  clientId: string
  clientSecret: string
  redirectUri: string
}

/**
 * Endpoints en scopes zijn geverifieerd tegen de leveranciersdocumentatie
 * (juli 2026) — niet uit het geheugen opgeschreven, want deze veranderen.
 */
const SPEC: Record<KoppelbareDienst, {
  label: string
  autoriseerUrl: string
  tokenUrl: string
  bereik: readonly string[]
  verversBereik: string | null
  idEnv: string
  secretEnv: string
}> = {
  // Bron: developer.whoop.com/docs/developing/oauth + developer.whoop.com/api
  // LET OP: v1 is uitgefaseerd; de sync praat met /developer/v2 (zie whoop.ts).
  whoop: {
    label: 'WHOOP',
    autoriseerUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
    tokenUrl: 'https://api.prod.whoop.com/oauth/oauth2/token',
    // `offline` is niet optioneel: zónder die scope geeft WHOOP géén refresh
    // token, en dan is de koppeling na één uur dood.
    bereik: ['read:recovery', 'read:sleep', 'offline'],
    verversBereik: 'offline',
    idEnv: 'WHOOP_CLIENT_ID',
    secretEnv: 'WHOOP_CLIENT_SECRET',
  },
  // Bron: cloud.ouraring.com/docs/authentication
  // `daily` dekt de slaap-, activiteit- en readiness-summaries. We vragen geen
  // `personal` (geslacht/leeftijd/gewicht) en geen `email`: die leest de sync
  // niet, dus die horen we niet te mogen zien.
  oura: {
    label: 'Oura',
    autoriseerUrl: 'https://cloud.ouraring.com/oauth/authorize',
    tokenUrl: 'https://api.ouraring.com/oauth/token',
    bereik: ['daily'],
    verversBereik: null,
    idEnv: 'OURA_CLIENT_ID',
    secretEnv: 'OURA_CLIENT_SECRET',
  },
}

/**
 * De basis-URL van de app, voor de OAuth-redirect.
 *
 * Bewust uit env en NIET uit de `Host`-header van het request: die is door de
 * client te zetten. Wie de redirect_uri op de Host-header baseert, laat een
 * aanvaller de autorisatiecode naar zijn eigen host sturen.
 */
export function appBasis(): string | null {
  const url = process.env.APP_URL
  return url && url.length > 0 ? url.replace(/\/$/, '') : null
}

/**
 * De volledige config van een dienst, of null als de app er niet voor
 * geconfigureerd is (ontbrekende client-id/secret/APP_URL).
 *
 * Null is hier een geldig antwoord, geen fout: "Whoop niet ingevuld" betekent
 * gewoon dat die koppeling uitstaat. De route vertaalt dat naar een nette 503,
 * niet naar een crash.
 */
export function dienstConfig(dienst: KoppelbareDienst): DienstConfig | null {
  const spec = SPEC[dienst]
  const clientId = process.env[spec.idEnv]
  const clientSecret = process.env[spec.secretEnv]
  const basis = appBasis()

  if (!clientId || !clientSecret || !basis) return null

  return {
    dienst,
    label: spec.label,
    autoriseerUrl: spec.autoriseerUrl,
    tokenUrl: spec.tokenUrl,
    bereik: spec.bereik,
    verversBereik: spec.verversBereik,
    clientId,
    clientSecret,
    redirectUri: `${basis}/api/lifeos/herstel/${dienst}/callback`,
  }
}

/** Het label van een dienst, ook als hij niet geconfigureerd is. */
export function dienstLabel(dienst: KoppelbareDienst): string {
  return SPEC[dienst].label
}
