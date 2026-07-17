import type { ReactNode } from 'react'

// ─── Eén levensdomein ───────────────────────────────────────────────────────
// De bouwsteen van "Mijn leven". Nadrukkelijk NIET `Kaart`:
//
//   - `Kaart` vraagt om `vervangt` — welke app deze kaart overbodig maakt. Dat
//     is de gouden regel van de cockpit en hij werkt: "Water · vervangt
//     MyFitnessPal". Maar "Gezondheid" vervangt geen app; het is de la waar die
//     apps ín liggen. Een `vervangt` verzinnen om de vorm te halen zou precies
//     de soort halve waarheid zijn die dit project niet wil.
//   - Een domein en een tool horen niet hetzelfde te zien. Zelfde vorm =
//     dezelfde rang, en dan is het weer een raster van gelijke vakjes.
//
// Puur presentational: geen fetch, geen state, geen 'use client'. De domeinen
// die data nodig hebben zijn zelf het client-eiland.
//
// Zoals `Kaart` weet deze component niets van zijn plek in het raster — geen
// `breed`-prop. Dat hoort bij `MijnLeven`, anders weet een domein iets over de
// pagina waar het op staat.

interface DomeinSectieProps {
  titel: string
  /** Wat er onder dit domein valt. Eén zin, geen belofte. */
  definitie: string
  /** Kopniveau. 3 onder de "Mijn leven"-h2 — nooit een sprong. */
  niveau?: 2 | 3
  children: ReactNode
}

export function DomeinSectie({ titel, definitie, niveau = 3, children }: DomeinSectieProps) {
  const Kop = niveau === 2 ? 'h2' : 'h3'

  return (
    <section className="os-domein">
      <header className="os-domein__kop">
        <Kop className="os-domein__titel">{titel}</Kop>
        <p className="os-domein__definitie">{definitie}</p>
      </header>
      {children}
    </section>
  )
}

interface StatProps {
  /**
   * De waarde als tekst, want "—" is een geldige uitkomst. Een `number | null`
   * zou elke gebruiker dwingen zelf te bedenken wat null wordt — en dan wordt
   * het ergens een 0, en dan liegt het scherm.
   */
  waarde: string
  naam: string
  /** Context onder de waarde. Bijv. "van 6 gemeten". */
  detail?: string
  /** Alleen als de waarde écht een status draagt. Anders inkt. */
  kleur?: string
}

/** Eén getal met zijn naam. De bouwsteen van elk domein-overzicht. */
export function Stat({ waarde, naam, detail, kleur }: StatProps) {
  return (
    <div className="os-stat">
      <span className="os-stat__waarde os-cijfer" style={kleur ? { color: kleur } : undefined}>
        {waarde}
      </span>
      <span className="os-stat__naam">{naam}</span>
      {detail ? <span className="os-stat__detail">{detail}</span> : null}
    </div>
  )
}

export function StatRij({ children }: { children: ReactNode }) {
  return <div className="os-statrij">{children}</div>
}
