'use client';

import { useCallback } from 'react';
import type {
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';

/**
 * Semantische datatabel-primitives voor MentaForce.
 *
 * Vervangt de div-grid "tabellen" die door de app verspreid staan
 * (declaraties, loonstroken, uren, verlof, bestanden, rooster) door een
 * echte <table> met thead/tbody/th/td zodat screenreaders rij/kolom-context
 * krijgen. Styling uitsluitend via design-tokens (geen hardcoded kleuren).
 *
 * Voorbeeld:
 *   <Table caption="Declaraties" stickyHeader>
 *     <THead>
 *       <Tr>
 *         <Th scope="col" sortable sortDirection="asc" onSort={() => ...}>Datum</Th>
 *         <Th scope="col" align="right">Bedrag</Th>
 *       </Tr>
 *     </THead>
 *     <TBody>
 *       <Tr><Td>01-06</Td><Td align="right">€ 12,50</Td></Tr>
 *     </TBody>
 *   </Table>
 */

type SortDirection = 'asc' | 'desc' | 'none';
type CellAlign = 'left' | 'center' | 'right';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** Toegankelijke titel van de tabel. Wordt een <caption> (sr-only tenzij showCaption). */
  caption?: ReactNode;
  /** Toon de caption visueel i.p.v. alleen voor screenreaders. */
  showCaption?: boolean;
  /** Plak de header vast bij verticaal scrollen. */
  stickyHeader?: boolean;
  children?: ReactNode;
}

/**
 * Tabel-wrapper: horizontaal scrollbaar op smalle viewports met nette
 * focus-ring op de scroll-container (toetsenbord-scrollbaar).
 */
export function Table({
  caption,
  showCaption = false,
  stickyHeader = false,
  children,
  style,
  ...rest
}: TableProps) {
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={typeof caption === 'string' ? caption : undefined}
      className="mf-table-scroll"
      style={{
        overflowX: 'auto',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--border)',
        maxHeight: stickyHeader ? '70vh' : undefined,
        overflowY: stickyHeader ? 'auto' : undefined,
      }}
    >
      <table
        data-sticky={stickyHeader ? '' : undefined}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          color: 'var(--text-2)',
          ...style,
        }}
        {...rest}
      >
        {caption ? (
          <caption
            style={
              showCaption
                ? {
                    textAlign: 'left',
                    padding: '14px 16px',
                    fontWeight: 600,
                    color: 'var(--text-1)',
                    captionSide: 'top',
                  }
                : srOnly
            }
          >
            {caption}
          </caption>
        ) : null}
        {children}
      </table>
      <style>{stickyStyle}</style>
    </div>
  );
}

export interface TableSectionProps extends HTMLAttributes<HTMLTableSectionElement> {
  children?: ReactNode;
}

export function THead({ children, style, ...rest }: TableSectionProps) {
  return (
    <thead
      style={{
        background: 'var(--bg-subtle)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </thead>
  );
}

export function TBody({ children, ...rest }: TableSectionProps) {
  return <tbody {...rest}>{children}</tbody>;
}

export interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  children?: ReactNode;
}

export function Tr({ children, style, ...rest }: TrProps) {
  return (
    <tr
      style={{
        borderBottom: '1px solid var(--border)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </tr>
  );
}

export interface ThProps extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'onClick'> {
  /** Verplicht voor toegankelijkheid: 'col' voor kolomkop, 'row' voor rijkop. */
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
  align?: CellAlign;
  /** Maak deze kolom sorteerbaar (toont knop + aria-sort + sorteericoon). */
  sortable?: boolean;
  /** Huidige sorteerrichting van deze kolom. */
  sortDirection?: SortDirection;
  /** Callback bij klik of Enter/Space op een sorteerbare kolom. */
  onSort?: () => void;
  children?: ReactNode;
}

const ariaSortMap: Record<SortDirection, 'ascending' | 'descending' | 'none'> = {
  asc: 'ascending',
  desc: 'descending',
  none: 'none',
};

export function Th({
  scope = 'col',
  align = 'left',
  sortable = false,
  sortDirection = 'none',
  onSort,
  children,
  style,
  ...rest
}: ThProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSort?.();
      }
    },
    [onSort],
  );

  const baseStyle = {
    padding: '12px 16px',
    textAlign: align,
    fontWeight: 600,
    fontSize: '12px',
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-3)',
    whiteSpace: 'nowrap' as const,
    ...style,
  };

  if (sortable && onSort) {
    return (
      <th
        scope={scope}
        aria-sort={ariaSortMap[sortDirection]}
        style={baseStyle}
        {...rest}
      >
        <button
          type="button"
          onClick={onSort}
          onKeyDown={handleKeyDown}
          className="mf-th-sort"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            font: 'inherit',
            color: sortDirection === 'none' ? 'var(--text-3)' : 'var(--mentaforce-primary)',
            letterSpacing: 'inherit',
            textTransform: 'inherit',
            cursor: 'pointer',
            flexDirection: align === 'right' ? 'row-reverse' : 'row',
          }}
        >
          {children}
          <SortIcon direction={sortDirection} />
        </button>
      </th>
    );
  }

  return (
    <th scope={scope} style={baseStyle} {...rest}>
      {children}
    </th>
  );
}

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc') return <ArrowUp size={14} aria-hidden="true" />;
  if (direction === 'desc') return <ArrowDown size={14} aria-hidden="true" />;
  return <ChevronsUpDown size={14} aria-hidden="true" style={{ opacity: 0.5 }} />;
}

export interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: CellAlign;
  children?: ReactNode;
}

export function Td({ align = 'left', children, style, ...rest }: TdProps) {
  return (
    <td
      style={{
        padding: '12px 16px',
        textAlign: align,
        color: 'var(--text-2)',
        verticalAlign: 'middle',
        ...style,
      }}
      {...rest}
    >
      {children}
    </td>
  );
}

const srOnly: Record<string, string> = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: '0',
};

const stickyStyle = `
.mf-table-scroll:focus-visible {
  outline: 2px solid var(--mentaforce-primary);
  outline-offset: 2px;
}
table[data-sticky] thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--bg-subtle);
}
.mf-th-sort:focus-visible {
  outline: 2px solid var(--mentaforce-primary);
  outline-offset: 2px;
  border-radius: var(--radius-xs);
}
`;
