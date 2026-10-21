// ─── AI Your Gym: de dag in Nederlandse tijd (PUUR) ─────────────────────────

const DAG_NL = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Amsterdam' })

/** De dagsleutel (JJJJ-MM-DD) van `nu` in Nederlandse tijd. */
export function dagSleutelNl(nu: Date): string {
  return DAG_NL.format(nu)
}
