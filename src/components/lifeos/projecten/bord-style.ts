// Gedeelde stijl voor het projectenbord. Eén bron, `.proj`-prefix, navy/cyan via
// tokens (geen hex). Animeert alleen opacity/transform/kleur — nooit breedte of
// andere layout-properties. Respecteert prefers-reduced-motion.

export const BORD_STYLE = `
.proj { max-width: 1080px; margin: 0 auto; }
.proj-sr {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* ── Kop ── */
.proj-kop { margin-bottom: 24px; }
.proj-eyebrow {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--brand); margin: 0 0 8px;
}
.proj-titel {
  margin: 0; font-size: clamp(26px, 6vw, 38px); font-weight: 700;
  letter-spacing: -0.02em; line-height: 1.05; color: var(--text-1);
}
.proj-meta { margin: 8px 0 0; font-size: 13.5px; color: var(--text-3); max-width: 60ch; }

.proj-inhoud { display: grid; gap: 20px; }
.proj-toevoegen { display: flex; }

/* ── Lege staat ── */
.proj-leeg {
  border: 1px dashed var(--line-strong); border-radius: var(--radius-card);
  padding: 26px 22px; background: color-mix(in srgb, var(--brand) 4%, var(--bg-card));
}
.proj-leeg-titel { margin: 0 0 5px; font-size: 15px; font-weight: 700; color: var(--text-1); }
.proj-leeg-uitleg { margin: 0; font-size: 13px; line-height: 1.55; color: var(--text-3); max-width: 52ch; }

/* ── Rooster van projectkaarten ── */
.proj-grid {
  display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}
@media (max-width: 560px) { .proj-grid { grid-template-columns: 1fr; } }

/* ── Projectkaart ── */
.proj-kaart {
  display: grid; gap: 14px; align-content: start;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-card); box-shadow: var(--shadow-card);
  padding: 18px 18px 16px;
  transition: border-color 0.18s var(--ease), transform 0.18s var(--ease);
}
.proj-kaart:hover { border-color: color-mix(in srgb, var(--brand) 32%, var(--border)); transform: translateY(-2px); }
.proj-kaart:focus-within { border-color: var(--brand); }
.proj-kaart--archief { opacity: 0.66; }
.proj-kaart--archief:hover { opacity: 0.9; }
.proj-kaart--zonder { border-style: dashed; background: color-mix(in srgb, var(--brand) 3%, var(--bg-card)); }

.proj-kaart-kop { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.proj-kaart-titelblok { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-width: 0; }
.proj-kaart-titel {
  margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.01em;
  color: var(--text-1); overflow-wrap: anywhere;
}
.proj-tag {
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--text-3); border: 1px solid var(--line-strong); border-radius: 999px;
  padding: 2px 8px; white-space: nowrap;
}
.proj-kaart-omschrijving { margin: -4px 0 0; font-size: 12.5px; line-height: 1.5; color: var(--text-3); }

/* ── Voortgang ── */
.proj-voortgang { display: grid; gap: 6px; }
.proj-bar { height: 6px; border-radius: 999px; background: var(--line-strong); overflow: hidden; }
.proj-bar-fill { height: 100%; border-radius: 999px; background: var(--brand); }
.proj-voortgang-tekst { font-size: 11.5px; font-weight: 600; color: var(--text-3); }
.proj-voortgang-leeg { margin: 0; font-size: 12px; color: var(--text-4); }

/* ── Takenlijst ── */
.proj-taken { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.proj-taak {
  display: flex; align-items: flex-start; gap: 9px; padding: 7px 0;
  border-top: 1px solid var(--line); font-size: 13px; line-height: 1.4;
}
.proj-taak:first-child { border-top: 0; }
.proj-taak-ico { color: var(--text-4); flex-shrink: 0; margin-top: 1px; }
.proj-taak-ico--klaar { color: var(--brand); }
.proj-taak-titel { color: var(--text-2); overflow-wrap: anywhere; }
.proj-taak--klaar .proj-taak-titel { color: var(--text-4); text-decoration: line-through; }
.proj-taken-leeg { margin: 0; font-size: 12.5px; color: var(--text-4); }

/* ── Beheer ── */
.proj-beheer { display: grid; gap: 8px; justify-items: start; }
.proj-beheer-rij { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.proj-ico-knop {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; padding: 0; border-radius: 8px;
  border: 1px solid transparent; background: transparent; color: var(--text-3);
  cursor: pointer;
  transition: color 0.16s var(--ease), background 0.16s var(--ease), border-color 0.16s var(--ease);
}
.proj-ico-knop:hover { color: var(--brand); background: var(--brand-soft); }
.proj-ico-knop--gevaar:hover { color: var(--status-laag); background: color-mix(in srgb, var(--status-laag) 14%, transparent); }
.proj-ico-knop:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.proj-ico-knop:disabled { opacity: 0.5; cursor: not-allowed; }

.proj-bevestig { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--text-2); }
.proj-hernoem { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.proj-invoer {
  flex: 1; min-width: 0; padding: 7px 10px; border-radius: 8px;
  border: 1px solid var(--line); background: var(--bg-raised); color: var(--text-1);
  font-family: inherit; font-size: 13px;
}
.proj-invoer:focus-visible { outline: 2px solid var(--brand); outline-offset: 1px; border-color: var(--brand); }

/* ── Skeleton ── */
.proj-skelet {
  display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}
@media (max-width: 560px) { .proj-skelet { grid-template-columns: 1fr; } }
.proj-skelet-kaart {
  display: grid; gap: 12px; padding: 18px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-card);
}
.proj-skelet-balk { height: 12px; border-radius: 6px; background: var(--bg-raised); animation: proj-puls 1.4s var(--ease) infinite; }
.proj-skelet-balk--titel { width: 55%; height: 16px; }
.proj-skelet-balk--bar { width: 100%; height: 6px; }
.proj-skelet-balk--kort { width: 40%; }
@keyframes proj-puls { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

@media (prefers-reduced-motion: reduce) {
  .proj-kaart, .proj-ico-knop { transition: none; }
  .proj-kaart:hover { transform: none; }
  .proj-skelet-balk { animation: none; }
}
`
