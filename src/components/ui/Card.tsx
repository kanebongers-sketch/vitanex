import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children?: ReactNode;
}

export function Card({ interactive = false, children, style, className, ...rest }: CardProps) {
  const interactiveProps = interactive ? { tabIndex: 0 } : {};
  return (
    <div
      className={`${interactive ? 'mf-lift ' : ''}${className ?? ''}`.trim() || undefined}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        cursor: interactive ? 'pointer' : undefined,
        ...style,
      }}
      {...interactiveProps}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function CardHeader({ children, style, ...rest }: CardSectionProps) {
  return (
    <div
      style={{
        padding: '18px 20px 12px',
        borderBottom: '1px solid var(--border)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, style, ...rest }: CardSectionProps) {
  return (
    <div style={{ padding: '20px', ...style }} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, style, ...rest }: CardSectionProps) {
  return (
    <div
      style={{
        padding: '12px 20px 18px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
