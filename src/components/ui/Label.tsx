'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as RadixLabel from '@radix-ui/react-label';

/**
 * Label — op basis van @radix-ui/react-label. Koppelt correct aan een
 * form-control (htmlFor) en voorkomt tekstselectie bij dubbelklik.
 * Stijl uitsluitend via CSS-var-tokens.
 */

type LabelProps = ComponentPropsWithoutRef<typeof RadixLabel.Root>;

export const Label = forwardRef<ElementRef<typeof RadixLabel.Root>, LabelProps>(
  function Label({ style, ...rest }, ref) {
    return (
      <RadixLabel.Root
        ref={ref}
        style={{
          display: 'inline-block',
          fontSize: '13px',
          fontWeight: 600,
          lineHeight: 1.3,
          color: 'var(--text-2)',
          userSelect: 'none',
          ...style,
        }}
        {...rest}
      />
    );
  },
);
