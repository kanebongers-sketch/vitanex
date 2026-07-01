'use client'

import PandaFace, { type EmotionState } from '@/components/vita/PandaFace'

export interface ChatBericht {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface VitaChatBubbleProps {
  bericht: ChatBericht
  /** Emotie voor Vita's avatar naast assistent-bubbels. */
  avatarEmotion: EmotionState
  /** Toont de knipperende cursor aan het eind van dit bericht (live streamen). */
  toonCursor: boolean
  /** Toont de "denkt na"-staat i.p.v. een lege bubbel tijdens het wachten. */
  toonDenken: boolean
}

// Presentational: één chat-regel. Assistent = Vita's panda-avatar + zachte kaart
// links; gebruiker = cyaan bubbel rechts. Puur props in → UI uit, geen state.
export default function VitaChatBubble({
  bericht,
  avatarEmotion,
  toonCursor,
  toonDenken,
}: VitaChatBubbleProps) {
  const isVita = bericht.role === 'assistant'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isVita ? 'flex-start' : 'flex-end',
        gap: 10,
      }}
    >
      {isVita && (
        <div
          style={{
            width: 34,
            height: 34,
            flexShrink: 0,
            marginTop: 2,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PandaFace emotion={avatarEmotion} size={34} />
        </div>
      )}

      {toonDenken ? (
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '12px 16px',
            borderRadius: '18px 18px 18px 4px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div className="mf-spinner" style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Vita denkt na…</span>
        </div>
      ) : (
        <div
          style={{
            maxWidth: '78%',
            padding: '12px 16px',
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            background: isVita ? 'var(--bg-card)' : 'var(--mentaforce-primary)',
            color: isVita ? 'var(--text-1)' : 'var(--bg-app)',
            border: isVita ? '1px solid var(--border)' : 'none',
            borderRadius: isVita ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
          }}
        >
          {bericht.content}
          {toonCursor && <span className="mf-coach-cursor" aria-hidden />}
        </div>
      )}
    </div>
  )
}
