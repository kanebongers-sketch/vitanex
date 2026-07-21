// Gedeelde stijl voor de Programma-feature. Eén bron, `.prog`-prefix, navy/cyan
// via tokens (geen hex). Animeert alleen opacity/transform; respecteert
// prefers-reduced-motion. Getallen krijgen tabular-nums voor nette kolommen.

export const PROG_STYLE = `
.prog { max-width: 760px; margin: 0 auto; }
.prog-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.prog-kop { margin-bottom: 22px; }
.prog-eyebrow {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--brand); margin: 0 0 8px;
}
.prog-titel {
  margin: 0; font-size: clamp(26px, 6vw, 38px); font-weight: 700;
  letter-spacing: -0.02em; line-height: 1.05; color: var(--text-1);
}
.prog-meta { margin: 8px 0 0; font-size: 13.5px; color: var(--text-3); }
.prog-meta b { color: var(--text-2); font-weight: 600; }

/* ── Segment-tabs ── */
.prog-tablist {
  display: flex; gap: 4px; padding: 4px; margin-bottom: 22px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-btn);
}
.prog-tab {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  min-height: 40px; padding: 0 10px; border: 0; border-radius: 7px;
  background: transparent; color: var(--text-3); cursor: pointer;
  font-family: inherit; font-size: 13.5px; font-weight: 600; letter-spacing: -0.01em;
  transition: color 0.16s var(--ease), background 0.16s var(--ease);
}
.prog-tab:hover { color: var(--text-1); }
.prog-tab[aria-selected="true"] { background: var(--brand-soft); color: var(--brand); }
.prog-tab:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.prog-tab-tekst { display: inline; }
@media (max-width: 380px) { .prog-tab-tekst { display: none; } }

.prog-panel:focus-visible { outline: 2px solid var(--brand); outline-offset: 4px; border-radius: 8px; }
.prog-panel { animation: prog-in 0.22s var(--ease) both; }
@keyframes prog-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

/* ── Keuze-chips (dag / sessie) ── */
.prog-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 20px; }
.prog-chip {
  padding: 7px 13px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--line-strong); background: transparent; color: var(--text-3);
  font-family: inherit; font-size: 12.5px; font-weight: 600; letter-spacing: -0.01em;
  transition: color 0.16s var(--ease), border-color 0.16s var(--ease), background 0.16s var(--ease);
}
.prog-chip:hover { color: var(--brand); border-color: var(--brand); }
.prog-chip[aria-pressed="true"] { background: var(--brand-soft); border-color: var(--brand); color: var(--brand); }
.prog-chip:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }

/* ── Kaart / sectie ── */
.prog-sectie {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-card); box-shadow: var(--shadow-card);
  padding: 16px 18px; margin-bottom: 14px;
}
.prog-sectie-kop {
  display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
  margin: 0 0 12px;
}
.prog-sectie-titel {
  margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: var(--text-1);
}
.prog-sectie-tag {
  font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
  color: var(--text-4);
}

/* ── Tabellen ── */
.prog-tablewrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.prog-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.prog-table caption { text-align: left; }
.prog-table th, .prog-table td { padding: 9px 8px; text-align: left; vertical-align: top; }
.prog-table thead th {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
  color: var(--text-4); border-bottom: 1px solid var(--border); white-space: nowrap;
}
.prog-table tbody td { border-bottom: 1px solid var(--border); color: var(--text-2); }
.prog-table tbody tr:last-child td { border-bottom: 0; }
.prog-naam { color: var(--text-1); font-weight: 600; letter-spacing: -0.01em; }
.prog-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--text-2); }
.prog-th-num { text-align: right; }
.prog-dim { color: var(--text-4); }
.prog-table tfoot td {
  padding-top: 11px; border-top: 1px solid var(--line-strong);
  font-weight: 700; color: var(--text-1); font-variant-numeric: tabular-nums;
}
.prog-table tfoot .prog-foot-label { font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-3); }
.prog-abbr { text-decoration: none; border: 0; cursor: help; }

.prog-cardio {
  display: flex; align-items: center; gap: 9px; margin-top: 12px; padding-top: 12px;
  border-top: 1px dashed var(--border); font-size: 13px; color: var(--text-3);
}
.prog-cardio b { color: var(--text-2); font-weight: 600; }
.prog-cardio-ico { display: inline-flex; color: var(--brand); flex-shrink: 0; }

/* ── Macro-doel-balken ── */
.prog-doel {
  background: color-mix(in srgb, var(--brand) 6%, var(--bg-card));
  border: 1px solid color-mix(in srgb, var(--brand) 22%, transparent);
  border-radius: var(--radius-card); padding: 16px 18px; margin-top: 4px;
}
.prog-doel-kop { margin: 0 0 4px; font-size: 14px; font-weight: 700; color: var(--text-1); }
.prog-doel-sub { margin: 0 0 14px; font-size: 12.5px; color: var(--text-3); }
.prog-macro { margin-bottom: 12px; }
.prog-macro:last-child { margin-bottom: 0; }
.prog-macro-rij { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 5px; }
.prog-macro-label { font-size: 12.5px; font-weight: 600; color: var(--text-2); }
.prog-macro-getal { font-size: 12.5px; color: var(--text-3); font-variant-numeric: tabular-nums; }
.prog-macro-getal b { color: var(--text-1); font-weight: 700; }
.prog-bar { height: 7px; border-radius: 999px; background: var(--line-strong); overflow: hidden; }
.prog-bar-fill { height: 100%; border-radius: 999px; background: var(--brand); transform-origin: left; }

/* ── Boodschappen ── */
.prog-boodschap { columns: 2; column-gap: 26px; margin: 0; padding: 0; list-style: none; }
@media (max-width: 480px) { .prog-boodschap { columns: 1; } }
.prog-boodschap li {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
  padding: 9px 0; border-bottom: 1px solid var(--border); break-inside: avoid;
}
.prog-boodschap-naam { color: var(--text-1); font-size: 13.5px; font-weight: 500; }
.prog-boodschap-hoev { color: var(--text-3); font-size: 13px; font-variant-numeric: tabular-nums; white-space: nowrap; }

.prog-tips { margin: 16px 0 0; padding: 0; list-style: none; display: grid; gap: 9px; }
.prog-tip {
  display: flex; gap: 10px; padding: 12px 14px; font-size: 12.5px; line-height: 1.5;
  color: var(--text-3); background: var(--bg-card);
  border: 1px solid var(--border); border-radius: 10px;
}
.prog-tip-ico { color: var(--brand); flex-shrink: 0; margin-top: 1px; }

@media (prefers-reduced-motion: reduce) {
  .prog-panel { animation: none; }
  .prog-tab, .prog-chip, .prog-bar-fill { transition: none; }
}
`
