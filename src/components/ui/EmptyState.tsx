import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '12px',
        padding: '40px 24px',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          color: 'var(--text-3)',
        }}
      >
        <Icon size={24} aria-hidden />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '38ch' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: '14px', color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>
      {action && <div style={{ marginTop: '4px' }}>{action}</div>}
    </div>
  );
}
