'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { STRUCTURES } from '@/data/brainStructures'

const glass = {
  background: 'rgba(8, 14, 28, 0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 20,
  boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
} as const

const PANEL_WIDTH = 300

interface AtlasInfoPanelProps {
  activeIdx: number
}

export default function AtlasInfoPanel({ activeIdx }: AtlasInfoPanelProps) {
  const s = STRUCTURES[activeIdx]

  return (
    <div style={{
      position: 'fixed', right: 32, top: '50%',
      transform: 'translateY(-50%)',
      width: PANEL_WIDTH, zIndex: 10,
      pointerEvents: 'none',
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={s.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{ ...glass, padding: '24px 22px' }}
        >
          {/* Header */}
          <p style={{
            fontFamily: 'var(--font-body, system-ui)',
            fontWeight: 600, fontSize: 10,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: s.color, marginBottom: 12,
          }}>
            {String(activeIdx + 1).padStart(2, '0')} / {STRUCTURES.length}
          </p>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 30, lineHeight: 1 }}>{s.emoji}</span>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display, system-ui)',
                fontWeight: 500, fontSize: 18,
                color: '#f0f4ff',
                letterSpacing: '-0.02em', margin: 0,
              }}>
                {s.name}
              </h2>
              <p style={{
                fontSize: 11, color: 'rgba(160,180,210,0.6)',
                fontStyle: 'italic', margin: 0, marginTop: 2,
              }}>
                {s.latinName}
              </p>
            </div>
          </div>

          {/* Function */}
          <p style={{
            fontSize: 13, lineHeight: 1.65,
            color: 'rgba(200,215,240,0.85)',
            marginBottom: 16,
          }}>
            {s.primaryFunction}
          </p>

          {/* Tasks */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.10em', textTransform: 'uppercase',
              color: 'rgba(160,180,210,0.5)', marginBottom: 7 }}>
              Functies
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {s.tasks.map(task => (
                <span key={task} style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 8,
                  background: `${s.color}18`,
                  border: `1px solid ${s.color}28`,
                  color: s.color,
                }}>
                  {task}
                </span>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.10em', textTransform: 'uppercase',
              color: 'rgba(160,180,210,0.5)', marginBottom: 7 }}>
              Aandoeningen
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {s.conditions.map(c => (
                <span key={c} style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(200,215,240,0.7)',
                }}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Fun fact */}
          <div style={{
            background: `${s.color}12`,
            border: `1px solid ${s.color}25`,
            borderRadius: 12, padding: '10px 13px',
          }}>
            <p style={{
              fontSize: 11, lineHeight: 1.65,
              color: 'rgba(200,215,240,0.80)',
              margin: 0,
            }}>
              💡 {s.funFact}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
