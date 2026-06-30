'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const SIZE_STYLE: Record<ButtonSize, { padding: string; fontSize: string; gap: string }> = {
  sm: { padding: '7px 14px', fontSize: '13px', gap: '6px' },
  md: { padding: '10px 20px', fontSize: '14px', gap: '8px' },
  lg: { padding: '13px 26px', fontSize: '15px', gap: '10px' },
};

const VARIANT_STYLE: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--mentaforce-primary)',
    color: 'var(--bg-app)',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'var(--bg-subtle)',
    color: 'var(--text-1)',
    border: '1px solid var(--border-strong)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-2)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'transparent',
    color: 'var(--mf-red)',
    border: '1px solid var(--mf-red)',
  },
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 15, md: 16, lg: 18 };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, disabled, children, style, className, ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  const sz = SIZE_STYLE[size];

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`mf-pressable mf-ui-btn${className ? ` ${className}` : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: sz.gap,
        padding: sz.padding,
        fontSize: sz.fontSize,
        fontWeight: 600,
        lineHeight: 1.2,
        borderRadius: 'var(--radius-btn)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.55 : 1,
        whiteSpace: 'nowrap',
        transition: 'opacity 0.15s var(--ease), transform 0.1s var(--ease)',
        ...VARIANT_STYLE[variant],
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <Loader2 size={ICON_SIZE[size]} className="mf-btn-spin" aria-hidden />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
      <style>{`
        .mf-btn-spin { animation: mf-spin 0.7s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .mf-btn-spin { animation: none; } }
        .mf-ui-btn:hover:not(:disabled) { opacity: 0.88; }
        .mf-ui-btn:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
          box-shadow: 0 0 0 4px var(--mentaforce-primary-light);
        }
      `}</style>
    </button>
  );
});
