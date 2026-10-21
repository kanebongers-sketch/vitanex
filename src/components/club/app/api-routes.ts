// ─── Club, ledenapp: welke API de app aanroept (PUUR) ───────────────────────
// Dezelfde componenten draaien op twee plekken:
//   - /club/app: voorvertoning in Club, beheerder-routes, lid in de body.
//   - /mijn: de echte ledenapp, leden-API (/api/club/lid), het lid komt uit de
//     sessie en wordt nooit meegestuurd. Kijkt Kane mee op /mijn?lid=, dan
//     krijgt elke URL ?voor=<id> (de server leest die alleen voor Kane).

export interface Verzoek {
  url: string
  body: Record<string, unknown>
}

export interface SlotZoek {
  type: string
  datum: string
  medewerker: string
}

export interface AfspraakBoeking {
  typeId: string
  medewerkerId: string | null
  datum: string
  tijd: string
}

export interface LedenappRoutes {
  lesBoeken(lesId: string, lidId: string): Verzoek
  lesAnnuleren(reserveringId: string): string
  trainingAfvinken(lidId: string, schemaId: string | undefined, dag: number): Verzoek
  trainingWeg(id: string): string
  afspraken(lidId: string): string
  sloten(lidId: string, zoek: SlotZoek): string
  afspraakBoeken(lidId: string, b: AfspraakBoeking): Verzoek
  afspraakAnnuleren(id: string, lidId: string): Verzoek
  challenge(id: string, lidId: string): Verzoek
  /** Coaching van oefeningen (?naam= of ?kern=...). */
  coaching(zoek: URLSearchParams): string
  /** De wisselende check-in QR-code (Home). */
  checkinCode(lidId: string): string
  /** Andere oefeningen voor een schemaregel (toestel bezet). */
  alternatieven(lidId: string, regelId: string): string
}

const deel = encodeURIComponent

/** Voorvertoning in Club: de bestaande beheerder-routes. */
export const BEHEER_ROUTES: LedenappRoutes = {
  lesBoeken: (lesId, lidId) => ({ url: '/api/club/rooster/reserveringen', body: { lesId, lidId, bron: 'app' } }),
  lesAnnuleren: (id) => `/api/club/rooster/reserveringen/${deel(id)}/annuleren`,
  trainingAfvinken: (lidId, schemaId, dag) => ({ url: '/api/club/app/training', body: { lidId, schemaId, dag } }),
  trainingWeg: (id) => `/api/club/app/training/${deel(id)}`,
  afspraken: (lidId) => `/api/club/afspraken/app?lid=${deel(lidId)}`,
  sloten: (lidId, z) => `/api/club/afspraken/app/sloten?${new URLSearchParams({ lid: lidId, type: z.type, datum: z.datum, medewerker: z.medewerker })}`,
  afspraakBoeken: (lidId, b) => ({ url: '/api/club/afspraken/app', body: { lidId, ...b } }),
  afspraakAnnuleren: (id, lidId) => ({ url: `/api/club/afspraken/app/${deel(id)}/annuleren`, body: { lidId } }),
  challenge: (id, lidId) => ({ url: `/api/club/challenges/${deel(id)}/deelnemers`, body: { lidId } }),
  coaching: (zoek) => `/api/club/training/coaching?${zoek}`,
  // Alleen Kane kan in de voorvertoning een echte code zien (zie vereisLidToegang).
  checkinCode: (lidId) => `/api/club/lid/checkin-code?voor=${deel(lidId)}`,
  alternatieven: (lidId, regelId) => `/api/club/app/training/alternatieven?${new URLSearchParams({ lid: lidId, regel: regelId })}`,
}

/** Voegt ?voor=<id> toe (alleen bij Kane in de voorvertoning van /mijn). */
function metVoor(url: string, voor: string | null): string {
  if (!voor) return url
  return `${url}${url.includes('?') ? '&' : '?'}voor=${deel(voor)}`
}

/** De echte ledenapp: de leden-API, zonder lid in de body of de vraag. */
export function ledenRoutes(voor: string | null = null): LedenappRoutes {
  const u = (pad: string) => metVoor(`/api/club/lid${pad}`, voor)
  return {
    lesBoeken: (lesId) => ({ url: u('/reserveringen'), body: { lesId } }),
    lesAnnuleren: (id) => u(`/reserveringen/${deel(id)}/annuleren`),
    trainingAfvinken: (_lidId, schemaId, dag) => ({ url: u('/training'), body: { schemaId, dag } }),
    trainingWeg: (id) => u(`/training/${deel(id)}`),
    afspraken: () => u('/afspraken'),
    sloten: (_lidId, z) => u(`/afspraken/sloten?${new URLSearchParams({ type: z.type, datum: z.datum, medewerker: z.medewerker })}`),
    afspraakBoeken: (_lidId, b) => ({ url: u('/afspraken'), body: { ...b } }),
    afspraakAnnuleren: (id) => ({ url: u(`/afspraken/${deel(id)}/annuleren`), body: {} }),
    challenge: (id) => ({ url: u(`/challenges/${deel(id)}`), body: {} }),
    coaching: (zoek) => u(`/coaching?${zoek}`),
    checkinCode: () => u('/checkin-code'),
    alternatieven: (_lidId, regelId) => u(`/training/alternatieven?${new URLSearchParams({ regel: regelId })}`),
  }
}
