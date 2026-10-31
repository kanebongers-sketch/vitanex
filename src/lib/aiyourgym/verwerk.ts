// ─── AI Your Gym: wat er gebeurt na een betaling (SERVER-ONLY) ──────────────
// Een keer gedeeld door de webhook en de welkomstpagina (die niet hoeft te
// wachten als de webhook later komt). Idempotent in twee lagen: elk Stripe-event
// wordt een keer geclaimd (ayg_stripe_events) en de aanmelding gaat met een
// compare-and-set precies een keer naar 'inrichten'.

import type { SupabaseClient } from '@supabase/supabase-js'
import { sessieKlaar, type AfgerondeSessie, type AygEvent } from './stripe-event'
import { pakkettenVanPrijzen } from './pakket-wijziging'
import { bewaarOrganisatie, claimEvent, zetPakkettenVanAbonnement, claimInrichten, geefEventVrij, geefInrichtingVrij, rondInrichtingAf, zetNaarNakijken, vindAanmelding, werkStatusBij, type AanmeldingRij } from './opslag'
import type { SportschoolUitslag } from './sportschool'

export interface VerwerkDeps {
  maakSportschool: (admin: SupabaseClient, a: AanmeldingRij, onthoud: (organisatieId: string) => Promise<boolean>) => Promise<SportschoolUitslag>
  ruimOp: (admin: SupabaseClient, organisatieId: string) => Promise<void>
  /** Na een geslaagde inrichting, best-effort (mag niet laten mislukken). */
  welkom: (admin: SupabaseClient, a: AanmeldingRij, organisatieId: string) => Promise<void>
  nu: () => Date
  /** Een melding voor Kane (zonder gegevens van de aanmelder), best-effort. */
  meld?: (wat: string) => Promise<void>
  /**
   * Na het inrichten: het abonnement uit de checkout aan de eerste vestiging
   * koppelen (staffels, besluit Kane 31-10-2026). Best-effort: de dagelijkse
   * cron doet het anders alsnog.
   */
  koppelVestiging?: (admin: SupabaseClient, organisatieId: string) => Promise<void>
}

/** 'klaar' = niets (meer) te doen; 'nakijken' = aanvraag voor Kane; 'fout' = Stripe moet het opnieuw proberen. */
export type SessieUitkomst = 'ingericht' | 'klaar' | 'nakijken' | 'fout'

export async function verwerkSessie(admin: SupabaseClient, s: AfgerondeSessie, deps: VerwerkDeps): Promise<SessieUitkomst> {
  if (!sessieKlaar(s) || !s.aanmeldingId) return 'klaar'
  const a = await vindAanmelding(admin, s.aanmeldingId)
  // Alleen de sessie die we zelf bij deze aanmelding maakten.
  if (!a || a.stripeSessionId !== s.sessieId) return 'klaar'
  if (!(await claimInrichten(admin, a, deps.nu()))) return 'klaar'

  // Een vastgelopen eerdere poging: wat die achterliet eerst weg.
  if (a.organisatieId) await deps.ruimOp(admin, a.organisatieId)

  const uit = await deps.maakSportschool(admin, a, (id) => bewaarOrganisatie(admin, a.id, id))
  if (!uit.ok && uit.reden === 'email_bezet') {
    // Het adres kan al inloggen: geen tweede sportschool, geen herhaling van Stripe.
    // Een aanvraag voor Kane, die het met de klant oplost (bijvoorbeeld terugbetalen).
    await zetNaarNakijken(admin, a.id)
    await deps.meld?.('Aanmelding met een e-mailadres dat al een account heeft: Kane kijkt hem na').catch(() => undefined)
    return 'nakijken'
  }
  if (!uit.ok) {
    await geefInrichtingVrij(admin, a.id)
    return 'fout'
  }
  if (!(await rondInrichtingAf(admin, a.id, s))) return 'fout'
  await deps.welkom(admin, a, uit.organisatieId).catch(() => undefined)
  if (s.abonnementId) await deps.koppelVestiging?.(admin, uit.organisatieId).catch(() => undefined)
  return 'ingericht'
}

/** Een event van de webhook. 'dubbel' = al eerder verwerkt. */
export async function verwerkEvent(admin: SupabaseClient, e: AygEvent, deps: VerwerkDeps): Promise<'ok' | 'dubbel' | 'fout'> {
  const claim = await claimEvent(admin, e.id, e.soort === 'overig' ? e.type : e.soort)
  if (claim !== 'nieuw') return claim
  let uitkomst: 'ok' | 'fout'
  switch (e.soort) {
    case 'sessie_afgerond':
      uitkomst = (await verwerkSessie(admin, e.sessie, deps)) === 'fout' ? 'fout' : 'ok'
      break
    case 'abonnement': {
      uitkomst = await werkStatusBij(admin, e.abonnementId, { soort: 'abonnement', stripeStatus: e.stripeStatus })
      // Een pakket erbij of eraf bij Stripe: zet precies de afgenomen pakketten (idempotent).
      const pakketten = pakkettenVanPrijzen(e.prijzen)
      if (uitkomst === 'ok' && pakketten) uitkomst = await zetPakkettenVanAbonnement(admin, e.abonnementId, pakketten)
      break
    }
    case 'abonnement_weg':
      uitkomst = await werkStatusBij(admin, e.abonnementId, { soort: 'abonnement_weg' })
      break
    case 'betaling_mislukt':
      uitkomst = await werkStatusBij(admin, e.abonnementId, { soort: 'betaling_mislukt' })
      break
    default:
      uitkomst = 'ok'
  }
  if (uitkomst === 'fout') await geefEventVrij(admin, e.id)
  return uitkomst
}
