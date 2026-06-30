'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

/**
 * Toast — op basis van @radix-ui/react-toast. Biedt een ToastProvider die
 * een imperatief API levert via useToast(): toast({ title, description, variant }).
 * Vervangt alert(). Live-region announce komt gratis via Radix (role=status).
 * Stijl uitsluitend via CSS-var-tokens.
 */

export type ToastVariant = 'default' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Levensduur in ms (default 5000). */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * useToast — geeft toegang tot het imperatieve toast-API.
 * Moet binnen <ToastProvider> gebruikt worden.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast moet binnen <ToastProvider> gebruikt worden.');
  }
  return ctx;
}

const VARIANT_ACCENT: Record<ToastVariant, string> = {
  default: 'var(--mentaforce-primary)',
  success: 'var(--mf-green)',
  warning: 'var(--mf-amber)',
  error: 'var(--mf-red)',
};

const VARIANT_ICON: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertTriangle,
};

const ToastStyles = (
  <style>{`
    @keyframes mf-toast-in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes mf-toast-out { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(12px); } }
    @keyframes mf-toast-swipe-out { from { transform: translateX(var(--radix-toast-swipe-end-x)); } to { transform: translateX(110%); } }
    .mf-toast[data-state='open'] { animation: mf-toast-in 0.22s var(--ease); }
    .mf-toast[data-state='closed'] { animation: mf-toast-out 0.16s var(--ease); }
    .mf-toast[data-swipe='move'] { transform: translateX(var(--radix-toast-swipe-move-x)); }
    .mf-toast[data-swipe='cancel'] { transform: translateX(0); transition: transform 0.18s var(--ease); }
    .mf-toast[data-swipe='end'] { animation: mf-toast-swipe-out 0.16s var(--ease); }
    @media (prefers-reduced-motion: reduce) { .mf-toast { animation: none !important; } }
  `}</style>
);

interface ToastCardProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastCard({ item, onDismiss }: ToastCardProps) {
  const variant = item.variant ?? 'default';
  const accent = VARIANT_ACCENT[variant];
  const Icon = VARIANT_ICON[variant];

  return (
    <RadixToast.Root
      className="mf-toast"
      duration={item.duration ?? 5000}
      onOpenChange={(open) => {
        if (!open) onDismiss(item.id);
      }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'start',
        columnGap: '11px',
        width: 'min(92vw, 360px)',
        padding: '13px 14px',
        background: 'var(--bg-card)',
        color: 'var(--text-1)',
        border: '1px solid var(--border-strong)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <Icon size={18} aria-hidden style={{ color: accent, marginTop: '1px' }} />
      <div style={{ minWidth: 0 }}>
        <RadixToast.Title style={{ margin: 0, fontSize: '14px', fontWeight: 600, lineHeight: 1.35 }}>
          {item.title}
        </RadixToast.Title>
        {item.description && (
          <RadixToast.Description
            style={{ margin: '3px 0 0', fontSize: '13px', lineHeight: 1.5, color: 'var(--text-3)' }}
          >
            {item.description}
          </RadixToast.Description>
        )}
      </div>
      <RadixToast.Close
        aria-label="Melding sluiten"
        className="mf-pressable"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '26px',
          height: '26px',
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          color: 'var(--text-3)',
          border: '1px solid transparent',
          cursor: 'pointer',
          transition: 'color 0.15s var(--ease)',
        }}
      >
        <X size={15} aria-hidden />
      </RadixToast.Close>
    </RadixToast.Root>
  );
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Standaard levensduur in ms voor toasts zonder eigen duration. */
  duration?: number;
  /** Pixels swipe voordat een toast sluit (default 50). */
  swipeThreshold?: number;
}

export function ToastProvider({ children, duration = 5000, swipeThreshold = 50 }: ToastProviderProps) {
  const [items, setItems] = useState<readonly ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions): string => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setItems((prev) => [...prev, { ...options, id }]);
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider duration={duration} swipeDirection="right" swipeThreshold={swipeThreshold}>
        {children}
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
        <ToastViewport />
        {ToastStyles}
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function ToastViewport() {
  return (
    <RadixToast.Viewport
      style={{
        position: 'fixed',
        bottom: 'calc(16px + var(--safe-bottom, 0px))',
        right: 'calc(16px + var(--safe-right, 0px))',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: 'min(92vw, 360px)',
        maxWidth: '100vw',
        margin: 0,
        padding: 0,
        listStyle: 'none',
        outline: 'none',
        zIndex: 120,
      }}
    />
  );
}
