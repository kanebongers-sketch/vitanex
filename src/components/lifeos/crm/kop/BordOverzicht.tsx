'use client'

// ─── LifeOS — CRM: bord-overzicht (statistiek-strip) ────────────────────────
// Vier compacte stat-tegels boven het kanban: Totaal · Opvolgen · Actief · Koud.
// Puur presentational: cijfers in, UI eruit. De cijfers komen uit `bouwOverzicht`
// (overzicht.ts) — echte tellingen, geen verzonnen statistiek.
//
// Accent-regels (strikt twee-tonig): cyaan UITSLUITEND op Opvolgen als het > 0 is
// (dat vraagt nú actie); Koud krijgt bij > 0 een rustig waarschuwings-accent.
// Totaal en Actief blijven altijd neutraal.

import { CalendarClock, Snowflake, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import type { BordOverzicht as BordOverzichtData } from '@/components/lifeos/crm/overzicht'

interface BordOverzichtProps {
  overzicht: BordOverzichtData
}

type Accent = 'geen' | 'actie' | 'waarschuwing'

interface StatTegel {
  key: string
  label: string
  waarde: number
  Icoon: LucideIcon
  accent: Accent
}

/** Bouwt de vier tegels + hun accent uit de tellingen. Accent alleen bij een cijfer > 0. */
function bouwTegels(o: BordOverzichtData): readonly StatTegel[] {
  return [
    { key: 'totaal', label: 'Totaal', waarde: o.totaal, Icoon: Users, accent: 'geen' },
    { key: 'opvolgen', label: 'Opvolgen', waarde: o.opvolgen, Icoon: CalendarClock, accent: o.opvolgen > 0 ? 'actie' : 'geen' },
    { key: 'actief', label: 'Actief', waarde: o.actief, Icoon: TrendingUp, accent: 'geen' },
    { key: 'koud', label: 'Koud', waarde: o.koud, Icoon: Snowflake, accent: o.koud > 0 ? 'waarschuwing' : 'geen' },
  ]
}

export function BordOverzicht({ overzicht }: BordOverzichtProps) {
  const tegels = bouwTegels(overzicht)

  return (
    <section className="crm-kop__overzicht" aria-label="Bord in cijfers">
      <style>{STIJL}</style>

      <ul className="crm-kop__stats">
        {tegels.map(({ key, label, waarde, Icoon, accent }) => (
          <li key={key} className={`crm-kop__stat${accent === 'geen' ? '' : ` crm-kop__stat--${accent}`}`}>
            <Icoon className="crm-kop__stat-icoon" size={16} strokeWidth={2} aria-hidden="true" />
            <span className="crm-kop__stat-label">{label}</span>
            <span className="crm-kop__stat-waarde">{waarde}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

const STIJL = `
.crm-kop__overzicht {
  margin: 0;
}
.crm-kop__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
@media (min-width: 560px) {
  .crm-kop__stats { grid-template-columns: repeat(4, 1fr); }
}

/* Groep = één tegel. column-reverse zet het grote cijfer visueel bóven het label,
   terwijl de leesvolgorde (label → cijfer) voor screenreaders logisch blijft. */
.crm-kop__stat {
  position: relative;
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}
.crm-kop__stat-icoon {
  position: absolute;
  top: 12px;
  right: 12px;
  color: var(--text-4);
}
.crm-kop__stat-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
}
.crm-kop__stat-waarde {
  margin: 0;
  font-size: clamp(1.6rem, 1.2rem + 1.4vw, 2.1rem);
  font-weight: 600;
  line-height: 1.05;
  color: var(--text-1);
  font-variant-numeric: tabular-nums;
}

/* Opvolgen > 0 — cyaan: dit vraagt nú actie. */
.crm-kop__stat--actie {
  background: var(--brand-soft);
  border-color: color-mix(in srgb, var(--brand) 45%, transparent);
}
.crm-kop__stat--actie .crm-kop__stat-waarde { color: var(--brand); }
.crm-kop__stat--actie .crm-kop__stat-icoon { color: var(--brand); }

/* Koud > 0 — rustig waarschuwings-accent. */
.crm-kop__stat--waarschuwing {
  background: var(--status-warning-soft);
  border-color: color-mix(in srgb, var(--status-warning) 40%, transparent);
}
.crm-kop__stat--waarschuwing .crm-kop__stat-waarde { color: var(--status-warning); }
.crm-kop__stat--waarschuwing .crm-kop__stat-icoon { color: var(--status-warning); }
`
