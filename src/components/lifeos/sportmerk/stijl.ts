// ─── LifeOS — Sportmerk: co-located styles ──────────────────────────────────
// Eén CSS-string, één `<style href="spm" precedence="medium">` in SportmerkKaart
// (React 19 dedupt op `href`). Strikt navy + cyan via de LifeOS-tokens; cyaan
// alleen als accent (de richting, kern-rollen, positieve marge, focus).

export const SPM_CSS = `
.spm { display: grid; gap: 36px; }

.spm__sr {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
}

/* ── Hero: de keuze ───────────────────────────────────────────────────────── */
.spm__hero { display: grid; gap: 10px; max-width: 62ch; }
.spm__boven {
  margin: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--text-3);
}
.spm__richting {
  margin: 0; font-size: clamp(28px, 5vw, 44px); font-weight: 700;
  line-height: 1.05; letter-spacing: -0.03em; color: var(--text-1);
}
.spm__richting::after { content: '.'; color: var(--brand); }
.spm__samenvatting { margin: 0; font-size: 16px; line-height: 1.6; color: var(--text-2); }

/* ── Secties ──────────────────────────────────────────────────────────────── */
.spm__sectie { display: grid; gap: 12px; align-content: start; }
.spm__kop {
  margin: 0; font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
  text-transform: uppercase; color: var(--text-2);
}
.spm__intro { margin: -4px 0 0; font-size: 14px; line-height: 1.55; color: var(--text-3); max-width: 64ch; }
.spm__duo { display: grid; gap: 36px; }
@media (min-width: 900px) {
  .spm__duo { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px; }
}

.spm__lijst { margin: 0; padding-left: 18px; display: grid; gap: 10px; font-size: 15px; line-height: 1.55; color: var(--text-1); }
.spm__lijst li::marker { color: var(--brand); }
.spm__lijst--stappen li::marker { font-variant-numeric: tabular-nums; font-weight: 600; }

.spm__bron {
  display: inline-flex; align-items: center; gap: 2px; font-size: 13px;
  color: var(--brand); text-decoration: underline; text-underline-offset: 3px;
  text-decoration-thickness: 1px; border-radius: 4px;
}
.spm__bron:hover { text-decoration-thickness: 2px; }
.spm__bron:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.spm__eigen { font-size: 13px; color: var(--text-3); }

.spm__tt { margin: 0; display: grid; gap: 14px; }
.spm__tt dt { font-size: 15px; font-weight: 600; color: var(--text-1); }
.spm__tt dd { margin: 3px 0 0; font-size: 14px; line-height: 1.55; color: var(--text-3); }

/* ── Plan: genummerde fasen ───────────────────────────────────────────────── */
.spm__fasen { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; }
.spm__fase {
  display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 14px;
  padding: 18px 0; border-top: 1px solid var(--line);
}
.spm__fase:last-child { border-bottom: 1px solid var(--line); }
.spm__fase-nr {
  margin: 0; font-size: 22px; font-weight: 600; line-height: 1.2;
  color: var(--brand); font-variant-numeric: tabular-nums;
}
.spm__fase-body { display: grid; gap: 6px; }
.spm__fase-periode {
  margin: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
  text-transform: uppercase; color: var(--text-3);
}
.spm__fase-naam { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; color: var(--text-1); }
.spm__fase-doel { margin: 0; font-size: 14px; line-height: 1.55; color: var(--text-2); max-width: 70ch; }
.spm__fase-regels { margin: 6px 0 0; display: grid; gap: 10px; }
@media (min-width: 760px) {
  .spm__fase { grid-template-columns: 64px minmax(0, 1fr); }
  .spm__fase-regels { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
}
.spm__fase-regels dt { font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-3); }
.spm__fase-regels dd { margin: 3px 0 0; font-size: 13px; line-height: 1.5; color: var(--text-2); }

/* ── Marge-tabel ──────────────────────────────────────────────────────────── */
.spm__marge { display: grid; gap: 16px; }
.spm__tabel-wrap {
  overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius-md);
  background: var(--bg-app);
}
.spm__tabel-wrap:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.spm__tabel { width: 100%; border-collapse: collapse; font-size: 14px; }
.spm__tabel th, .spm__tabel td { padding: 12px 14px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); }
.spm__tabel tbody tr:last-child > * { border-bottom: 0; }
.spm__tabel thead th {
  font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
  color: var(--text-3); white-space: nowrap;
}
.spm__tabel tbody th { font-weight: 400; }
.spm__tabel td { color: var(--text-2); }
.spm__product { display: block; font-weight: 600; color: var(--text-1); }
.spm__levering {
  display: block; margin-top: 2px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--text-2);
}
.spm__toelichting { display: block; margin-top: 3px; font-size: 13px; line-height: 1.45; color: var(--text-3); }
.spm__tabel .spm__num { text-align: right !important; font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--text-1); }
.spm__tabel .spm__winst { color: var(--brand); font-weight: 600; }
.spm__tabel .spm__verlies { color: var(--status-danger); font-weight: 600; }
/* Smal: elke rij een kaartje, label vóór de waarde. */
@media (max-width: 759px) {
  .spm__tabel thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .spm__tabel tbody tr {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px;
    padding: 16px 14px; border-bottom: 1px solid var(--line);
  }
  .spm__tabel tbody tr:last-child { border-bottom: 0; }
  .spm__tabel tbody th, .spm__tabel tbody td { display: block; padding: 0; border: 0; }
  .spm__tabel tbody th { grid-column: 1 / -1; }
  .spm__tabel tbody td::before {
    content: attr(data-label); display: block; margin-bottom: 2px; font-size: 11px; font-weight: 600;
    letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-3);
  }
  .spm__tabel .spm__num { text-align: left !important; }
}
@media (min-width: 760px) {
  .spm__tabel { min-width: 760px; }
}
.spm__rol {
  display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 12px;
  border: 1px solid var(--line); color: var(--text-2); white-space: nowrap;
}
.spm__rol--kern { border-color: var(--brand); color: var(--brand); }

.spm__aannames {
  margin: 0; display: grid; gap: 10px 24px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}
.spm__aannames dt { font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-3); }
.spm__aannames dd { margin: 3px 0 0; font-size: 13px; line-height: 1.45; color: var(--text-2); }

.spm__voet { margin: 0; font-size: 12px; color: var(--text-3); }

/* ── Laadstaat: statisch, geen pulse (zelfde keuze als de rest van LifeOS) ── */
.spm__skelet { display: grid; gap: 14px; }
.spm__skelet-blok { height: 64px; border-radius: var(--radius-md); background: var(--bg-raised); }
.spm__skelet-blok--kop { height: 96px; max-width: 520px; }
.spm__skelet-blok--tabel { height: 280px; }
`
