import type { CSSProperties, ReactNode } from 'react';

const KAART_STIJL: CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 24,
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  padding: '36px 32px',
};

const MAX_BREEDTE = {
  sm: 'max-w-sm',
  lg: 'max-w-lg',
} as const;

export interface AuthKaartProps {
  children?: ReactNode;
  /** Kaartbreedte: 'sm' (default, 24rem) of 'lg' (32rem). */
  maxWidth?: keyof typeof MAX_BREEDTE;
  /** Extra klassen op de kaart, bv. 'text-center' of 'relative'. */
  className?: string;
  /** Style-overrides op de kaart, bovenop de gedeelde kaartstijl. */
  style?: CSSProperties;
  /** Decoratieve laag die vóór de kaart in de mesh-wrapper rendert (bv. blobs). */
  achtergrond?: ReactNode;
  /** Content die onder de kaart in de mesh-wrapper rendert (bv. footer-regel). */
  naKaart?: ReactNode;
}

/**
 * Gedeelde auth-pagina-primitive: gecentreerde mesh-achtergrond (`<main>`)
 * met daarin de standaard auth-kaart. Puur presentational — pagina's leveren
 * alle content en interactie zelf aan.
 */
export function AuthKaart({
  children,
  maxWidth = 'sm',
  className,
  style,
  achtergrond,
  naKaart,
}: AuthKaartProps) {
  const kaartKlassen = ['w-full', MAX_BREEDTE[maxWidth], 'mf-animate-up', className]
    .filter(Boolean)
    .join(' ');

  return (
    <main className="mf-mesh-bg min-h-screen flex flex-col items-center justify-center p-5">
      {achtergrond}
      <div className={kaartKlassen} style={{ ...KAART_STIJL, ...style }}>
        {children}
      </div>
      {naKaart}
    </main>
  );
}
