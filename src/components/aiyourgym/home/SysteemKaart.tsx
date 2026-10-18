'use client'

import { useState, type ComponentType } from 'react'
import { CalendarDays, ChartColumn, Check, Dumbbell, ScanLine, Smartphone } from 'lucide-react'
import { GEDEELD, MOMENT, ROLLEN, type RolSleutel } from '@/components/aiyourgym/inhoud/systeem'

// Vijf plekken in een club, een systeem in het midden. Kies een plek (in het
// schema of in de tijdlijn eronder) en zie wat die plek in Club doet. De lijn
// naar het midden licht op: iedereen werkt in dezelfde gegevens.

const ICOON: Record<RolSleutel, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  balie: ScanLine,
  vloer: CalendarDays,
  trainer: Dumbbell,
  eigenaar: ChartColumn,
  lid: Smartphone,
}

/** Plek van elke rol in het schema (viewBox 100 x 80, midden op 50,40). */
const PLEK: Record<RolSleutel, { x: number; y: number }> = {
  balie: { x: 50, y: 8 },
  vloer: { x: 90, y: 31 },
  trainer: { x: 77, y: 72 },
  eigenaar: { x: 23, y: 72 },
  lid: { x: 10, y: 31 },
}

const MIDDEN = { x: 50, y: 40 }

export function SysteemKaart() {
  const [actief, setActief] = useState<RolSleutel>('balie')
  const rol = ROLLEN.find((r) => r.sleutel === actief) ?? ROLLEN[0]
  const Icoon = ICOON[rol.sleutel]

  return (
    <div className="ayg-sys">
      <div className="ayg-sys-boven">
        <div className="ayg-sys-kaart">
          <svg className="ayg-sys-lijnen" viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden>
            {ROLLEN.map((r) => {
              const p = PLEK[r.sleutel]
              const pad = `M${p.x} ${p.y} L${MIDDEN.x} ${MIDDEN.y}`
              const aan = r.sleutel === actief
              return (
                <g key={r.sleutel} data-aan={aan ? '' : undefined}>
                  <path d={pad} vectorEffect="non-scaling-stroke" />
                  {aan && (
                    <circle r="0.9" className="ayg-sys-puls">
                      <animateMotion dur="1.8s" repeatCount="indefinite" path={pad} />
                    </circle>
                  )}
                </g>
              )
            })}
          </svg>
          <div className="ayg-sys-kern">
            <span className="ayg-sys-kern-label">Een systeem</span>
            <strong>Club</strong>
            <span className="ayg-sys-kern-adres">voorbeeldgym.aiyourgym.com</span>
            <span className="ayg-sys-gedeeld">
              {GEDEELD.map((g) => (
                <i key={g}>{g}</i>
              ))}
            </span>
          </div>
          {ROLLEN.map((r) => {
            const I = ICOON[r.sleutel]
            const p = PLEK[r.sleutel]
            return (
              <button
                key={r.sleutel}
                type="button"
                className="ayg-sys-knoop"
                style={{ left: `${p.x}%`, top: `${(p.y / 80) * 100}%` }}
                aria-pressed={r.sleutel === actief}
                onClick={() => setActief(r.sleutel)}
              >
                <I size={18} aria-hidden />
                <span>{r.naam}</span>
              </button>
            )
          })}
        </div>
        <div className="ayg-sys-detail" aria-live="polite">
          <span className="ayg-sys-detail-icoon">
            <Icoon size={22} aria-hidden />
          </span>
          <p className="ayg-label ayg-label--accent">{rol.naam}</p>
          <h3 className="ayg-h3">{rol.kop}</h3>
          <ul>
            {rol.punten.map((p) => (
              <li key={p}>
                <Check size={15} aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="ayg-sys-detail-voet">Alles wat hier gebeurt, zien de andere vier meteen. Niets hoeft te worden overgetypt.</p>
        </div>
      </div>
      <div className="ayg-sys-moment">
        <p className="ayg-sys-moment-kop">
          Een avond in de club, gevolgd over vijf plekken <span>(voorbeeld)</span>
        </p>
        <ol>
          {MOMENT.map((m) => {
            const naam = ROLLEN.find((r) => r.sleutel === m.rol)?.naam ?? ''
            return (
              <li key={m.tijd}>
                <button type="button" aria-pressed={m.rol === actief} onClick={() => setActief(m.rol)}>
                  <span className="ayg-sys-moment-tijd">
                    {m.tijd} · {naam}
                  </span>
                  <span>{m.tekst}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
