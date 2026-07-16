// ─── LifeOS — opslagfout → HTTP ─────────────────────────────────────────────
// SERVER-ONLY. Eén vertaling, gedeeld door `/api/training` en
// `/api/training/[id]`, zodat de twee routes niet uit elkaar lopen.
//
// Dit staat bewust NIET in een route-bestand: een `route.ts` mag alleen
// HTTP-methodes exporteren (zie node_modules/next/dist/docs → 01-app →
// 03-api-reference → 03-file-conventions → route.md). Een gedeelde helper
// ernaast exporteren maakt het routetype ongeldig.

import { NextResponse } from 'next/server'
import type { Reden } from './opslag'

/**
 * Vertaalt een opslag-uitkomst naar een antwoord.
 *
 * Let op de 502 bij 'db': een kapotte query is een STORING, geen lege dag. Die
 * twee hetzelfde beantwoorden zou de kaart "je trainde niet" laten tonen terwijl
 * de database plat ligt — precies de leugen die dit project uitroeit.
 */
export function foutAntwoord(reden: Reden): NextResponse {
  if (reden === 'ongeldig') {
    return NextResponse.json(
      { fout: 'Die combinatie kan niet — een geplande training draagt geen metingen.' },
      { status: 400 },
    )
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Training bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Kon je trainingen niet lezen.' }, { status: 502 })
}
