'use client';

import { useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import dynamic from 'next/dynamic';

/**
 * Toegankelijke, lazy-geladen recharts-wrapper voor MentaForce.
 *
 * Lost twee systemische problemen op:
 *  1. recharts (zwaar, honderden KB) wordt nu altijd via next/dynamic met
 *     ssr:false geladen i.p.v. statisch in elke pagina-bundle.
 *  2. De grafiek krijgt een tekstalternatief: de container is role="img" met
 *     een verplichte aria-label/summary, en er staat een sr-only <table> met
 *     dezelfde data zodat screenreader-gebruikers de cijfers kunnen lezen.
 *
 * Generiek genoeg voor de bestaande week-trend usecases (line/area/bar).
 *
 * Voorbeeld:
 *   <Chart
 *     type="line"
 *     data={data}
 *     xKey="datum"
 *     series={[
 *       { key: 'Fysiek', label: 'Fysiek' },
 *       { key: 'Mentaal', label: 'Mentaal', color: 'var(--mf-blue-mid)' },
 *     ]}
 *     summary="Weektrend van fysiek en mentaal welzijn, schaal 1 tot 5."
 *     yDomain={[1, 5]}
 *   />
 */

export type ChartType = 'line' | 'area' | 'bar';

export type ChartDatum = Record<string, string | number | null | undefined>;

export interface ChartSeries {
  /** Sleutel in elk data-object (bv. 'Fysiek'). */
  key: string;
  /** Zichtbaar/leesbaar label. Valt terug op key. */
  label?: string;
  /** Token-kleur. Default: cyaan accent. Gebruik tokens, geen hex. */
  color?: string;
}

export interface ChartProps {
  type: ChartType;
  data: ChartDatum[];
  /** Sleutel voor de x-as (categorie/datum). */
  xKey: string;
  series: ChartSeries[];
  /**
   * Verplicht tekstalternatief: beschrijft wat de grafiek toont.
   * Wordt de aria-label van de role="img" container.
   */
  summary: string;
  height?: number;
  /** Domein voor de y-as, bv. [1, 5] voor welzijnsscores. */
  yDomain?: [number, number];
  /** Toon een zichtbare legenda. */
  showLegend?: boolean;
  style?: CSSProperties;
}

// Token-kleuren: cyaan accent eerst, daarna ondersteunende merk-tokens.
// Geen hardcoded hex — alles verwijst naar globals.css custom properties.
const DEFAULT_COLORS = [
  'var(--mentaforce-primary)',
  'var(--mf-blue-mid)',
  'var(--mf-purple)',
  'var(--mf-amber)',
] as const;

/**
 * Lazy-geladen recharts-renderer. Apart bestand-loos via dynamic import van een
 * inline module zou niet kunnen; daarom importeren we recharts binnen een
 * dynamic() die pas client-side laadt. ssr:false houdt het van de server.
 */
const ChartCanvas = dynamic(() => import('recharts').then((recharts) => createCanvas(recharts)), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export function Chart({
  type,
  data,
  xKey,
  series,
  summary,
  height = 220,
  yDomain,
  showLegend = false,
  style,
}: ChartProps) {
  const resolvedSeries = useMemo(
    () =>
      series.map((s, i) => ({
        ...s,
        label: s.label ?? s.key,
        color: s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      })),
    [series],
  );

  return (
    <figure style={{ margin: 0, ...style }}>
      <div role="img" aria-label={summary} style={{ width: '100%', height }}>
        <ChartCanvas
          type={type}
          data={data}
          xKey={xKey}
          series={resolvedSeries}
          height={height}
          yDomain={yDomain}
          showLegend={showLegend}
        />
      </div>
      <ChartDataTable data={data} xKey={xKey} series={resolvedSeries} summary={summary} />
    </figure>
  );
}

interface ResolvedSeries extends ChartSeries {
  label: string;
  color: string;
}

interface CanvasProps {
  type: ChartType;
  data: ChartDatum[];
  xKey: string;
  series: ResolvedSeries[];
  height: number;
  yDomain?: [number, number];
  showLegend: boolean;
}

type Recharts = typeof import('recharts');

/**
 * Bouwt de daadwerkelijke recharts-renderer met de geladen module.
 * Gescheiden zodat de import lui blijft. Decoratief voor screenreaders
 * (aria-hidden) — het tekstalternatief zit in de sr-only tabel.
 */
function createCanvas(recharts: Recharts) {
  const {
    ResponsiveContainer,
    LineChart,
    AreaChart,
    BarChart,
    Line,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
  } = recharts;

  function Canvas({ type, data, xKey, series, yDomain, showLegend }: CanvasProps) {
    const axisProps = {
      tick: { fontSize: 11, fill: 'var(--text-3)' },
      stroke: 'var(--border-strong)',
    };
    const gridStroke = 'var(--border)';

    const sharedAxes = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis domain={yDomain ?? ['auto', 'auto']} {...axisProps} />
        <Tooltip
          contentStyle={{
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-1)',
            fontSize: 12,
            boxShadow: 'var(--shadow-md)',
          }}
        />
        {showLegend ? <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-2)' }} /> : null}
      </>
    );

    let chart: ReactNode;
    if (type === 'line') {
      chart = (
        <LineChart data={data}>
          {sharedAxes}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      );
    } else if (type === 'area') {
      chart = (
        <AreaChart data={data}>
          {sharedAxes}
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.15}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      );
    } else {
      chart = (
        <BarChart data={data}>
          {sharedAxes}
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      );
    }

    return (
      <div aria-hidden="true" style={{ width: '100%', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      </div>
    );
  }

  return Canvas;
}

function ChartSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'var(--radius-sm)',
        background:
          'linear-gradient(90deg, var(--bg-subtle) 0%, var(--border) 50%, var(--bg-subtle) 100%)',
        opacity: 0.6,
      }}
    />
  );
}

interface DataTableProps {
  data: ChartDatum[];
  xKey: string;
  series: ResolvedSeries[];
  summary: string;
}

/**
 * sr-only datatabel: het echte tekstalternatief voor de grafiek.
 * Visueel verborgen, volledig leesbaar voor screenreaders.
 */
function ChartDataTable({ data, xKey, series, summary }: DataTableProps) {
  return (
    <table style={srOnly}>
      <caption>{summary}</caption>
      <thead>
        <tr>
          <th scope="col">{xKey}</th>
          {series.map((s) => (
            <th key={s.key} scope="col">
              {s.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <th scope="row">{formatCell(row[xKey])}</th>
            {series.map((s) => (
              <td key={s.key}>{formatCell(row[s.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return String(value);
}

const srOnly: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};
