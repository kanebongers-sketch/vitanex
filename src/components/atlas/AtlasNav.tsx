'use client'

import { motion } from 'framer-motion'
import { STRUCTURES } from '@/data/brainStructures'

interface AtlasNavProps {
  activeIdx: number
  onSelect: (idx: number) => void
}

export default function AtlasNav({ activeIdx, onSelect }: AtlasNavProps) {
  return (
    <div style={{
      position: 'fixed', left: 28, top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 10,
      display: 'flex', flexDirection: 'column', gap: 2,
      background: 'rgba(5, 8, 18, 0.65)',
      backdropFilter: 'blur(18px) saturate(1.5)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '12px 6px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      pointerEvents: 'auto',
    }}>
      {STRUCTURES.map((s, i) => {
        const isActive = i === activeIdx
        return (
          <button
            key={s.id}
            onClick={() => onSelect(i)}
            title={s.name}
            style={{
              background: isActive ? `${s.color}16` : 'none',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 12px', borderRadius: 11,
              opacity: isActive ? 1 : 0.38,
              transition: 'all 0.25s ease',
            }}
          >
            <motion.span
              animate={{ scale: isActive ? 1 : 0.85 }}
              transition={{ duration: 0.2 }}
              style={{ fontSize: 15, lineHeight: 1 }}
            >
              {s.emoji}
            </motion.span>
            <span style={{
              fontFamily: 'var(--font-display, system-ui)',
              fontWeight: 500, fontSize: 13,
              color: isActive ? s.color : 'rgba(180,200,230,0.7)',
              letterSpacing: '-0.01em',
              transition: 'color 0.25s',
              whiteSpace: 'nowrap',
            }}>
              {s.name}
            </span>
            {isActive && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: s.color,
                  boxShadow: `0 0 8px ${s.color}`,
                  flexShrink: 0,
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
