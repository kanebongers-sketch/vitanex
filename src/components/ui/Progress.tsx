import type { CSSProperties, ReactNode } from 'react';

/**
 * Toegankelijke progressbar voor MentaForce.
 *
 * Vervangt de div-balken zonder ARIA die door de app verspreid staan.
 * Geeft altijd role="progressbar" + aria-valuenow/min/max zodat de
 * voortgang voorleesbaar is. Optioneel tekstlabel.
 *
 * Reduced-motion-aware: animeert alleen transform (scaleX), nooit width,
 * en zet de transitie uit bij prefers-reduced-motion: reduce.
 *
 * Voorbeeld:
 *   <Progress value={72} label="Energie" showValue />
 */

export interface ProgressProps {
  /** Huidige waarde. */
  value: number;
  /** Minimum (default 0). */
  min?: number;
  /** Maximum (default 100). */
  max?: number;
  /** Zichtbaar label boven de balk. */
  label?: ReactNode;
  /** Toon het percentage rechts naast het label. */
  showValue?: boolean;
  /** Toegankelijke naam wanneer er geen zichtbaar label is. */
  ariaLabel?: string;
  /** Kleur van de vulling (token). Default: cyaan accent. */
  color?: string;
  /** Hoogte van de balk in px. */
  thickness?: number;
  style?: CSSProperties;
}

function clampFraction(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  const clamped = Math.min(Math.max(value, min), max);
  return (clamped - min) / (max - min);
}

export function Progress({
  value,
  min = 0,
  max = 100,
  label,
  showValue = false,
  ariaLabel,
  color = 'var(--mentaforce-primary)',
  thickness = 8,
  style,
}: ProgressProps) {
  const fraction = clampFraction(value, min, max);
  const percent = Math.round(fraction * 100);
  // Tekstueel label voor de bar: zichtbaar label (indien string) of expliciete
  // ariaLabel. We koppelen via aria-label i.p.v. een gegenereerd id, zodat dit
  // component een Server Component kan blijven zonder hydration-mismatch.
  const accessibleName = ariaLabel ?? (typeof label === 'string' ? label : undefined);

  return (
    <div style={style}>
      {label ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '6px',
            fontSize: '13px',
            color: 'var(--text-2)',
          }}
        >
          <span>{label}</span>
          {showValue ? (
            <span style={{ color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
              {percent}%
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={accessibleName}
        aria-valuetext={`${percent}%`}
        style={{
          position: 'relative',
          width: '100%',
          height: thickness,
          borderRadius: '999px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          className="mf-progress-fill"
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left center',
            transform: `scaleX(${fraction})`,
            background: color,
            borderRadius: '999px',
          }}
        />
      </div>
      <style>{progressStyle}</style>
    </div>
  );
}

const progressStyle = `
.mf-progress-fill {
  transition: transform 0.4s var(--ease, ease);
  will-change: transform;
}
@media (prefers-reduced-motion: reduce) {
  .mf-progress-fill {
    transition: none;
    will-change: auto;
  }
}
`;
