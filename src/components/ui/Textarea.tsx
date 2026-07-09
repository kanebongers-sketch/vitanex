'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type RefObject,
  type TextareaHTMLAttributes,
} from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  /**
   * Laat het veld automatisch meegroeien met de inhoud (tot ~40% van de
   * viewport, daarna scrollt het veld gewoon). `rows` blijft de minimumhoogte.
   * Zet op `false` voor een vaste hoogte met handmatige resize-handle.
   */
  autoGrow?: boolean;
}

/** Verticale padding (10 + 10) + border (1 + 1) van het veld, in px. */
const FRAME_Y_PX = 22;
/** Maximale groeihoogte als fractie van de viewport; daarna scrollt het veld. */
const MAX_GROW_VIEWPORT_FRACTION = 0.4;

let fieldSizingSupported: boolean | null = null;

/** Detecteert eenmalig CSS `field-sizing: content` (alleen client-side aanroepen). */
function supportsFieldSizing(): boolean {
  if (fieldSizingSupported === null) {
    fieldSizingSupported =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('field-sizing', 'content');
  }
  return fieldSizingSupported;
}

/**
 * JS-fallback voor browsers zonder `field-sizing: content`: meet de inhoud en
 * zet de hoogte instant. Bewust zonder transitie — hoogte animeren triggert
 * layout-jank en is tegen de animatieregels; instant is hier juist rustig.
 */
function resizeToContent(el: HTMLTextAreaElement): void {
  if (el.offsetHeight === 0) return; // verborgen (dialog/tab dicht): niets te meten
  el.style.height = 'auto';
  const borderY = el.offsetHeight - el.clientHeight;
  const minInner = el.clientHeight; // hoogte volgens `rows` — blijft het minimum
  const capInner = Math.max(
    window.innerHeight * MAX_GROW_VIEWPORT_FRACTION - borderY,
    minInner,
  );
  el.style.height = `${Math.min(el.scrollHeight, capInner) + borderY}px`;
}

/**
 * Draait de JS-fallback bij (programmatische) value-wijzigingen en bij
 * viewport-resize (rAF-gebundeld). No-op zodra CSS `field-sizing` het werk doet.
 */
function useAutoGrowFallback(
  ref: RefObject<HTMLTextAreaElement | null>,
  enabled: boolean,
  value: TextareaProps['value'],
): void {
  useLayoutEffect(() => {
    if (!enabled || supportsFieldSizing() || !ref.current) return;
    resizeToContent(ref.current);
  }, [ref, enabled, value]);

  useEffect(() => {
    if (!enabled || supportsFieldSizing()) return;
    let frame = 0;
    const onWindowResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (ref.current) resizeToContent(ref.current);
      });
    };
    window.addEventListener('resize', onWindowResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onWindowResize);
    };
  }, [ref, enabled]);
}

function frameStyle(hasError: boolean, autoGrow: boolean, rows: number): CSSProperties {
  const rowsMinHeight = `calc(${rows} * 1lh + ${FRAME_Y_PX}px)`;
  return {
    width: '100%',
    padding: '10px 14px',
    fontSize: '16px',
    lineHeight: 1.5,
    color: 'var(--text-1)',
    background: 'var(--bg-subtle)',
    border: `1px solid ${hasError ? 'var(--mf-red)' : 'var(--border-strong)'}`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    resize: autoGrow ? 'none' : 'vertical',
    // Bij auto-grow: `rows` blijft expliciet de ondergrens, de cap zakt er
    // nooit onder (grote editors zoals rows={16} krimpen dus niet).
    minHeight: autoGrow ? `max(88px, ${rowsMinHeight})` : '88px',
    maxHeight: autoGrow
      ? `max(${MAX_GROW_VIEWPORT_FRACTION * 100}vh, ${rowsMinHeight})`
      : undefined,
    fontFamily: 'inherit',
    transition: 'border-color 0.15s var(--ease), box-shadow 0.15s var(--ease)',
  };
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, style, className, rows = 4, autoGrow = true, onInput, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const isControlled = rest.value !== undefined;
  useAutoGrowFallback(innerRef, autoGrow, rest.value);

  // Type de handler af van de prop zelf: in deze Next-typing verwacht
  // `onInput` een InputEvent<HTMLTextAreaElement>, niet een FormEvent.
  const handleInput: NonNullable<TextareaProps['onInput']> = (event) => {
    // Ongecontroleerd gebruik heeft geen value-prop; meet dan op input-events.
    if (autoGrow && !isControlled && !supportsFieldSizing()) {
      resizeToContent(event.currentTarget);
    }
    onInput?.(event);
  };

  const hasError = invalid ?? rest['aria-invalid'] === true;
  return (
    <>
      <textarea
        ref={setRefs}
        rows={rows}
        data-autogrow={autoGrow ? '' : undefined}
        className={`mf-ui-textarea${className ? ` ${className}` : ''}`}
        onInput={handleInput}
        style={{ ...frameStyle(hasError, autoGrow, rows), ...style }}
        {...rest}
      />
      <style>{`
        .mf-ui-textarea:focus-visible {
          border-color: var(--mentaforce-primary);
          box-shadow: 0 0 0 3px var(--mentaforce-primary-light);
          outline: none;
        }
        @supports (field-sizing: content) {
          .mf-ui-textarea[data-autogrow] {
            field-sizing: content;
          }
        }
      `}</style>
    </>
  );
});
