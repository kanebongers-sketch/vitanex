// Gedeelde stijl voor de Team-KPI-feature. Eén bron, `.team`-prefix, navy/cyan
// via tokens (geen hex). Getallen krijgen tabular-nums voor nette kolommen.
// Animeert alleen opacity/transform; respecteert prefers-reduced-motion.

export const TEAM_STYLE = `
.team { max-width: 820px; margin: 0 auto; }
.team-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* ── Kop ── */
.team-kop { margin-bottom: 22px; }
.team-eyebrow {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--brand); margin: 0 0 8px;
}
.team-titel {
  margin: 0; font-size: clamp(26px, 6vw, 38px); font-weight: 700;
  letter-spacing: -0.02em; line-height: 1.05; color: var(--text-1);
}
.team-bron { margin: 10px 0 0; font-size: 13.5px; line-height: 1.5; color: var(--text-3); }
.team-bron b { color: var(--text-2); font-weight: 600; }

/* ── Totaal-strip ── */
.team-stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  margin: 0 0 22px; padding: 0;
}
.team-stat {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-card); box-shadow: var(--shadow-card);
  padding: 15px 16px;
}
.team-stat dt {
  margin: 0 0 6px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.05em;
  text-transform: uppercase; color: var(--text-4);
}
.team-stat dd {
  margin: 0; font-size: clamp(20px, 4.6vw, 27px); font-weight: 700; line-height: 1;
  letter-spacing: -0.02em; color: var(--text-1); font-variant-numeric: tabular-nums;
}
.team-stat--brand { border-color: color-mix(in srgb, var(--brand) 30%, transparent); }
.team-stat--brand dd { color: var(--brand); }
@media (max-width: 560px) {
  .team-stats { grid-template-columns: 1fr; gap: 8px; }
  .team-stat { display: flex; align-items: baseline; justify-content: space-between; padding: 12px 15px; }
  .team-stat dt { margin: 0; }
}

/* ── Tabel ── */
.team-tablewrap {
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-card); box-shadow: var(--shadow-card);
}
.team-tablewrap:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.team-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.team-table th, .team-table td { padding: 13px 14px; text-align: left; vertical-align: middle; }
.team-table thead th {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
  color: var(--text-4); border-bottom: 1px solid var(--border); white-space: nowrap;
}
.team-th-num { text-align: right; }

.team-rij td, .team-rij th { border-bottom: 1px solid var(--border); }
.team-rij:last-of-type td, .team-rij:last-of-type th { border-bottom: 0; }
.team-rij { transition: background 0.16s var(--ease); }
.team-rij:hover { background: color-mix(in srgb, var(--text-1) 4%, transparent); }

/* Koploper: rustige cyan-accent aan de linkerkant. De betekenis zit in het
   tekst-label "Koploper" hiernaast, niet alleen in de kleur. */
.team-rij--top { background: color-mix(in srgb, var(--brand) 6%, transparent); }
.team-rij--top:hover { background: color-mix(in srgb, var(--brand) 9%, transparent); }
.team-rij--top th { box-shadow: inset 3px 0 0 var(--brand); }
.team-rij--laag .team-rang { opacity: 0.4; }

/* Trainer-cel */
.team-trainer { display: flex; align-items: center; gap: 12px; }
.team-rang {
  flex-shrink: 0; width: 22px; text-align: right; font-size: 12px; font-weight: 700;
  color: var(--text-4); font-variant-numeric: tabular-nums;
}
.team-trainer-body { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.team-naam-rij { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.team-naam { font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: var(--text-1); }
.team-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 999px;
  background: var(--brand-soft); color: var(--brand);
  border: 1px solid color-mix(in srgb, var(--brand) 30%, transparent);
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.02em; white-space: nowrap;
}

/* Vestiging-chips */
.team-vest { display: flex; flex-wrap: wrap; gap: 5px; }
.team-chip {
  padding: 2px 8px; border-radius: 999px;
  border: 1px solid var(--line-strong); background: transparent;
  font-size: 11px; font-weight: 600; letter-spacing: -0.01em; color: var(--text-3);
  white-space: nowrap;
}

/* Getal-cellen */
.team-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--text-2); }
.team-omzet-cel { text-align: right; white-space: nowrap; }
.team-omzet {
  display: block; font-size: clamp(17px, 3.4vw, 21px); font-weight: 700;
  letter-spacing: -0.02em; color: var(--text-1); font-variant-numeric: tabular-nums;
}
.team-gem { display: block; margin-top: 2px; font-size: 11.5px; color: var(--text-4); font-variant-numeric: tabular-nums; }

/* Totaalregel */
.team-table tfoot td, .team-table tfoot th {
  padding-top: 14px; padding-bottom: 14px; border-top: 1px solid var(--line-strong);
  font-weight: 700; color: var(--text-1); font-variant-numeric: tabular-nums;
}
.team-foot-label { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-3); }

@media (prefers-reduced-motion: reduce) {
  .team-rij { transition: none; }
}
`
