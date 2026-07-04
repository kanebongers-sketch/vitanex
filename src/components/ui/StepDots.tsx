'use client';

import type { CSSProperties } from 'react';

/**
 * Voortgangs-dots voor stapsgewijze flows (reflectievragen, wizards, historie).
 *
 * Twee gedaanten:
 * - zonder `onSelect`: puur decoratief (aria-hidden) — de tekst ernaast
 *   ("3 van 6 vragen") draagt de betekenis;
 * - met `onSelect`: klikbare stappen-navigatie met ruime hit-targets,
 *   aria-labels, aria-current en een zichtbare focus-ring.
 *
 * Kleuren uitsluitend via tokens: voltooid = --mentaforce-primary,
 * open = --border-strong, actieve ring = --mentaforce-primary-light.
 */

export interface StepDotsProps {
  /** Totaal aantal stappen. */
  count: number;
  /** Index van de actieve stap (ring-markering + aria-current="step"). */
  activeIndex?: number;
  /** Per index: is de stap voltooid/ingevuld? */
  completed?: readonly boolean[];
  /** Maakt de dots klikbaar. Geef dan ook `stepLabel` en `navLabel` mee. */
  onSelect?: (index: number) => void;
  /** Toegankelijk label per stap (fallback: "Stap N van M"). */
  stepLabel?: (index: number) => string;
  /** aria-label van de nav-wrapper (alleen relevant bij `onSelect`). */
  navLabel?: string;
  /** Diameter van een dot in px (default 6). */
  dotSize?: number;
  /** Border-radius van een dot in px (default rond: dotSize / 2). */
  dotRadius?: number;
  /** Ruimte tussen de dots (bij klikbaar: tussen de hit-targets). */
  gap?: number;
}

/** Zijde van het klikbare hit-target rond een dot (WCAG-vriendelijk ruim). */
const HIT_TARGET = 24;

function dotStyle(size: number, radius: number, isVoltooid: boolean): CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: radius,
    background: isVoltooid ? 'var(--mentaforce-primary)' : 'var(--border-strong)',
  };
}

export function StepDots({
  count,
  activeIndex,
  completed,
  onSelect,
  stepLabel,
  navLabel,
  dotSize = 6,
  dotRadius,
  gap = 3,
}: StepDotsProps) {
  const radius = dotRadius ?? dotSize / 2;
  const indices = Array.from({ length: count }, (_, i) => i);

  if (!onSelect) {
    return (
      <div style={{ display: 'flex', gap }} aria-hidden>
        {indices.map(i => (
          <span key={i} style={dotStyle(dotSize, radius, Boolean(completed?.[i]))} />
        ))}
      </div>
    );
  }

  return (
    <nav aria-label={navLabel} style={{ display: 'flex', gap }}>
      {indices.map(i => {
        const isActief = i === activeIndex;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className="mf-stepdots-dot"
            aria-label={stepLabel?.(i) ?? `Stap ${i + 1} van ${count}`}
            aria-current={isActief ? 'step' : undefined}
            style={{
              width: HIT_TARGET,
              height: HIT_TARGET,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span
              aria-hidden
              style={{
                ...dotStyle(dotSize, radius, Boolean(completed?.[i])),
                boxShadow: isActief ? '0 0 0 3px var(--mentaforce-primary-light)' : 'none',
                transition: 'background 0.2s var(--ease), box-shadow 0.2s var(--ease)',
              }}
            />
          </button>
        );
      })}
      <style>{stepDotsStyle}</style>
    </nav>
  );
}

const stepDotsStyle = `
.mf-stepdots-dot:focus-visible {
  outline: 2px solid var(--mentaforce-primary);
  outline-offset: 2px;
  border-radius: 6px;
}
`;
