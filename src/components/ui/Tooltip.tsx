'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

/**
 * Tooltip — op basis van @radix-ui/react-tooltip. Wikkel je app (of een
 * subtree) in <TooltipProvider> en gebruik daarbinnen Root/Trigger/Content.
 * ARIA en toetsenbord-/hover-timing komen gratis via Radix. Stijl via tokens.
 */

export const TooltipProvider = RadixTooltip.Provider;
export const TooltipRoot = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;
export const TooltipPortal = RadixTooltip.Portal;

const TooltipStyles = (
  <style>{`
    @keyframes mf-tooltip-in { from { opacity: 0; transform: translateY(2px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .mf-tooltip-content[data-state='delayed-open'] { animation: mf-tooltip-in 0.16s var(--ease); }
    .mf-tooltip-content[data-state='instant-open'] { animation: mf-tooltip-in 0.16s var(--ease); }
    @media (prefers-reduced-motion: reduce) { .mf-tooltip-content { animation: none !important; } }
  `}</style>
);

export interface TooltipContentProps extends ComponentPropsWithoutRef<typeof RadixTooltip.Content> {
  /** Toon het wijzer-pijltje (default true). */
  showArrow?: boolean;
}

export const TooltipContent = forwardRef<ElementRef<typeof RadixTooltip.Content>, TooltipContentProps>(
  function TooltipContent({ children, style, className, sideOffset = 6, showArrow = true, ...rest }, ref) {
    return (
      <TooltipPortal>
        <RadixTooltip.Content
          ref={ref}
          sideOffset={sideOffset}
          className={`mf-tooltip-content${className ? ` ${className}` : ''}`}
          style={{
            maxWidth: '260px',
            padding: '7px 11px',
            fontSize: '13px',
            lineHeight: 1.45,
            fontWeight: 500,
            color: 'var(--text-1)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 110,
            ...style,
          }}
          {...rest}
        >
          {children}
          {showArrow && (
            <RadixTooltip.Arrow
              width={11}
              height={6}
              style={{ fill: 'var(--bg-card)' }}
            />
          )}
          {TooltipStyles}
        </RadixTooltip.Content>
      </TooltipPortal>
    );
  },
);
