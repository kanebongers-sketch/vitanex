'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, style, className, rows = 4, ...rest },
  ref,
) {
  const hasError = invalid ?? rest['aria-invalid'] === true;
  return (
    <>
      <textarea
        ref={ref}
        rows={rows}
        className={`mf-ui-textarea${className ? ` ${className}` : ''}`}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: '16px',
          lineHeight: 1.5,
          color: 'var(--text-1)',
          background: 'var(--bg-subtle)',
          border: `1px solid ${hasError ? 'var(--mf-red)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          resize: 'vertical',
          minHeight: '88px',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s var(--ease), box-shadow 0.15s var(--ease)',
          ...style,
        }}
        {...rest}
      />
      <style>{`
        .mf-ui-textarea:focus-visible {
          border-color: var(--mentaforce-primary);
          box-shadow: 0 0 0 3px var(--mentaforce-primary-light);
          outline: none;
        }
      `}</style>
    </>
  );
});
