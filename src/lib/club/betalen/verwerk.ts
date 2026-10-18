// ─── Club, betalen: wat er gebeurt na een Stripe-event (SERVER-ONLY) ────────
// Idempotent in twee lagen: elk event wordt een keer geclaimd
// (club_betalen_stripe_events), en de databasefuncties ronden een verkoop of
// terugbetaling precies een keer af. Een betaling telt alleen als sessie,
// account en bedrag kloppen met wat wij zelf vastlegden (nooit het bedrag van
// Stripe overnemen).

import { sessieBetaald, type ClubEvent } from './stripe-event'

export interface VerwerkOpslag {
  claimEvent(id: string, type: string): Promise<'nieuw' | 'dubbel' | 'fout'>
  geefEventVrij(id: string): Promise<void>
  rondVerkoopAf(a: { verkoopId: string; sessieId: string; paymentIntent: string | null; bedragCent: number; account: string }): Promise<string | null>
  sluitOpenVerkoop(sessieId: string, account: string, status: 'mislukt' | 'verlopen'): Promise<'ok' | 'fout'>
  verwerkTerugbetaling(paymentIntent: string, account: string, terugCent: number): Promise<string | null>
  werkAccountStandBij(stand: Extract<ClubEvent, { soort: 'account' }>['stand']): Promise<'ok' | 'fout'>
  /** Iets klopt niet (bedrag of account wijkt af): vastleggen voor Kane. */
  meld(wat: string): Promise<void>
}

async function stap(e: ClubEvent, o: VerwerkOpslag): Promise<'ok' | 'fout'> {
  switch (e.soort) {
    case 'sessie_betaald': {
      const s = e.sessie
      // Nog niet betaald (bijvoorbeeld een uitgestelde betaling): het latere event komt nog.
      if (!sessieBetaald(s) || !s.verkoopId || s.bedragCent === null) return 'ok'
      const uit = await o.rondVerkoopAf({ verkoopId: s.verkoopId, sessieId: s.sessieId, paymentIntent: s.paymentIntent, bedragCent: s.bedragCent, account: e.account })
      if (uit === null) return 'fout'
      if (uit === 'afwijkend') await o.meld('Club-betaling wijkt af van de verkoop (sessie, account of bedrag)')
      return 'ok'
    }
    case 'sessie_mislukt':
      return o.sluitOpenVerkoop(e.sessieId, e.account, e.status)
    case 'terugbetaald':
      return (await o.verwerkTerugbetaling(e.paymentIntent, e.account, e.terugCent)) === null ? 'fout' : 'ok'
    case 'account':
      return o.werkAccountStandBij(e.stand)
    default:
      return 'ok'
  }
}

/** 'dubbel' = al eerder verwerkt; 'fout' = Stripe moet het opnieuw proberen. */
export async function verwerkClubEvent(e: ClubEvent, o: VerwerkOpslag): Promise<'ok' | 'dubbel' | 'fout'> {
  const claim = await o.claimEvent(e.id, e.soort === 'overig' ? e.type : e.soort)
  if (claim !== 'nieuw') return claim
  const uit = await stap(e, o)
  if (uit === 'fout') await o.geefEventVrij(e.id)
  return uit
}
