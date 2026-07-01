'use client'

// Rustig viering-moment over de orb: een korte cyan glow-puls + zachte ring.
// Premium en klein — alleen transform/opacity, en bij prefers-reduced-motion
// tonen we de eindstaat (een subtiele statische ring) zonder beweging.
//
// Puur presentational: geen state, geen effects. De companion mount 'm kort
// en unmount 'm daarna weer; de key-reset zorgt dat de animatie opnieuw speelt.

interface CelebrationBurstProps {
  /** Diameter van de orb waar de burst omheen valt (px). */
  size: number
}

export default function CelebrationBurst({ size }: CelebrationBurstProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: size,
        height: size,
        pointerEvents: 'none',
        display: 'block',
      }}
    >
      <style>{`
        @keyframes vita-celebrate-ring {
          0%   { opacity: 0; transform: scale(0.72); }
          35%  { opacity: 0.9; }
          100% { opacity: 0; transform: scale(1.9); }
        }
        @keyframes vita-celebrate-glow {
          0%   { opacity: 0; transform: scale(0.9); }
          40%  { opacity: 1; transform: scale(1.06); }
          100% { opacity: 0; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vita-celebrate-ring,
          .vita-celebrate-glow { animation: none !important; }
          .vita-celebrate-ring { opacity: 0.5; transform: scale(1.18); }
          .vita-celebrate-glow { opacity: 0.35; transform: scale(1); }
        }
      `}</style>

      {/* Zachte glow-halo direct om de orb */}
      <span
        className="vita-celebrate-glow"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          boxShadow: '0 0 22px 6px color-mix(in srgb, var(--mentaforce-primary) 55%, transparent)',
          animation: 'vita-celebrate-glow 1.6s cubic-bezier(0.16,1,0.3,1) both',
        }}
      />

      {/* Uitdijende cyan ring */}
      <span
        className="vita-celebrate-ring"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px solid var(--mentaforce-primary)',
          transformOrigin: 'center',
          animation: 'vita-celebrate-ring 1.6s cubic-bezier(0.16,1,0.3,1) both',
        }}
      />
    </span>
  )
}
