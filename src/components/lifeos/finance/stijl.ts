// ─── LifeOS — Finance: co-located styles ────────────────────────────────────
// Eén CSS-string, één `<style href="fin" precedence="medium">` in FinanceKaart.
// React 19 dedupt op `href`, dus alle subcomponenten mogen de `.fin`-classes
// gebruiken zonder eigen style-tag. Strikt navy + cyan: geld-signalen (verlopen,
// verlies) leunen op de status-tokens, cyaan blijft accent op de winst.

export const FIN_CSS = `
.fin {
  display: grid;
  gap: 20px;
}

/* ── Kern-cijfers ─────────────────────────────────────────────────────────── */
.fin__periode {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-4);
  font-variant-numeric: tabular-nums;
}
.fin__cijfers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
@media (min-width: 760px) {
  .fin__cijfers { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
.fin__tegel {
  display: grid;
  gap: 7px;
  align-content: start;
  padding: 15px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--bg-app);
}
.fin__tegel-label {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-3);
}
.fin__tegel-waarde {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.02;
  letter-spacing: -0.01em;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.fin__tegel--accent .fin__tegel-waarde { color: var(--brand); }
.fin__tegel--verlies .fin__tegel-waarde { color: var(--status-danger); }
.fin__tegel-sub {
  display: block;
  min-height: 15px;
  margin: 0;
  font-size: 11px;
  color: var(--text-4);
  font-variant-numeric: tabular-nums;
}
.fin__tegel-sub--waarschuwing {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--status-warning);
}
.fin__tegel-sub svg { flex-shrink: 0; }

/* ── Mini-trend (winst per maand) ─────────────────────────────────────────── */
.fin__trend { display: grid; gap: 10px; }
.fin__trend-kop {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-4);
}
.fin__trend-rij {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 10px;
  align-items: end;
  height: 96px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--bg-app);
}
.fin__balk {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 7px;
  align-items: end;
  justify-items: center;
  min-width: 0;
  height: 100%;
}
.fin__balk-spoor {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  max-width: 30px;
  height: 100%;
}
/* Statische inline-height (geen animatie — dat zou layout triggeren). */
.fin__balk-vulling {
  width: 100%;
  min-height: 3px;
  border-radius: 4px 4px 2px 2px;
  background: color-mix(in srgb, var(--brand) 42%, transparent);
}
.fin__balk--verlies .fin__balk-vulling {
  background: color-mix(in srgb, var(--status-danger) 52%, transparent);
}
.fin__balk--huidig .fin__balk-vulling { background: var(--brand); }
.fin__balk--huidig.fin__balk--verlies .fin__balk-vulling { background: var(--status-danger); }
.fin__balk-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--text-4);
  font-variant-numeric: tabular-nums;
}
.fin__balk--huidig .fin__balk-label { color: var(--text-2); }

/* ── Snel-toevoegen ───────────────────────────────────────────────────────── */
.fin__form {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--bg-card);
}
.fin__form--prominent {
  border-color: color-mix(in srgb, var(--brand) 30%, var(--line-strong));
  background: color-mix(in srgb, var(--brand) 5%, var(--bg-card));
}
.fin__velden {
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(0, 1fr);
}
@media (min-width: 640px) {
  .fin__velden { grid-template-columns: 140px minmax(0, 1fr) 160px; }
}
.fin__veld { display: grid; gap: 5px; min-width: 0; }
.fin__veld-label { font-size: 11px; font-weight: 600; color: var(--text-3); }
.fin__invoer {
  width: 100%;
  min-width: 0;
  padding: 9px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-btn);
  background: var(--bg-raised);
  color: var(--text-1);
  font-family: inherit;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.fin__invoer::placeholder { color: var(--text-4); }
.fin__invoer:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
  border-color: var(--brand);
}
.fin__onderrij {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.fin__soort {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg-raised);
}
.fin__soort-knop {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 15px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--text-3);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 180ms var(--ease), background 180ms var(--ease), border-color 180ms var(--ease);
}
.fin__soort-knop:hover { color: var(--text-2); }
.fin__soort-knop[aria-pressed='true'] {
  color: var(--brand);
  background: var(--brand-soft);
  border-color: color-mix(in srgb, var(--brand) 40%, transparent);
}
.fin__soort-knop:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.fin__verzend {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border: 1px solid var(--brand);
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 180ms var(--ease), transform 120ms var(--ease);
}
.fin__verzend:hover { background: color-mix(in srgb, var(--brand) 22%, transparent); }
.fin__verzend:active { transform: scale(0.98); }
.fin__verzend:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.fin__verzend:disabled { opacity: 0.5; cursor: not-allowed; }
.fin__form-fout {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--status-danger);
}
.fin__form-fout svg { flex-shrink: 0; margin-top: 1px; }

/* ── Laad-skelet (rustige navy, geen spinner) ─────────────────────────────── */
.fin__skelet { display: grid; gap: 20px; }
.fin__skelet-rij {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
@media (min-width: 760px) {
  .fin__skelet-rij { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
.fin__skelet-blok { height: 92px; border-radius: var(--radius-md); background: var(--bg-raised); }
.fin__skelet-balk { height: 120px; border-radius: var(--radius-md); background: var(--bg-raised); }

@media (prefers-reduced-motion: reduce) {
  .fin__soort-knop,
  .fin__verzend { transition: none; }
  .fin__verzend:active { transform: none; }
}
`
