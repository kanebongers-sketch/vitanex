'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';

/**
 * Tabs — op basis van @radix-ui/react-tabs. Roving tabindex en ARIA
 * (tablist/tab/tabpanel) komen gratis via Radix. De actieve tab krijgt
 * een onderstreping in de accentkleur; stijl uitsluitend via CSS-var-tokens.
 */

export const TabsRoot = RadixTabs.Root;

type ListProps = ComponentPropsWithoutRef<typeof RadixTabs.List>;

export const TabsList = forwardRef<ElementRef<typeof RadixTabs.List>, ListProps>(
  function TabsList({ style, ...rest }, ref) {
    return (
      <RadixTabs.List
        ref={ref}
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--border)',
          ...style,
        }}
        {...rest}
      />
    );
  },
);

type TriggerProps = ComponentPropsWithoutRef<typeof RadixTabs.Trigger>;

export const TabsTrigger = forwardRef<ElementRef<typeof RadixTabs.Trigger>, TriggerProps>(
  function TabsTrigger({ style, className, ...rest }, ref) {
    return (
      <RadixTabs.Trigger
        ref={ref}
        className={`mf-tabs-trigger mf-pressable${className ? ` ${className}` : ''}`}
        style={{
          position: 'relative',
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          padding: '10px 14px',
          fontSize: '14px',
          fontWeight: 600,
          lineHeight: 1.2,
          color: 'var(--text-3)',
          cursor: 'pointer',
          transition: 'color 0.18s var(--ease)',
          ...style,
        }}
        {...rest}
      >
        {rest.children}
        <span aria-hidden className="mf-tabs-indicator" />
        <style>{`
          .mf-tabs-trigger[data-state='active'] { color: var(--text-1); }
          .mf-tabs-trigger:hover { color: var(--text-2); }
          .mf-tabs-trigger:focus-visible {
            outline: 2px solid var(--mentaforce-primary);
            outline-offset: -2px;
            border-radius: var(--radius-xs);
          }
          .mf-tabs-trigger .mf-tabs-indicator {
            position: absolute;
            left: 14px;
            right: 14px;
            bottom: -1px;
            height: 2px;
            border-radius: 2px;
            background: var(--mentaforce-primary);
            transform: scaleX(0);
            transform-origin: center;
            transition: transform 0.22s var(--ease);
          }
          .mf-tabs-trigger[data-state='active'] .mf-tabs-indicator { transform: scaleX(1); }
          @media (prefers-reduced-motion: reduce) {
            .mf-tabs-trigger, .mf-tabs-trigger .mf-tabs-indicator { transition: none; }
          }
        `}</style>
      </RadixTabs.Trigger>
    );
  },
);

type ContentProps = ComponentPropsWithoutRef<typeof RadixTabs.Content>;

export const TabsContent = forwardRef<ElementRef<typeof RadixTabs.Content>, ContentProps>(
  function TabsContent({ style, ...rest }, ref) {
    return (
      <RadixTabs.Content
        ref={ref}
        style={{
          paddingTop: '16px',
          outline: 'none',
          color: 'var(--text-2)',
          ...style,
        }}
        {...rest}
      />
    );
  },
);
