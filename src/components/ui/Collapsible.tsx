'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as RadixCollapsible from '@radix-ui/react-collapsible';

/**
 * Collapsible — op basis van @radix-ui/react-collapsible. Voor expand/collapse-rijen
 * (bv. check-in-geschiedenis). aria-expanded en aria-controls komen gratis via Radix.
 * De content animeert op de Radix CSS-var --radix-collapsible-content-height,
 * die layout-vriendelijk is en netjes uitvalt bij prefers-reduced-motion.
 */

export const CollapsibleRoot = RadixCollapsible.Root;
export const CollapsibleTrigger = RadixCollapsible.Trigger;

type ContentProps = ComponentPropsWithoutRef<typeof RadixCollapsible.Content>;

export const CollapsibleContent = forwardRef<ElementRef<typeof RadixCollapsible.Content>, ContentProps>(
  function CollapsibleContent({ children, style, className, ...rest }, ref) {
    return (
      <RadixCollapsible.Content
        ref={ref}
        className={`mf-collapsible-content${className ? ` ${className}` : ''}`}
        style={{ overflow: 'hidden', ...style }}
        {...rest}
      >
        {children}
        <style>{`
          @keyframes mf-collapsible-down {
            from { height: 0; opacity: 0; }
            to { height: var(--radix-collapsible-content-height); opacity: 1; }
          }
          @keyframes mf-collapsible-up {
            from { height: var(--radix-collapsible-content-height); opacity: 1; }
            to { height: 0; opacity: 0; }
          }
          .mf-collapsible-content[data-state='open'] { animation: mf-collapsible-down 0.24s var(--ease); }
          .mf-collapsible-content[data-state='closed'] { animation: mf-collapsible-up 0.2s var(--ease); }
          @media (prefers-reduced-motion: reduce) { .mf-collapsible-content { animation: none !important; } }
        `}</style>
      </RadixCollapsible.Content>
    );
  },
);
