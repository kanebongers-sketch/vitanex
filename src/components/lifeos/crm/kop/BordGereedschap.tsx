'use client'

// ─── LifeOS — CRM: bord-gereedschap (zoeken · filteren · sorteren) ──────────
// De gereedschapsbalk boven het kanban. Puur presentational: krijgt de keuze +
// callbacks, houdt zelf geen state (die zit in `useBordWeergave`). Drie controls:
//   • zoekveld (naam / mail / telefoon / bijzonderheden — matcht `weergave.ts`)
//   • "Alleen opvolgen"-schakelaar (echte role="switch")
//   • sorteer-select uit `SORTERINGEN`
// Alle drie met zichtbare cyaan focus-ring; op smal wrappen ze netjes.

import { ChevronDown, Search } from 'lucide-react'
import { SORTERINGEN, type Sortering, type WeergaveKeuze } from '@/components/lifeos/crm/weergave'

interface BordGereedschapProps {
  keuze: WeergaveKeuze
  onZoek: (zoek: string) => void
  onAlleenOpvolgen: (aan: boolean) => void
  onSortering: (s: Sortering) => void
}

const ZOEK_ID = 'crm-kop-zoek'
const SORT_ID = 'crm-kop-sortering'

export function BordGereedschap({ keuze, onZoek, onAlleenOpvolgen, onSortering }: BordGereedschapProps) {
  return (
    <div className="crm-kop__balk">
      <style>{STIJL}</style>

      <div className="crm-kop__zoek">
        <label htmlFor={ZOEK_ID} className="crm-kop__sr">Zoek in dit bord</label>
        <Search className="crm-kop__zoek-icoon" size={16} strokeWidth={2} aria-hidden="true" />
        <input
          id={ZOEK_ID}
          type="search"
          className="crm-kop__zoek-veld"
          placeholder="Zoek op naam, mail, telefoon…"
          value={keuze.zoek}
          onChange={(e) => onZoek(e.target.value)}
        />
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={keuze.alleenOpvolgen}
        className="crm-kop__schakel"
        onClick={() => onAlleenOpvolgen(!keuze.alleenOpvolgen)}
      >
        <span className="crm-kop__schakel-spoor" aria-hidden="true">
          <span className="crm-kop__schakel-knop" />
        </span>
        <span className="crm-kop__schakel-tekst">Alleen opvolgen</span>
      </button>

      <div className="crm-kop__sorteer">
        <label htmlFor={SORT_ID} className="crm-kop__sr">Sorteer het bord</label>
        <select
          id={SORT_ID}
          className="crm-kop__sorteer-veld"
          value={keuze.sortering}
          onChange={(e) => onSortering(e.target.value as Sortering)}
        >
          {SORTERINGEN.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <ChevronDown className="crm-kop__sorteer-pijl" size={16} strokeWidth={2} aria-hidden="true" />
      </div>
    </div>
  )
}

const STIJL = `
.crm-kop__balk {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.crm-kop__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Zoekveld — groeit mee, wrapt als eerste af op smal. */
.crm-kop__zoek {
  position: relative;
  flex: 1 1 220px;
  min-width: 180px;
}
.crm-kop__zoek-icoon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-4);
  pointer-events: none;
}
.crm-kop__zoek-veld {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 36px;
  font: inherit;
  font-size: 14px;
  color: var(--text-1);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  transition: border-color 160ms var(--ease);
}
.crm-kop__zoek-veld::placeholder { color: var(--text-4); }
.crm-kop__zoek-veld:hover { border-color: var(--border-strong); }
.crm-kop__zoek-veld:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
  border-color: color-mix(in srgb, var(--brand) 45%, transparent);
}

/* "Alleen opvolgen"-schakelaar — echte role="switch", cyaan wanneer aan. */
.crm-kop__schakel {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 14px 0 10px;
  font: inherit;
  font-size: 13px;
  color: var(--text-2);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  cursor: pointer;
  transition: border-color 160ms var(--ease), color 160ms var(--ease);
}
.crm-kop__schakel:hover { border-color: var(--border-strong); }
.crm-kop__schakel:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.crm-kop__schakel[aria-checked='true'] {
  color: var(--text-1);
  border-color: color-mix(in srgb, var(--brand) 45%, transparent);
}
.crm-kop__schakel-spoor {
  position: relative;
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: var(--border-strong);
  transition: background-color 160ms var(--ease);
}
.crm-kop__schakel[aria-checked='true'] .crm-kop__schakel-spoor { background: var(--brand); }
.crm-kop__schakel-knop {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--text-1);
  transition: transform 160ms var(--ease);
}
.crm-kop__schakel[aria-checked='true'] .crm-kop__schakel-knop { transform: translateX(14px); }

/* Sorteer-select — eigen chevron, native pijl weg. */
.crm-kop__sorteer {
  position: relative;
  flex: 0 1 auto;
}
.crm-kop__sorteer-veld {
  height: 40px;
  max-width: 100%;
  padding: 0 34px 0 12px;
  font: inherit;
  font-size: 13px;
  color: var(--text-1);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-btn);
  appearance: none;
  cursor: pointer;
  transition: border-color 160ms var(--ease);
}
.crm-kop__sorteer-veld:hover { border-color: var(--border-strong); }
.crm-kop__sorteer-veld:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
  border-color: color-mix(in srgb, var(--brand) 45%, transparent);
}
.crm-kop__sorteer-pijl {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
}

/* Reduced motion: geen niet-essentiële beweging. */
@media (prefers-reduced-motion: reduce) {
  .crm-kop__zoek-veld,
  .crm-kop__schakel,
  .crm-kop__schakel-spoor,
  .crm-kop__schakel-knop,
  .crm-kop__sorteer-veld {
    transition: none;
  }
}
`
