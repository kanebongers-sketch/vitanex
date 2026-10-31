// ─── AI Your Gym: het slot op de cron-routes (SERVER-ONLY) ──────────────────
// De crons van Club en AI Your Gym (/api/aiyourgym/cron/**) hebben een eigen
// geheim: CLUB_CRON_SECRET. Alleen via een kop, nooit in de URL:
//   x-cron-secret: <geheim>   of   Authorization: Bearer <geheim>
//
// Overgang (achterwaarts veilig):
//  - CLUB_CRON_SECRET niet gezet: het gedeelde CRON_SECRET opent de club-crons
//    zoals voorheen, zodat geen bestaande cron-taak stukgaat.
//  - CLUB_CRON_SECRET wel gezet: alleen dat geheim telt; CRON_SECRET opent de
//    club-crons dan niet meer.
// Leeg geheim = niemand komt binnen (fail-closed). Vergelijken in constante tijd.
// De crons van de PT-app en LifeOS (src/app/api/cron/**) blijven op CRON_SECRET.

import { geheimGelijk } from './pin'

interface MetKoppen {
  readonly headers: { get(naam: string): string | null }
}

/** Het geheim dat de club-crons nu verwachten (leeg = dicht). */
export function clubCronGeheim(omgeving: Readonly<Record<string, string | undefined>> = process.env): string {
  const eigen = omgeving.CLUB_CRON_SECRET?.trim()
  if (eigen) return eigen
  return omgeving.CRON_SECRET?.trim() ?? ''
}

/** Het geheim uit de kop x-cron-secret, anders uit Authorization: Bearer. */
export function cronGeheimUitKop(req: MetKoppen): string | null {
  const eigen = req.headers.get('x-cron-secret')?.trim()
  if (eigen) return eigen
  const auth = req.headers.get('authorization')?.trim() ?? ''
  const bearer = /^Bearer\s+(\S+)$/i.exec(auth)
  return bearer ? bearer[1] : null
}

/** True als het verzoek het juiste cron-geheim in een kop meestuurt. */
export function clubCronToegestaan(req: MetKoppen, omgeving: Readonly<Record<string, string | undefined>> = process.env): boolean {
  return geheimGelijk(clubCronGeheim(omgeving), cronGeheimUitKop(req))
}
