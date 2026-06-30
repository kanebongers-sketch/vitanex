import type { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const VARIANT_STYLE: Record<BadgeVariant, React.CSSProperties> = {
  neutral: {
    color: 'var(--text-2)',
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border-strong)',
  },
  accent: {
    color: 'var(--mentaforce-primary)',
    background: 'var(--mentaforce-primary-light)',
    border: '1px solid var(--mentaforce-primary)',
  },
  success: {
    color: 'var(--mf-green)',
    background: 'var(--mf-green-light)',
    border: '1px solid var(--mf-green)',
  },
  warning: {
    color: 'var(--mf-amber)',
    background: 'var(--mf-amber-light)',
    border: '1px solid var(--mf-amber)',
  },
  danger: {
    color: 'var(--mf-red)',
    background: 'var(--mf-red-light)',
    border: '1px solid var(--mf-red)',
  },
};

export function Badge({ variant = 'neutral', children, style, ...rest }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '100px',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...VARIANT_STYLE[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
