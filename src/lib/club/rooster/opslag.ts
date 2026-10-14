// ─── Fit Factory Club, rooster: de serverfuncties op een plek (SERVER) ──────
// Andere onderdelen (Vandaag, check-in, ledenapp) gebruiken deze functies
// direct in hun pagina's, zodat het rooster een bron van waarheid blijft.
//
//   haalLessen(admin, userId, vestiging, van, tot)     lessen + namen + tellingen
//   haalLesDetail(admin, userId, lesId)                deelnemers, wachtlijst, proefleden
//   reserveer(t, { lesId, lidId, bron })               boeken of wachtlijst
//   annuleerReservering(t, reserveringId)              met "te laat" en doorschuiven
//   zetAfvinkStatus(t, reserveringId, status)          aanwezig / no_show / geboekt
//   annuleerLes(t, lesId, reden), wijzigLes(t, lesId, wijziging)
//   genereerLessen(t, vestiging, weken)                uit het weekrooster
//   haalRegels(admin, userId, vestiging)               regels + openingstijden

export {
  haalLessen,
  haalLesRij,
  haalRegels,
  haalReserveringenVanLes,
  haalStamdata,
  type Resultaat,
  type Stamdata,
  type VestigingInstellingen,
} from './basis-opslag'
export {
  annuleerReservering,
  haalReservering,
  reserveer,
  schuifWachtlijstDoor,
  zetAfvinkStatus,
  type AnnuleerAntwoord,
  type ReserveerAntwoord,
} from './reserveren-opslag'
export { annuleerLes, genereerLessen, haalLesDetail, wijzigLes, type Deelnemer, type LesDetail, type Proeflid } from './lesbeheer-opslag'
export type { LesOverzicht } from './raster'
