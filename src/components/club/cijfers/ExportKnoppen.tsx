'use client'

import { ChevronDown, Download } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CIJFERS } from '@/lib/aiyourgym/taal/woorden/club/cijfers'
import type { HoofdstukExport } from './context'

// Exporteren in de kop van een hoofdstuk op Cijfers: dezelfde CSV als op
// /club/rapporten (src/lib/club/rapporten/exports.ts). Een rapport is een knop,
// meer rapporten staan achter een tik in een klein menu.

interface Props {
  exports: readonly HoofdstukExport[]
  /** De naam van het hoofdstuk, voor de schermlezer. */
  hoofdstuk: string
}

export function ExportKnoppen({ exports, hoofdstuk }: Props) {
  const t = useTekst(CIJFERS).exports
  if (exports.length === 1) {
    const [e] = exports
    return (
      <a href={e.href} download className="club-knop club-knop--stil club-knop--klein club-cijfers-export" aria-label={t.downloaden(e.label)}>
        <Download aria-hidden size={14} /> {t.exporteren}
      </a>
    )
  }
  return (
    <details className="club-cijfers-exportmenu">
      <summary className="club-knop club-knop--stil club-knop--klein club-cijfers-export" aria-label={t.hoofdstuk(hoofdstuk)}>
        <Download aria-hidden size={14} /> {t.exporteren} <ChevronDown aria-hidden size={14} className="club-cijfers-exportpijl" />
      </summary>
      <ul role="list">
        {exports.map((e) => (
          <li key={e.href}>
            <a href={e.href} download aria-label={t.downloaden(e.label)}>
              {e.label} <span aria-hidden>CSV</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}
