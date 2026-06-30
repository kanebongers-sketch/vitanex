import type { CSSProperties, HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
  radius?: CSSProperties['borderRadius'];
  circle?: boolean;
}

/**
 * Token-gebaseerde skeleton-placeholder. De shimmer-animatie wordt via de
 * bestaande `.mf-skeleton`-klasse afgehandeld en is reduced-motion-aware
 * (zie globals.css).
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius,
  circle = false,
  style,
  className,
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`mf-skeleton${className ? ` ${className}` : ''}`}
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : (radius ?? 'var(--radius-sm)'),
        ...style,
      }}
      {...rest}
    />
  );
}
