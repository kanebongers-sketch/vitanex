'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

/**
 * Dialog — toegankelijke modal op basis van @radix-ui/react-dialog.
 * Focus-trap, Escape-to-close en aria-modal komen gratis via Radix.
 * Stijl uitsluitend via bestaande CSS-var-tokens (geen hardcoded kleuren).
 */

export const DialogRoot = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogPortal = RadixDialog.Portal;
export const DialogClose = RadixDialog.Close;

type OverlayProps = ComponentPropsWithoutRef<typeof RadixDialog.Overlay>;

const DialogStyles = (
  <style>{`
    @keyframes mf-dialog-overlay-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes mf-dialog-overlay-out { from { opacity: 1; } to { opacity: 0; } }
    @keyframes mf-dialog-content-in {
      from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    @keyframes mf-dialog-content-out {
      from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      to { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
    }
    .mf-dialog-overlay[data-state='open'] { animation: mf-dialog-overlay-in 0.2s var(--ease); }
    .mf-dialog-overlay[data-state='closed'] { animation: mf-dialog-overlay-out 0.15s var(--ease); }
    .mf-dialog-content[data-state='open'] { animation: mf-dialog-content-in 0.25s var(--ease); }
    .mf-dialog-content[data-state='closed'] { animation: mf-dialog-content-out 0.15s var(--ease); }
    @media (prefers-reduced-motion: reduce) {
      .mf-dialog-overlay, .mf-dialog-content { animation: none !important; }
    }
  `}</style>
);

export const DialogOverlay = forwardRef<ElementRef<typeof RadixDialog.Overlay>, OverlayProps>(
  function DialogOverlay({ style, className, ...rest }, ref) {
    return (
      <RadixDialog.Overlay
        ref={ref}
        className={`mf-dialog-overlay${className ? ` ${className}` : ''}`}
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

export interface DialogContentProps extends ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  /** Toon de standaard sluitknop rechtsboven (default true). */
  showClose?: boolean;
  /** Toegankelijk label voor de sluitknop. */
  closeLabel?: string;
  children?: ReactNode;
}

export const DialogContent = forwardRef<ElementRef<typeof RadixDialog.Content>, DialogContentProps>(
  function DialogContent({ children, style, className, showClose = true, closeLabel = 'Sluiten', ...rest }, ref) {
    return (
      <DialogPortal>
        <DialogOverlay />
        <RadixDialog.Content
          ref={ref}
          className={`mf-dialog-content${className ? ` ${className}` : ''}`}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(92vw, 480px)',
            maxHeight: '85vh',
            overflowY: 'auto',
            background: 'var(--bg-card)',
            color: 'var(--text-1)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-lg)',
            padding: '24px',
            zIndex: 101,
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
          {DialogStyles}
        </RadixDialog.Content>
      </DialogPortal>
    );
  },
);

type TitleProps = ComponentPropsWithoutRef<typeof RadixDialog.Title>;

export const DialogTitle = forwardRef<ElementRef<typeof RadixDialog.Title>, TitleProps>(
  function DialogTitle({ style, ...rest }, ref) {
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

export const DialogDescription = forwardRef<ElementRef<typeof RadixDialog.Description>, DescriptionProps>(
  function DialogDescription({ style, ...rest }, ref) {
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
