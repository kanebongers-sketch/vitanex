'use client'

// ════════════════════════════════════════════════════════════════════════════
// Scoped styles voor het Vita-intakegesprek. Eén <style>-blok, alle waarden via
// tokens uit globals.css. Bevat de hover/focus/active-states die inline styles
// niet kunnen leveren (cyan focus-ring), plus reduced-motion-gedrag.
// ════════════════════════════════════════════════════════════════════════════

export function GesprekStyles() {
  return (
    <style>{`
      .vita-intake {
        min-height: 100vh;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 40px 16px 64px;
        background:
          radial-gradient(1100px 620px at 50% -8%, color-mix(in srgb, var(--mentaforce-primary) 9%, transparent), transparent 62%),
          var(--bg-app);
      }
      .vita-intake-kaart {
        position: relative;
        width: 100%;
        max-width: 560px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-card), 0 24px 60px rgba(0,0,0,0.4);
        padding: 36px 32px 40px;
        overflow: hidden;
      }
      .vita-intake-kaart > * { position: relative; z-index: 1; }

      /* ── Woordmerk ──────────────────────────────────────────── */
      .vita-merk {
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 26px; flex-wrap: wrap;
      }
      .vita-merk-woord {
        font-size: 15px; font-weight: 800; letter-spacing: 0.02em;
        color: var(--text-1);
      }
      .vita-merk-stip { color: var(--mentaforce-primary); }
      .vita-merk-badge {
        font-size: 11px; font-weight: 700; padding: 3px 10px;
        border-radius: 9999px; letter-spacing: 0.02em;
        background: var(--mentaforce-primary-light);
        color: var(--mentaforce-primary);
      }

      /* ── Foutmelding ────────────────────────────────────────── */
      .vita-fout {
        padding: 11px 14px; border-radius: var(--radius-sm); margin-bottom: 18px;
        background: color-mix(in srgb, #E24B4A 14%, transparent);
        border: 1px solid color-mix(in srgb, #E24B4A 42%, transparent);
        font-size: 13px; color: #ff9d9c; font-weight: 600;
      }

      /* ── Bullet-punten (welkom) ─────────────────────────────── */
      .vita-punten { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
      .vita-punten li {
        display: flex; align-items: center; gap: 12px;
        font-size: 14px; color: var(--text-2); line-height: 1.4;
      }
      .vita-punt-check {
        flex-shrink: 0; width: 24px; height: 24px; border-radius: 8px;
        display: inline-flex; align-items: center; justify-content: center;
        background: var(--mentaforce-primary-light); color: var(--mentaforce-primary);
      }

      /* ── Samenvatting (klaar) ───────────────────────────────── */
      .vita-samenvatting { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      .vita-samenvatting li {
        display: flex; align-items: center; gap: 12px;
        padding: 11px 14px; border-radius: var(--radius-md);
        background: var(--bg-subtle); border: 1px solid var(--border);
        font-size: 13.5px; font-weight: 600; color: var(--text-1);
      }
      .vita-samenvatting-icoon {
        flex-shrink: 0; width: 26px; height: 26px; border-radius: 8px;
        display: inline-flex; align-items: center; justify-content: center;
        background: var(--mentaforce-primary-light); color: var(--mentaforce-primary);
      }

      /* ── Keuzekaart ─────────────────────────────────────────── */
      .vita-kaart-grid { display: grid; gap: 10px; }
      @media (max-width: 460px) { .vita-kaart-grid { grid-template-columns: 1fr !important; } }
      .vita-keuze-kaart {
        position: relative; display: block; width: 100%; text-align: left;
        padding: 14px 16px; border-radius: var(--radius-md); cursor: pointer;
        background: var(--bg-subtle); border: 1.5px solid var(--border);
        transition: border-color 0.15s var(--ease), background 0.15s var(--ease), transform 0.15s var(--ease);
      }
      .vita-keuze-kaart:hover { border-color: var(--border-strong); transform: translateY(-1px); }
      .vita-keuze-kaart[data-actief="true"] {
        border-color: var(--mentaforce-primary);
        background: var(--mentaforce-primary-light);
      }
      .vita-keuze-kaart:focus-visible {
        outline: 2px solid var(--mentaforce-primary); outline-offset: 2px;
      }
      .vita-kaart-icoon {
        flex-shrink: 0; width: 38px; height: 38px; border-radius: 10px;
        display: inline-flex; align-items: center; justify-content: center;
        background: var(--bg-card); color: var(--mentaforce-primary);
        border: 1px solid var(--border);
      }
      .vita-keuze-kaart[data-actief="true"] .vita-kaart-icoon {
        background: var(--mentaforce-primary); color: var(--bg-app); border-color: transparent;
      }
      .vita-kaart-badge {
        position: absolute; top: -8px; right: 12px;
        font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px;
        background: var(--mentaforce-primary); color: var(--bg-app);
      }

      /* ── Chips ──────────────────────────────────────────────── */
      .vita-chip {
        padding: 8px 15px; border-radius: 9999px; font-size: 13px; font-weight: 500;
        background: var(--bg-subtle); border: 1.5px solid var(--border); color: var(--text-2);
        transition: border-color 0.12s var(--ease), background 0.12s var(--ease), color 0.12s var(--ease);
      }
      .vita-chip:hover:not(:disabled) { border-color: var(--border-strong); color: var(--text-1); }
      .vita-chip[data-actief="true"] {
        border-color: var(--mentaforce-primary);
        background: var(--mentaforce-primary-light);
        color: var(--mentaforce-primary); font-weight: 700;
      }
      .vita-chip:focus-visible { outline: 2px solid var(--mentaforce-primary); outline-offset: 2px; }

      /* ── Emoji-schaal ───────────────────────────────────────── */
      .vita-schaal-knop {
        flex: 1; padding: 10px 4px; border-radius: var(--radius-sm); cursor: pointer;
        background: var(--bg-subtle); border: 2px solid var(--border);
        transition: border-color 0.15s var(--ease), background 0.15s var(--ease), transform 0.15s var(--ease);
      }
      .vita-schaal-knop:hover { border-color: var(--border-strong); }
      .vita-schaal-knop[data-actief="true"] {
        border-color: var(--mentaforce-primary);
        background: var(--mentaforce-primary-light);
        transform: scale(1.08);
      }
      .vita-schaal-knop:focus-visible { outline: 2px solid var(--mentaforce-primary); outline-offset: 2px; }

      /* ── Tekst-invoer ───────────────────────────────────────── */
      .vita-input {
        width: 100%; box-sizing: border-box;
        padding: 12px 15px; font-size: 15px; font-family: inherit;
        border-radius: var(--radius-md); outline: none; color: var(--text-1);
        background: var(--bg-subtle); border: 1.5px solid var(--border);
        transition: border-color 0.15s var(--ease), box-shadow 0.15s var(--ease);
      }
      .vita-input::placeholder { color: var(--text-4); }
      .vita-input:hover { border-color: var(--border-strong); }
      .vita-input:focus-visible, .vita-input:focus {
        border-color: var(--mentaforce-primary);
        box-shadow: 0 0 0 3px var(--mentaforce-primary-light);
      }
      /* Kalender-icoon in date-inputs zichtbaar houden op donker */
      .vita-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.8); cursor: pointer; }

      /* ── Knoppen ────────────────────────────────────────────── */
      .vita-knop {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        padding: 12px 22px; border-radius: var(--radius-btn); font-size: 14px; font-weight: 700;
        font-family: inherit; cursor: pointer; border: 1.5px solid transparent;
        transition: background 0.15s var(--ease), border-color 0.15s var(--ease), opacity 0.15s var(--ease), transform 0.1s ease;
      }
      .vita-knop:active { transform: scale(0.98); }
      .vita-knop:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
      .vita-knop:focus-visible { outline: 2px solid var(--mentaforce-primary); outline-offset: 2px; }
      .vita-knop-primary {
        background: var(--mentaforce-primary); color: var(--bg-app);
      }
      .vita-knop-primary:hover:not(:disabled) { background: var(--mentaforce-primary-dark); }
      .vita-knop-ghost {
        background: transparent; color: var(--text-2); border-color: var(--border);
      }
      .vita-knop-ghost:hover { border-color: var(--border-strong); color: var(--text-1); }
      .vita-knop-blok { width: 100%; padding: 15px; font-size: 15px; }

      .vita-overslaan {
        background: none; border: none; cursor: pointer; padding: 4px 2px;
        font-size: 12.5px; color: var(--text-4); font-family: inherit;
        text-decoration: underline; text-underline-offset: 3px;
        transition: color 0.15s var(--ease);
      }
      .vita-overslaan:hover { color: var(--text-2); }
      .vita-overslaan:focus-visible { outline: 2px solid var(--mentaforce-primary); outline-offset: 2px; border-radius: 4px; }

      @media (prefers-reduced-motion: reduce) {
        .vita-keuze-kaart, .vita-chip, .vita-schaal-knop, .vita-input, .vita-knop {
          transition: none !important;
        }
        .vita-keuze-kaart:hover, .vita-schaal-knop[data-actief="true"] { transform: none !important; }
        .vita-knop:active { transform: none !important; }
      }
    `}</style>
  )
}
