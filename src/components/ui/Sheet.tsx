'use client';

import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties, type ElementRef, type ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

/**
 * Sheet — slide-over / drawer op basis van @radix-ui/react-dialog.
 * Vervangt ad-hoc drawers (bv. MetricDetailSheet). Focus-trap, Escape en
 * aria-modal komen gratis via Radix. Stijl via CSS-var-tokens.
 */

export const SheetRoot = RadixDialog.Root;
export const SheetTrigger = RadixDialog.Trigger;
export const SheetPortal = RadixDialog.Portal;
export const SheetClose = RadixDialog.Close;

export type SheetSide = 'right' | 'left' | 'bottom';

const SheetStyles = (
  <style>{`
    @keyframes mf-sheet-overlay-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes mf-sheet-overlay-out { from { opacity: 1; } to { opacity: 0; } }
    @keyframes mf-sheet-right-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes mf-sheet-right-out { from { transform: translateX(0); } to { transform: translateX(100%); } }
    @keyframes mf-sheet-left-in { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes mf-sheet-left-out { from { transform: translateX(0); } to { transform: translateX(-100%); } }
    @keyframes mf-sheet-bottom-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes mf-sheet-bottom-out { from { transform: translateY(0); } to { transform: translateY(100%); } }
    .mf-sheet-overlay[data-state='open'] { animation: mf-sheet-overlay-in 0.2s var(--ease); }
    .mf-sheet-overlay[data-state='closed'] { animation: mf-sheet-overlay-out 0.18s var(--ease); }
    .mf-sheet-content[data-side='right'][data-state='open'] { animation: mf-sheet-right-in 0.3s var(--ease); }
    .mf-sheet-content[data-side='right'][data-state='closed'] { animation: mf-sheet-right-out 0.22s var(--ease); }
    .mf-sheet-content[data-side='left'][data-state='open'] { animation: mf-sheet-left-in 0.3s var(--ease); }
    .mf-sheet-content[data-side='left'][data-state='closed'] { animation: mf-sheet-left-out 0.22s var(--ease); }
    .mf-sheet-content[data-side='bottom'][data-state='open'] { animation: mf-sheet-bottom-in 0.3s var(--ease); }
    .mf-sheet-content[data-side='bottom'][data-state='closed'] { animation: mf-sheet-bottom-out 0.22s var(--ease); }
    @media (prefers-reduced-motion: reduce) {
      .mf-sheet-overlay, .mf-sheet-content { animation: none !important; }
    }
  `}</style>
);

type OverlayProps = ComponentPropsWithoutRef<typeof RadixDialog.Overlay>;

export const SheetOverlay = forwardRef<ElementRef<typeof RadixDialog.Overlay>, OverlayProps>(
  function SheetOverlay({ style, className, ...rest }, ref) {
    return (
      <RadixDialog.Overlay
        ref={ref}
        className={`mf-sheet-overlay${className ? ` ${className}` : ''}`}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'color-mix(in srgb, var(--bg-app) 70%, transparent)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 100,
          ...style,
        }}
        {...rest}
      />
    );
  },
);

const SIDE_POSITION: Record<SheetSide, CSSProperties> = {
  right: {
    top: 0,
    right: 0,
    bottom: 0,
    width: 'min(92vw, 420px)',
    borderLeft: '1px solid var(--border-strong)',
    borderTopLeftRadius: 'var(--radius-lg)',
    borderBottomLeftRadius: 'var(--radius-lg)',
  },
  left: {
    top: 0,
    left: 0,
    bottom: 0,
    width: 'min(92vw, 420px)',
    borderRight: '1px solid var(--border-strong)',
    borderTopRightRadius: 'var(--radius-lg)',
    borderBottomRightRadius: 'var(--radius-lg)',
  },
  bottom: {
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '88vh',
    borderTop: '1px solid var(--border-strong)',
    borderTopLeftRadius: 'var(--radius-lg)',
    borderTopRightRadius: 'var(--radius-lg)',
  },
};

export interface SheetContentProps extends ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  side?: SheetSide;
  showClose?: boolean;
  closeLabel?: string;
  children?: ReactNode;
}

export const SheetContent = forwardRef<ElementRef<typeof RadixDialog.Content>, SheetContentProps>(
  function SheetContent(
    { children, side = 'right', style, className, showClose = true, closeLabel = 'Sluiten', ...rest },
    ref,
  ) {
    return (
      <SheetPortal>
        <SheetOverlay />
        <RadixDialog.Content
          ref={ref}
          data-side={side}
          className={`mf-sheet-content${className ? ` ${className}` : ''}`}
          style={{
            position: 'fixed',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            background: 'var(--bg-card)',
            color: 'var(--text-1)',
            boxShadow: 'var(--shadow-lg)',
            padding: '24px',
            zIndex: 101,
            ...SIDE_POSITION[side],
            ...style,
          }}
          {...rest}
        >
          {children}
          {showClose && (
            <RadixDialog.Close
              aria-label={closeLabel}
              className="mf-pressable"
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: 'var(--text-3)',
                border: '1px solid transparent',
                cursor: 'pointer',
                transition: 'color 0.15s var(--ease), background 0.15s var(--ease)',
              }}
            >
              <X size={18} aria-hidden />
            </RadixDialog.Close>
          )}
          {SheetStyles}
        </RadixDialog.Content>
      </SheetPortal>
    );
  },
);

type TitleProps = ComponentPropsWithoutRef<typeof RadixDialog.Title>;

export const SheetTitle = forwardRef<ElementRef<typeof RadixDialog.Title>, TitleProps>(
  function SheetTitle({ style, ...rest }, ref) {
    return (
      <RadixDialog.Title
        ref={ref}
        style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 600,
          lineHeight: 1.3,
          color: 'var(--text-1)',
          paddingRight: '40px',
          ...style,
        }}
        {...rest}
      />
    );
  },
);

type DescriptionProps = ComponentPropsWithoutRef<typeof RadixDialog.Description>;

export const SheetDescription = forwardRef<ElementRef<typeof RadixDialog.Description>, DescriptionProps>(
  function SheetDescription({ style, ...rest }, ref) {
    return (
      <RadixDialog.Description
        ref={ref}
        style={{
          margin: '8px 0 0',
          fontSize: '14px',
          lineHeight: 1.55,
          color: 'var(--text-3)',
          ...style,
        }}
        {...rest}
      />
    );
  },
);
