// Gedeelde stijl voor de analyse-feature. Eén bron, `.anl`-prefix, navy/cyan via
// tokens (geen hex). Balken hebben een statische breedte/hoogte — er wordt niets
// aan width/height geanimeerd. Getallen krijgen tabular-nums voor nette kolommen.
// Respecteert prefers-reduced-motion.

export const ANALYSE_STYLE = `
.anl { max-width: 860px; margin: 0 auto; }
.anl-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* ── Kop ── */
.anl-kop { margin-bottom: 24px; }
.anl-eyebrow {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--brand); margin: 0 0 8px;
}
.anl-titel {
  margin: 0; font-size: clamp(26px, 6vw, 38px); font-weight: 700;
  letter-spacing: -0.02em; line-height: 1.05; color: var(--text-1);
}
.anl-meta { margin: 10px 0 0; font-size: 13.5px; line-height: 1.5; color: var(--text-3); max-width: 62ch; }
.anl-meta b { color: var(--text-2); font-weight: 600; }

/* ── Totaal-strip ── */
.anl-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 26px; list-style: none; padding: 0; }
@media (max-width: 640px) { .anl-strip { grid-template-columns: repeat(2, 1fr); } }
.anl-tegel {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-card); box-shadow: var(--shadow-card); padding: 15px 16px;
}
.anl-tegel-label {
  margin: 0 0 7px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.05em;
  text-transform: uppercase; color: var(--text-4); display: flex; align-items: center; gap: 6px;
}
.anl-tegel-waarde { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -0.02em; color: var(--text-1); font-variant-numeric: tabular-nums; }
.anl-tegel-sub { margin: 4px 0 0; font-size: 12px; color: var(--text-3); font-variant-numeric: tabular-nums; }
.anl-tegel--aandacht {
  border-color: color-mix(in srgb, var(--status-warning) 42%, transparent);
  background: color-mix(in srgb, var(--status-warning) 8%, var(--bg-card));
}
.anl-tegel--aandacht .anl-tegel-waarde { color: var(--status-warning); }
.anl-tegel--aandacht .anl-tegel-label { color: var(--status-warning); }

/* ── Sectie ── */
.anl-sectie {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-card); box-shadow: var(--shadow-card);
  padding: 18px 20px; margin-bottom: 16px;
}
.anl-sectie-kop { margin: 0 0 16px; }
.anl-sectie-titel {
  display: flex; align-items: center; gap: 8px; margin: 0;
  font-size: 16px; font-weight: 700; letter-spacing: -0.01em; color: var(--text-1);
}
.anl-sectie-titel svg { color: var(--brand); flex-shrink: 0; }
.anl-sectie-bij { margin: 6px 0 0; font-size: 12.5px; line-height: 1.5; color: var(--text-3); }

/* ── Omzet-balken ── */
.anl-balken { list-style: none; margin: 0; padding: 0; display: grid; gap: 15px; }
.anl-balk-rij { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
.anl-balk-naam { font-size: 13.5px; font-weight: 600; color: var(--text-1); letter-spacing: -0.01em; }
.anl-balk-cijfer { font-size: 13px; color: var(--text-2); font-variant-numeric: tabular-nums; white-space: nowrap; }
.anl-balk-cijfer b { color: var(--text-1); font-weight: 700; }
.anl-balk-cijfer span { color: var(--text-4); }
.anl-balk-track { height: 8px; border-radius: 999px; background: var(--line-strong); overflow: hidden; }
.anl-balk-fill { height: 100%; border-radius: 999px; background: var(--brand); }

/* ── Contract-einde tabel ── */
.anl-tablewrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.anl-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.anl-table caption { text-align: left; }
.anl-table th, .anl-table td { padding: 11px 8px; text-align: left; }
.anl-table thead th {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
  color: var(--text-4); border-bottom: 1px solid var(--border); white-space: nowrap;
}
.anl-th-num, .anl-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.anl-table tbody td { border-bottom: 1px solid var(--border); color: var(--text-2); }
.anl-table tbody tr:last-child td { border-bottom: 0; }
.anl-maand { color: var(--text-1); font-weight: 600; }
.anl-omzet-num { color: var(--text-1); font-weight: 600; }
.anl-rij--verleden td, .anl-rij--verleden .anl-maand, .anl-rij--verleden .anl-omzet-num { color: var(--text-4); }
.anl-rij--aandacht td { background: var(--status-warning-soft); }
.anl-rij--aandacht .anl-maand, .anl-rij--aandacht .anl-omzet-num { color: var(--status-warning); }
.anl-tag {
  display: inline-flex; align-items: center; gap: 4px; margin-left: 8px;
  padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: 700;
  letter-spacing: 0.03em; text-transform: uppercase;
  background: var(--status-warning-soft); color: var(--status-warning);
}
.anl-tag svg { flex-shrink: 0; }

/* ── Groei-staafjes ── */
.anl-groei { list-style: none; margin: 0; padding: 0; display: flex; align-items: flex-end; gap: 8px; }
.anl-groei li { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 7px; min-width: 0; }
.anl-groei-getal { font-size: 13px; font-weight: 700; color: var(--text-1); font-variant-numeric: tabular-nums; }
.anl-groei-kolom { width: 100%; display: flex; align-items: flex-end; height: 78px; }
.anl-groei-staaf { width: 100%; border-radius: 6px 6px 0 0; background: var(--brand-soft); border-top: 2px solid var(--brand); min-height: 4px; }
.anl-groei-maand { font-size: 10.5px; color: var(--text-4); letter-spacing: 0.02em; text-align: center; }

/* ── Bronvermelding ── */
.anl-bron {
  display: flex; gap: 10px; align-items: flex-start; margin-top: 18px;
  padding: 13px 15px; font-size: 12px; line-height: 1.55; color: var(--text-3);
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
}
.anl-bron svg { color: var(--brand); flex-shrink: 0; margin-top: 1px; }
.anl-bron b { color: var(--text-2); font-weight: 600; }
`
