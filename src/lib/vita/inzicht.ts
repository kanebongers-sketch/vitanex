// ─── Vita-inzicht (puur) ────────────────────────────────────────────────────
// Kiest één eerlijk, persoonlijk inzicht uit je data — Vita's stem op de home.
// Alleen bij een écht signaal: geen data / niks bijzonders → null (geen holle
// peptalk). Positieve winst gaat vóór een zachte, concrete tip.

export interface VitaSignalen {
  slaapDezeWeek: number | null
  slaapVorigeWeek: number | null
  slaapschuld: number | null
  regelmaat: number | null
  streak: number
}

export interface VitaInzichtTekst {
  tekst: string
  emoji: string
  toon: 'winst' | 'tip'
}

/** Procentuele verandering, of null als een van beide ontbreekt/0 is. */
function deltaPct(nu: number | null, eerder: number | null): number | null {
  if (nu === null || eerder === null || eerder <= 0) return null
  return Math.round(((nu - eerder) / eerder) * 100)
}

/**
 * Het beste inzicht van dit moment, of null. Volgorde = prioriteit: eerst échte
 * winst vieren, dan één zachte tip als er iets terugliep. Nooit iets verzinnen.
 */
export function kiesVitaInzicht(s: VitaSignalen): VitaInzichtTekst | null {
  const slaapDelta = deltaPct(s.slaapDezeWeek, s.slaapVorigeWeek)

  // 1. Slaap duidelijk beter dan vorige week.
  if (slaapDelta !== null && slaapDelta >= 8) {
    return { tekst: `Je slaapt dit weekgemiddeld ${slaapDelta}% meer dan vorige week — mooi volgehouden.`, emoji: '💤', toon: 'winst' }
  }
  // 2. Slaapschuld weggewerkt.
  if (s.slaapschuld !== null && s.slaapschuld === 0 && s.slaapDezeWeek !== null) {
    return { tekst: 'Je slaapschuld staat op nul. Je lichaam dankt je ervoor.', emoji: '✅', toon: 'winst' }
  }
  // 3. Regelmatige bedtijd.
  if (s.regelmaat !== null && s.regelmaat >= 75) {
    return { tekst: 'Je bedtijd is lekker regelmatig deze week — dat is precies wat je slaap sterker maakt.', emoji: '🌙', toon: 'winst' }
  }
  // 4. Streak-aanmoediging (los van de mijlpaal-vieringen).
  if (s.streak >= 3) {
    return { tekst: `Al ${s.streak} dagen op rij bezig — zo bouw je een gewoonte die blijft.`, emoji: '🔥', toon: 'winst' }
  }
  // 5. Zachte tip als de slaap terugliep.
  if (slaapDelta !== null && slaapDelta <= -10) {
    return { tekst: 'Je sliep dit weekgemiddeld wat minder. Probeer vanavond eens 20 min eerder naar bed.', emoji: '🛏️', toon: 'tip' }
  }
  return null
}
