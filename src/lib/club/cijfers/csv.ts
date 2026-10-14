// ─── Fit Factory Club: CSV voor Excel (PUUR) ────────────────────────────────
// Puntkomma als scheiding en een BOM, zodat Nederlandse Excel het meteen goed
// opent. Getallen met een komma als decimaalteken.

export type CsvWaarde = string | number | null

function cel(w: CsvWaarde): string {
  if (w === null) return ''
  const tekst = typeof w === 'number' ? (Number.isInteger(w) ? String(w) : w.toFixed(2).replace('.', ',')) : w
  // Formule-injectie voorkomen: Excel voert cellen die met = + - @ beginnen uit.
  const veilig = typeof w === 'string' && /^[=+\-@\t\r]/.test(tekst) ? `'${tekst}` : tekst
  return /[;"\n\r]/.test(veilig) ? `"${veilig.replace(/"/g, '""')}"` : veilig
}

export function naarCsv(kop: readonly string[], rijen: readonly (readonly CsvWaarde[])[]): string {
  const regels = [kop, ...rijen].map((r) => r.map(cel).join(';'))
  return `﻿${regels.join('\r\n')}\r\n`
}

/** Een veilige bestandsnaam: "bezoek-per-week-budel-12w.csv". */
export function csvBestandsnaam(...delen: string[]): string {
  const basis = delen
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${basis || 'cijfers'}.csv`
}
