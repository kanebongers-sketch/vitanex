// ─── LifeOS — OAuth-state voor herstelkoppelingen ──────────────────────────
// Dunne laag om `@/lib/lifeos/auth/oauth-state`. Die module tekent en verifieert;
// hier staat alleen wat déze feature ervan nodig heeft.

import { maakState, leesState } from '@/lib/lifeos/auth/oauth-state'
import { isKoppelbareDienst, type KoppelbareDienst } from './diensten'

/**
 * Een getekende state voor deze dienst.
 *
 * WHOOP eist een state van minstens 8 tekens. Een HMAC-state is ruim langer,
 * maar we controleren het hier: een te korte state levert bij WHOOP een obscure
 * autorisatiefout op, en die wil je in je eigen code vinden, niet in hun UI.
 */
export function maakKoppelState(dienst: KoppelbareDienst): string {
  const state = maakState(dienst)
  if (state.length < 8) throw new Error('oauth-state is te kort voor WHOOP')
  return state
}

/**
 * Valideert de state uit een callback en geeft de dienst terug.
 * Null = ongeldig, verlopen of vervalst → de callback moet hard falen.
 *
 * `leesState` kent meer diensten dan deze feature (agenda, mail). Een state die
 * voor Gmail is getekend, is hier geen geldige state — vandaar de tweede check.
 */
export function leesKoppelState(state: string | null): KoppelbareDienst | null {
  const gelezen = leesState(state)
  if (gelezen === null) return null
  return isKoppelbareDienst(gelezen.dienst) ? gelezen.dienst : null
}
