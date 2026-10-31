// ─── AI Your Gym, tweestaps: uitkomsten als API-antwoord (SERVER) ───────────
// Elke fout gaat terug met een vaste `code` (de browser kiest daarmee de tekst
// in de taal van de pagina, foutTekst in melding.ts) en een Nederlandse `fout`
// als terugval. Nooit een geheim, hash of interne melding.

import type { NextResponse } from 'next/server'
import { clubJson } from '@/lib/club/toegang'
import type { FoutCode } from './melding'

const NL: Record<FoutCode, string> = {
  leeg: 'Vul de code in.',
  fout: 'Deze code klopt niet.',
  geblokkeerd: 'Te vaak een foute code. Probeer het later opnieuw.',
  gesloten: 'Te vaak een foute code: tweestapsverificatie is dicht.',
  geen_sleutel: 'De sleutel voor tweestapsverificatie ontbreekt op de server.',
  verlopen: 'Deze stap is verlopen. Log opnieuw in.',
  geremd: 'Te veel pogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.',
  al_aan: 'Tweestapsverificatie staat al aan.',
  niet_bezig: 'Begin opnieuw met Instellen.',
  algemeen: 'Dat lukte niet. Probeer het opnieuw.',
}

const STATUS: Record<FoutCode, number> = {
  leeg: 400, fout: 401, geblokkeerd: 429, gesloten: 429, geen_sleutel: 503, verlopen: 401, geremd: 429, al_aan: 409, niet_bezig: 409, algemeen: 502,
}

export function tweestapsFout(code: FoutCode, extra: { over?: number; totOp?: string } = {}): NextResponse {
  return clubJson({ fout: NL[code], code, ...extra }, STATUS[code])
}

type Fout =
  | { staat: 'fout'; over: number }
  | { staat: 'geblokkeerd'; totOp: string }
  | { staat: 'gesloten' }
  | { staat: 'geen_sleutel' }
  | { staat: 'db' }
  | { staat: 'niet_bezig' }
  | { staat: 'niet_aan' }

/** Een mislukte controle als antwoord. */
export function codeFout(uit: Fout): NextResponse {
  switch (uit.staat) {
    case 'fout':
      return tweestapsFout('fout', { over: uit.over })
    case 'geblokkeerd':
      return tweestapsFout('geblokkeerd', { totOp: uit.totOp })
    case 'gesloten':
      return tweestapsFout('gesloten')
    case 'geen_sleutel':
      return tweestapsFout('geen_sleutel')
    case 'niet_bezig':
    case 'niet_aan':
      return tweestapsFout('niet_bezig')
    default:
      return tweestapsFout('algemeen')
  }
}
