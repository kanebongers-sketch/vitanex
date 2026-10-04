// ─── LifeOS — Beleggingen: co-located styles ────────────────────────────────
// Eén `<style href="bel" precedence="medium">` (React 19 dedupt op href).
// Navy + cyaan; winst = cyaan (status-success), verlies = status-danger — en
// altijd met een + of − ervoor, zodat het niet op kleur alleen leunt.

export const BEL_CSS = `
.bel { display: grid; gap: 18px; }
.bel__cijfers { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 760px) { .bel__cijfers { grid-template-columns: 1.4fr 1fr 1fr; } }
.bel__tegel { display: grid; gap: 6px; align-content: start; padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--radius-md, 12px); background: var(--bg-app); }
.bel__tegel--groot { grid-column: 1 / -1; }
@media (min-width: 760px) { .bel__tegel--groot { grid-column: auto; } }
.bel__label { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-4); }
.bel__hoofdgetal { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; color: var(--text-1); font-variant-numeric: tabular-nums; }
.bel__getal-m { font-size: 16px; font-weight: 600; color: var(--text-1); font-variant-numeric: tabular-nums; }
.bel__lijst { list-style: none; margin: 0; padding: 0; display: grid; }
.bel__rij { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 12px; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--line); }
.bel__rij--bewerk { grid-template-columns: 1fr; }
.bel__naam { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-1); }
.bel__sub { margin: 2px 0 0; font-size: 12.5px; color: var(--text-3); font-variant-numeric: tabular-nums; }
.bel__getal { text-align: right; }
@media (max-width: 560px) {
  .bel__rij { grid-template-columns: minmax(0, 1fr) auto; row-gap: 6px; }
  .bel__wie { grid-column: 1 / -1; }
  .bel__getal { text-align: left; }
}
.bel__waarde { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-1); font-variant-numeric: tabular-nums; }
.bel__acties { display: inline-flex; gap: 4px; }
.bel__icoon { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: var(--text-3); cursor: pointer; transition: color 150ms, border-color 150ms; }
.bel__icoon:hover { color: var(--brand); border-color: var(--line); }
.bel__velden { display: flex; flex-wrap: wrap; gap: 10px; align-items: end; }
.bel__velden label { display: grid; gap: 4px; font-size: 11.5px; font-weight: 600; color: var(--text-4); }
.bel__velden input, .bel__zoek input { appearance: none; font: inherit; font-size: 13px; color: var(--text-1); background: var(--bg-raised); border: 1px solid var(--line); border-radius: 8px; padding: 7px 10px; min-width: 0; }
.bel__zoek { display: flex; gap: 8px; }
.bel__zoek input { flex: 1; }
.bel__knoppen, .bel__toevoegen-knoppen { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.bel__knop { display: inline-flex; align-items: center; gap: 6px; font: inherit; font-size: 13px; font-weight: 600; color: var(--text-2); background: transparent; border: 1px solid var(--line); border-radius: 999px; padding: 6px 12px; cursor: pointer; transition: color 150ms, border-color 150ms; }
.bel__knop:hover { color: var(--brand); border-color: var(--brand); }
.bel__knop--primair { color: var(--brand); border-color: var(--brand); }
.bel__knop--stil { border-color: transparent; justify-self: start; }
.bel__verborgen { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.bel__knop:focus-within { outline: 2px solid var(--brand); outline-offset: 2px; }
.bel__toevoegen { display: grid; gap: 10px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg-app); }
.bel__resultaten { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; max-height: 240px; overflow: auto; }
.bel__resultaten button { width: 100%; text-align: left; font: inherit; font-size: 13px; color: var(--text-1); background: transparent; border: 0; border-radius: 8px; padding: 7px 8px; cursor: pointer; }
.bel__resultaten button:hover { background: var(--bg-raised); }
.bel__leeg { margin: 0; font-size: 13.5px; color: var(--text-3); line-height: 1.5; }
.bel__grafiek { margin: 0; display: grid; gap: 8px; }
.bel__grafiek-kop { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-4); }
.bel__grafiek-vlak { position: relative; }
.bel__grafiek svg { display: block; width: 100%; height: auto; touch-action: pan-y; }
.bel__grafiek svg:focus-visible { outline: 2px solid var(--brand); outline-offset: 4px; border-radius: 6px; }
.bel__grid { stroke: var(--line); stroke-width: 1; }
.bel__lijn { fill: none; stroke: var(--brand); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.bel__kruis { stroke: var(--text-4); stroke-width: 1; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; }
.bel__punt { fill: var(--brand); stroke: var(--bg-card); stroke-width: 2; }
.bel__assen { display: flex; justify-content: space-between; font-size: 11.5px; color: var(--text-4); font-variant-numeric: tabular-nums; }
.bel__tip { position: absolute; top: 0; transform: translateX(-50%); display: grid; gap: 2px; padding: 6px 9px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg-raised); font-size: 12px; color: var(--text-1); pointer-events: none; white-space: nowrap; font-variant-numeric: tabular-nums; }
.bel__tip-dag { color: var(--text-3); }
.bel__voet { margin: 0; font-size: 11.5px; color: var(--text-4); line-height: 1.5; }
.bel__skelet { height: 120px; border-radius: 12px; background: var(--bg-raised); }
.bel .bel--plus { color: var(--status-success); }
.bel .bel--min { color: var(--status-danger); }
`
