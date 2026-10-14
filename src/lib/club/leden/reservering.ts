// ─── Fit Factory Club: reserveringen op de ledenkaart (PUUR) ────────────────
// Bij een voorbije les laten we zien of het lid die dag ook echt incheckte.
// Zo zie je meteen of "aanwezig" klopt en of een "niet gekomen" wel binnen was.

import { RESERVERING_LABEL, type CheckinRij, type LidReservering } from './rijen'
import { dagSleutel, tijdNl } from './tijd'

/** De eerste check-in op de dag van de les (Nederlandse dag), of null. */
export function checkinOpLesdag(checkins: readonly CheckinRij[], les: LidReservering): CheckinRij | null {
  const dag = dagSleutel(les.start)
  const zelfdeDag = checkins.filter((c) => dagSleutel(c.op) === dag)
  return zelfdeDag.sort((a, b) => a.op.getTime() - b.op.getTime())[0] ?? null
}

/** Het label van de status: "Les vervalt", "Wachtlijst 2", "Aanwezig". */
export function reserveringStatusTekst(r: LidReservering): string {
  if (r.lesGeannuleerd) return 'Les vervalt'
  if (r.status === 'wachtlijst' && r.wachtpositie) return `Wachtlijst ${r.wachtpositie}`
  return RESERVERING_LABEL[r.status]
}

/** Voor een voorbije les: "ingecheckt om 17:48" of "geen check-in die dag". Anders null. */
export function checkinNotitie(checkins: readonly CheckinRij[], r: LidReservering, nu: Date): string | null {
  if (r.eind > nu || r.lesGeannuleerd || (r.status !== 'aanwezig' && r.status !== 'no_show')) return null
  const c = checkinOpLesdag(checkins, r)
  if (c) return `ingecheckt om ${tijdNl(c.op)}`
  return r.status === 'aanwezig' ? 'geen check-in die dag' : null
}
