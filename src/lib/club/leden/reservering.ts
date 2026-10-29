// ─── Fit Factory Club: reserveringen op de ledenkaart (PUUR) ────────────────
// Bij een voorbije les laten we zien of het lid die dag ook echt incheckte.
// Zo zie je meteen of "aanwezig" klopt en of een "niet gekomen" wel binnen was.

import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'
import { reserveringLabel, type CheckinRij, type LidReservering } from './rijen'
import { dagSleutel, tijdNl } from './tijd'

/** De eerste check-in op de dag van de les (Nederlandse dag), of null. */
export function checkinOpLesdag(checkins: readonly CheckinRij[], les: LidReservering): CheckinRij | null {
  const dag = dagSleutel(les.start)
  const zelfdeDag = checkins.filter((c) => dagSleutel(c.op) === dag)
  return zelfdeDag.sort((a, b) => a.op.getTime() - b.op.getTime())[0] ?? null
}

/** Het label van de status: "Les vervalt", "Wachtlijst 2", "Aanwezig". */
export function reserveringStatusTekst(r: LidReservering, taal: Taal = 'nl'): string {
  const t = LEDEN[taal].reservering
  if (r.lesGeannuleerd) return t.lesVervalt
  if (r.status === 'wachtlijst' && r.wachtpositie) return t.wachtpositie(r.wachtpositie)
  return reserveringLabel(r.status, taal)
}

/** Voor een voorbije les: "ingecheckt om 17:48" of "geen check-in die dag". Anders null. */
export function checkinNotitie(checkins: readonly CheckinRij[], r: LidReservering, nu: Date, taal: Taal = 'nl'): string | null {
  if (r.eind > nu || r.lesGeannuleerd || (r.status !== 'aanwezig' && r.status !== 'no_show')) return null
  const t = LEDEN[taal].reservering
  const c = checkinOpLesdag(checkins, r)
  if (c) return t.ingecheckt(tijdNl(c.op))
  return r.status === 'aanwezig' ? t.geenCheckin : null
}
