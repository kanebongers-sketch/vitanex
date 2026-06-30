'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, style, className, ...rest },
  ref,
) {
  const hasError = invalid ?? rest['aria-invalid'] === true;
  return (
    <>
    <input
      ref={ref}
      className={`mf-ui-control${className ? ` ${className}` : ''}`}
      style={{
        width: '100%',
        padding: '10px 14px',
        fontSize: '16px',
        lineHeight: 1.4,
        color: 'var(--text-1)',
        background: 'var(--bg-subtle)',
        border: `1px solid ${hasError ? 'var(--mf-red)' : 'var(--border-strong)'}`,
        borderRadius: 'var(--radius-md)',
        outline: 'none',
        transition: 'border-color 0.15s var(--ease), box-shadow 0.15s var(--ease)',
        ...style,
      }}
      {...rest}
    />
    <style>{`
      .mf-ui-control:focus-visible {
        border-color: var(--mentaforce-primary);
        box-shadow: 0 0 0 3px var(--mentaforce-primary-light);
        outline: none;
      }
    `}</style>
    </>
  );
});
