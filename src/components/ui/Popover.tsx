'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';

/**
 * Popover — op basis van @radix-ui/react-popover (o.a. voor de VITA-companion).
 * Focus-management, Escape en outside-click komen gratis via Radix.
 * Stijl uitsluitend via CSS-var-tokens.
 */

export const PopoverRoot = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverPortal = RadixPopover.Portal;
export const PopoverAnchor = RadixPopover.Anchor;
export const PopoverClose = RadixPopover.Close;

const PopoverStyles = (
  <style>{`
    @keyframes mf-popover-in { from { opacity: 0; transform: translateY(4px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes mf-popover-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(4px) scale(0.98); } }
    .mf-popover-content[data-state='open'] { animation: mf-popover-in 0.18s var(--ease); }
    .mf-popover-content[data-state='closed'] { animation: mf-popover-out 0.14s var(--ease); }
    @media (prefers-reduced-motion: reduce) { .mf-popover-content { animation: none !important; } }
  `}</style>
);

export interface PopoverContentProps extends ComponentPropsWithoutRef<typeof RadixPopover.Content> {
  showArrow?: boolean;
  children?: ReactNode;
}

export const PopoverContent = forwardRef<ElementRef<typeof RadixPopover.Content>, PopoverContentProps>(
  function PopoverContent({ children, style, className, sideOffset = 8, showArrow = false, ...rest }, ref) {
    return (
      <PopoverPortal>
        <RadixPopover.Content
          ref={ref}
          sideOffset={sideOffset}
          className={`mf-popover-content${className ? ` ${className}` : ''}`}
          style={{
            width: 'min(92vw, 320px)',
            padding: '16px',
            background: 'var(--bg-card)',
            color: 'var(--text-1)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 110,
            ...style,
          }}
          {...rest}
        >
          {children}
          {showArrow && (
            <RadixPopover.Arrow width={12} height={6} style={{ fill: 'var(--bg-card)' }} />
          )}
          {PopoverStyles}
        </RadixPopover.Content>
      </PopoverPortal>
    );
  },
);
