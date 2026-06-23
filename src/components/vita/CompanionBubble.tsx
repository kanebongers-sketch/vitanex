'use client'

import { useEffect, useState } from 'react'
import { EmotionState } from '@/components/vita/PandaFace'

interface CompanionBubbleProps {
  message: string
  emotion: EmotionState
  onDismiss: () => void
  duration?: number
}

const EMOTION_COLORS: Record<EmotionState, string> = {
  calm: '#5B8DF0',
  focused: '#7c3aed',
  proud: '#f59e0b',
  concerned: '#ef4444',
  motivated: '#10b981',
  curious: '#8b5cf6',
  supportive: '#ec4899',
}

export default function CompanionBubble({
  message,
  emotion,
  onDismiss,
  duration = 5500,
}: CompanionBubbleProps) {
  const [visible, setVisible] = useState(false)
  const accentColor = EMOTION_COLORS[emotion]

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setVisible(true)
    }, 50)

    const hideTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        onDismiss()
      }, 350)
    }, duration)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [duration, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        bottom: '100%',
        right: 0,
        marginBottom: 12,
        maxWidth: 240,
        minWidth: 160,
        background: 'var(--bg-card)',
        border: `1px solid ${accentColor}33`,
        borderRadius: 16,
        padding: '10px 14px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px ${accentColor}22`,
        fontSize: 13,
        color: 'var(--text-1)',
        lineHeight: 1.55,
        fontWeight: 500,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.94)',
        transition: 'opacity 0.3s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)',
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
        zIndex: 10000,
      }}
    >
      {message}
      <div
        style={{
          position: 'absolute',
          bottom: -6,
          right: 22,
          width: 12,
          height: 12,
          background: 'var(--bg-card)',
          border: `1px solid ${accentColor}33`,
          borderTop: 'none',
          borderLeft: 'none',
          transform: 'rotate(45deg)',
        }}
      />
    </div>
  )
}
