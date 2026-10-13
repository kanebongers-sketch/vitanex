// Publieke basis-URL van MentaForce voor links buiten de browser: mails,
// OAuth-terugkeer (Google Fit, Fitbit, Google Agenda) en Stripe.
//
// MENTAFORCE_APP_URL (Render-env, bv. https://releasev.nl/mentaforce) gaat voor;
// zonder die instelling blijft alles zoals het was (NEXT_PUBLIC_APP_URL).
// Alleen voor MentaForce: LifeOS en Fit Factory blijven NEXT_PUBLIC_APP_URL / APP_URL gebruiken.
export function mentaforceAppUrl(): string | undefined {
  const url = process.env.MENTAFORCE_APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL
  if (!url || url === 'undefined') return undefined
  return url.replace(/\/+$/, '')
}
