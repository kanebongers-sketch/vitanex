'use client'

import type { CSSProperties } from 'react'

// Het AI-voorstel waar het model NIET zeker genoeg over was.
//
// ─── DIT COMPONENT IS DE EERLIJKHEIDSREGEL, IN UI-VORM ──────────────────────
//   De app paste elke categorie-suggestie meteen toe, ongeacht hoe zeker het
//   model was — het `vertrouwen` werd niet eens meegestuurd door de API. Een gok
//   van 0.2 schoof je notitie dus stil in de verkeerde bak, met precies dezelfde
//   stelligheid als een treffer van 0.95.
//
//   Boven de drempel (`VERTROUWEN_DREMPEL` in intentie.ts) past de app het toe.
//   Daaronder verschijnt dít: de gok als vraag. Het percentage staat erbij omdat
//   het een echt getal van het model is — geen sier, en niets verzonnen.
//
// Presentational: krijgt het voorstel, geeft ja/nee terug.

interface CategorieVoorstelProps {
  categorie: string
  /** 0-1, van het model zelf. */
  vertrouwen: number
  onJa: () => void
  onNee: () => void
}

export function CategorieVoorstel({ categorie, vertrouwen, onJa, onNee }: CategorieVoorstelProps) {
  return (
    <div style={WIKKEL}>
      <span style={{ color: 'var(--text-3)' }}>
        Vita denkt: <strong style={{ color: 'var(--text-1)', fontWeight: 600 }}>{categorie}</strong> — maar
        twijfelt ({Math.round(vertrouwen * 100)}% zeker).
      </span>
      <span style={{ display: 'inline-flex', gap: 6 }}>
        <button type="button" onClick={onJa} style={{ ...KNOP, borderStyle: 'solid', color: 'var(--brand)' }}>
          Toepassen
        </button>
        <button type="button" onClick={onNee} style={KNOP}>
          Laat maar
        </button>
      </span>
    </div>
  )
}

const WIKKEL: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
  padding: '7px 9px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  fontSize: 11,
  lineHeight: 1.5,
}

const KNOP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 999,
  border: '1px dashed var(--line)',
  background: 'transparent',
  color: 'var(--text-4)',
  cursor: 'pointer',
}
