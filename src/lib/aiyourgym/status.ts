// ─── AI Your Gym: de status van een aanmelding (PUUR) ───────────────────────
//
//   aanvraag            pakket nog niet online af te sluiten; Kane neemt contact op
//   wacht_op_betaling   Stripe Checkout gestart, nog niet afgerond
//   inrichten           betaling is binnen, de sportschool wordt aangemaakt
//   actief              sportschool staat klaar, abonnement loopt
//   betaling_mislukt    een factuur is niet betaald (Stripe probeert opnieuw)
//   gepauzeerd          abonnement gepauzeerd in Stripe
//   opgezegd            abonnement beeindigd; eindstatus
//   test                testaccount van Kane; Stripe verandert hier nooit iets aan

export const AANMELD_STATUSSEN = ['aanvraag', 'wacht_op_betaling', 'inrichten', 'actief', 'betaling_mislukt', 'gepauzeerd', 'opgezegd', 'test'] as const
export type AanmeldStatus = (typeof AANMELD_STATUSSEN)[number]

export function isAanmeldStatus(v: unknown): v is AanmeldStatus {
  return (AANMELD_STATUSSEN as readonly unknown[]).includes(v)
}

/** De statussen waarin de sportschool bestaat en Stripe de status bijhoudt. */
const LOPEND: ReadonlySet<AanmeldStatus> = new Set(['actief', 'betaling_mislukt', 'gepauzeerd'])

export type Gebeurtenis =
  | { soort: 'abonnement'; stripeStatus: string }
  | { soort: 'abonnement_weg' }
  | { soort: 'betaling_mislukt' }

/** Een Stripe-abonnementsstatus als onze status. Onbekend: null (niets doen). */
export function statusUitAbonnement(stripeStatus: string): AanmeldStatus | null {
  switch (stripeStatus) {
    // We maken geen proefperiodes meer (besluit Kane 30-10-2026), maar Stripe kan
    // 'trialing' nog sturen voor een oud abonnement: dat telt gewoon als actief.
    case 'trialing':
    case 'active':
      return 'actief'
    case 'past_due':
    case 'unpaid':
      return 'betaling_mislukt'
    case 'paused':
      return 'gepauzeerd'
    case 'canceled':
    case 'incomplete_expired':
      return 'opgezegd'
    default:
      return null
  }
}

/**
 * De nieuwe status na een gebeurtenis van Stripe, of null als er niets
 * verandert. Alleen een lopend abonnement verandert: een aanvraag, een
 * aanmelding die nog wacht of wordt ingericht, een opgezegd abonnement en een
 * testaccount blijven zoals ze zijn.
 */
export function volgendeStatus(huidig: AanmeldStatus, g: Gebeurtenis): AanmeldStatus | null {
  if (!LOPEND.has(huidig)) return null
  const nieuw = g.soort === 'abonnement' ? statusUitAbonnement(g.stripeStatus) : g.soort === 'abonnement_weg' ? 'opgezegd' : 'betaling_mislukt'
  return nieuw && nieuw !== huidig ? nieuw : null
}

/** Mag deze aanmelding (nog) een sportschool krijgen? Alleen precies een keer, vanuit wacht_op_betaling. */
export function magInrichten(huidig: AanmeldStatus): boolean {
  return huidig === 'wacht_op_betaling'
}
