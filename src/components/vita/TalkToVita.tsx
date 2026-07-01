'use client'

import { MessageCircle, ChevronRight } from 'lucide-react'

// Rustige, duidelijke affordance om vanuit de companion een echt gesprek met
// VITA te starten (navigeert naar /coach). Zo is de companion op elke pagina
// conversationeel bereikbaar. Strikt navy + cyan via tokens; ontworpen
// hover/focus/active states, zichtbare focus-ring via .vita-focusable.

interface TalkToVitaProps {
  onStart: () => void
}

export default function TalkToVita({ onStart }: TalkToVitaProps) {
  return (
    <div style={{ padding: '0 14px 14px' }}>
      <button
        className="vita-focusable vita-talk"
        onClick={onStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          width: '100%',
          padding: '11px 13px',
          background: 'var(--mentaforce-primary-light)',
          border: '1px solid color-mix(in srgb, var(--mentaforce-primary) 40%, transparent)',
          borderRadius: 13,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          transition: 'transform 0.15s cubic-bezier(0.16,1,0.3,1), border-color 0.15s ease, background 0.15s ease',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 30,
            height: 30,
            flexShrink: 0,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid color-mix(in srgb, var(--mentaforce-primary) 45%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mentaforce-primary)',
          }}
        >
          <MessageCircle size={15} strokeWidth={2} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
            Praat met VITA
          </span>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
            Stel een vraag over jouw welzijn
          </span>
        </span>
        <ChevronRight size={16} color="var(--mentaforce-primary)" aria-hidden="true" style={{ flexShrink: 0 }} />
      </button>
    </div>
  )
}
