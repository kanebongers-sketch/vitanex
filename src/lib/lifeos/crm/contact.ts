// ─── LifeOS — CRM: contact-links ────────────────────────────────────────────
// Veilige links uit ruwe CRM-velden. Puur, geen React. Elke functie geeft een
// href of `null` — nooit een half-kapotte link waar de UI dan een dode knop van
// maakt. Zo kan de kaart/popup simpel zeggen: is er een href? toon de knop.
//
// De telefoon-normalisatie is bewust simpel: cijfers plus een optionele leidende
// `+`, de rest eruit. Voor WhatsApp gelden strengere eisen (internationaal, geen
// `+` of leidende nul), met een NL-heuristiek — Kane's contacten zijn NL.

/**
 * Ruwe telefoon → `+<cijfers>` of `<cijfers>`, of null als het te kort is om een
 * echt nummer te zijn. Behoudt een leidende `+`; gooit spaties, streepjes,
 * haakjes weg.
 */
export function normaliseerTelefoon(ruw: string | null | undefined): string | null {
  if (!ruw) return null
  const plus = ruw.trim().startsWith('+')
  const cijfers = ruw.replace(/\D/g, '')
  if (cijfers.length < 6) return null
  return (plus ? '+' : '') + cijfers
}

/** `tel:`-link voor een bel-knop, of null. */
export function telHref(telefoon: string | null | undefined): string | null {
  const n = normaliseerTelefoon(telefoon)
  return n ? `tel:${n}` : null
}

/** `sms:`-link, of null. */
export function smsHref(telefoon: string | null | undefined): string | null {
  const n = normaliseerTelefoon(telefoon)
  return n ? `sms:${n}` : null
}

/**
 * `https://wa.me/<nummer>`-link, of null. WhatsApp wil het nummer internationaal
 * en ZONDER `+` of leidende nullen:
 *   "+31 6 1234 5678" → wa.me/31612345678
 *   "06-12345678"     → wa.me/31612345678   (NL-mobiel: 0 → 31)
 *   "0031612345678"   → wa.me/31612345678   (00 → internationaal)
 * Een NL-nummer dat met een enkele 0 begint krijgt landcode 31.
 */
export function whatsappHref(telefoon: string | null | undefined): string | null {
  const n = normaliseerTelefoon(telefoon)
  if (!n) return null

  let digits = n.replace(/^\+/, '')
  if (digits.startsWith('00')) {
    digits = digits.slice(2)
  } else if (digits.startsWith('0')) {
    // NL binnenlands formaat (06…, 040…): leidende 0 eruit, landcode 31 ervoor.
    digits = '31' + digits.slice(1)
  }

  if (digits.length < 8) return null
  return `https://wa.me/${digits}`
}

// Bewust simpel: één @ met een punt erachter. We valideren geen RFC-5322 — dit
// bepaalt alleen of we een mailto-knop tonen, niet of de mail aankomt.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** `mailto:`-link, of null als het geen plausibel e-mailadres is. */
export function mailHref(email: string | null | undefined): string | null {
  if (!email) return null
  const e = email.trim()
  return EMAIL_RE.test(e) ? `mailto:${e}` : null
}
