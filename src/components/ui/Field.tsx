import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from 'react';

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}

interface ControlAriaProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

/**
 * Field koppelt een <label> aan zijn control en verbindt hint/error via
 * aria-describedby. Zet aria-invalid wanneer er een fout is. Lost het
 * systemische "inputs zonder label"-probleem op.
 */
export function Field({ label, hint, error, required = false, htmlFor, children }: FieldProps) {
  const generatedId = useId();
  const controlId = htmlFor ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  const onlyChild = Children.only(children);
  const control = isValidElement(onlyChild)
    ? cloneElement(onlyChild as ReactElement<ControlAriaProps>, {
        id: controlId,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })
    : onlyChild;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={controlId}
        style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--mf-red)', marginLeft: '3px' }} aria-hidden>
            *
          </span>
        )}
      </label>
      {control}
      {hint && !error && (
        <p id={hintId} style={{ fontSize: '12px', color: 'var(--text-4)', margin: 0 }}>
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          style={{ fontSize: '12px', color: 'var(--mf-red)', margin: 0 }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
