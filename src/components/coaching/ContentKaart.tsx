'use client'

import { ChevronRight } from 'lucide-react'
import {
  PIJLER_LABELS,
  PIJLER_STIJL,
  CONTENT_TYPE_LABELS,
  type CoachingContent,
} from '@/lib/coaching/content'
import { PIJLER_ICOON, CONTENT_TYPE_ICOON } from '@/components/coaching/content-iconen'

export interface ContentKaartProps {
  content: CoachingContent
  onOpen: () => void
}

/** Eerste regels van de inhoud als rustige preview (geen opmaak, veilig). */
function preview(inhoud: string): string {
  const schoon = inhoud.replace(/\s+/g, ' ').trim()
  return schoon.length > 140 ? `${schoon.slice(0, 140)}…` : schoon
}

/**
 * Klant-facing kaart voor één stuk content in de leeslijst. Puur presentational;
 * de detailweergave zit in de pagina. Als knop uitgevoerd voor toetsenbord-toegang.
 */
export function ContentKaart({ content, onOpen }: ContentKaartProps) {
  const stijl = PIJLER_STIJL[content.pijler]
  const Icoon = CONTENT_TYPE_ICOON[content.type]
  const PijlerIcoon = PIJLER_ICOON[content.pijler]

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mf-lift"
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px 18px', borderRadius: 'var(--radius-card)',
        background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
      }}
    >
      <span aria-hidden style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: stijl.bg, color: stijl.color,
      }}>
        <Icoon size={19} />
      </span>

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
          {content.titel}
        </span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)', marginTop: 3, lineHeight: 1.5 }}>
          {preview(content.inhoud)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600,
            padding: '2px 8px', borderRadius: 100, background: stijl.bg, color: stijl.color,
          }}>
            <PijlerIcoon size={11} aria-hidden /> {PIJLER_LABELS[content.pijler]}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
            background: 'var(--bg-subtle)', color: 'var(--text-3)', border: '1px solid var(--border-strong)',
          }}>
            {CONTENT_TYPE_LABELS[content.type]}
          </span>
        </span>
      </span>

      <ChevronRight size={16} aria-hidden style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: 2 }} />
    </button>
  )
}
