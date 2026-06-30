import type { CSSProperties, ReactNode } from 'react';

/**
 * Toegankelijke SVG ring-progress (donut) voor MentaForce.
 *
 * Geeft de container role="img" + een verplicht aria-label, zodat de
 * voortgang voorleesbaar is ondanks de decoratieve SVG. Token-kleuren,
 * geen hardcoded hex.
 *
 * Reduced-motion-aware: animeert alleen stroke-dashoffset via een
 * transitie die uitgezet wordt bij prefers-reduced-motion: reduce.
 *
 * Voorbeeld:
 *   <Ring value={68} ariaLabel="Energie 68 procent">
 *     <strong>68%</strong>
 *   </Ring>
 */

export interface RingProps {
  /** Huidige waarde. */
  value: number;
  /** Minimum (default 0). */
  min?: number;
  /** Maximum (default 100). */
  max?: number;
  /** Verplicht tekstalternatief voor de role="img" container. */
  ariaLabel: string;
  /** Diameter in px. */
  size?: number;
  /** Dikte van de ring in px. */
  thickness?: number;
  /** Kleur van de voortgang (token). Default: cyaan accent. */
  color?: string;
  /** Kleur van het spoor (token). */
  trackColor?: string;
  /** Inhoud in het midden (bv. percentage). Decoratief (aria-hidden). */
  children?: ReactNode;
  style?: CSSProperties;
}

function clampFraction(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  const clamped = Math.min(Math.max(value, min), max);
  return (clamped - min) / (max - min);
}

export function Ring({
  value,
  min = 0,
  max = 100,
  ariaLabel,
  size = 96,
  thickness = 8,
  color = 'var(--mentaforce-primary)',
  trackColor = 'var(--bg-subtle)',
  children,
  style,
}: RingProps) {
  const fraction = clampFraction(value, min, max);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        focusable="false"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        <circle
          className="mf-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      {children ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-1)',
            fontSize: size >= 80 ? '18px' : '13px',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {children}
        </div>
      ) : null}
      <style>{ringStyle}</style>
    </div>
  );
}

const ringStyle = `
.mf-ring-fill {
  transition: stroke-dashoffset 0.4s var(--ease, ease);
}
@media (prefers-reduced-motion: reduce) {
  .mf-ring-fill {
    transition: none;
  }
}
`;
