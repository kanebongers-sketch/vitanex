'use client'

// De Vandaag-kaart zelf: kop, feiten, hooguit drie acties. Puur presentational —
// wat er op staat komt uit src/lib/vandaag/regels.ts, wat je kiest gaat via props.

import Link from 'next/link'
import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { Actie, Kaart } from '@/lib/vandaag/types'

export type Keuze = 'oke' | 'later' | 'nee'

const ADVIES_TEKST = { zoals_gepland: 'Zoals gepland', lichter: 'Lichter dan gepland', rust: 'Rustdag in plaats van training' } as const

function datumTekst(datum: string): string {
  const tekst = new Date(`${datum}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
  return tekst.charAt(0).toUpperCase() + tekst.slice(1)
}

interface ActieRijProps {
  actie: Actie
  keuze: Keuze | undefined
  onKies: (actie: Actie, keuze: Keuze) => void
}

function ActieRij({ actie, keuze, onKies }: ActieRijProps) {
  const [toonWaarom, setToonWaarom] = useState(false)
  const klaar = keuze === 'oke'
  const overgeslagen = keuze === 'nee'

  return (
    <li
      style={{
        display: 'grid',
        gap: 10,
        padding: '18px 0',
        borderTop: '1px solid var(--border)',
        opacity: overgeslagen ? 0.55 : 1,
        transition: 'opacity 200ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span
          aria-hidden
          style={{
            marginTop: 7,
            width: 8,
            height: 8,
            borderRadius: 999,
            flex: 'none',
            background: klaar ? 'var(--brand)' : 'transparent',
            border: '1.5px solid var(--brand)',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.35 }}>{actie.titel}</p>
          <button
            type="button"
            aria-expanded={toonWaarom}
            onClick={() => setToonWaarom((w) => !w)}
            className="mf-vandaag-link"
            style={{ background: 'none', border: 0, padding: 0, marginTop: 4, fontSize: 13, color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {toonWaarom ? 'Verberg waarom' : 'Waarom?'}
          </button>
          {toonWaarom && <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>{actie.waarom}</p>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, paddingLeft: 20, flexWrap: 'wrap' }}>
        <ActieKnop actie={actie} keuze={keuze} onKies={onKies} />
        {actie.knop !== 'checkin' && actie.knop !== 'plan' && !klaar && (
          <button
            type="button"
            onClick={() => onKies(actie, 'nee')}
            aria-pressed={overgeslagen}
            className="mf-pressable mf-vandaag-knop"
            style={knopStijl(false)}
          >
            <X size={15} aria-hidden /> Niet vandaag
          </button>
        )}
      </div>
    </li>
  )
}

function knopStijl(primair: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    padding: '0 16px',
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    textDecoration: 'none',
    color: primair ? 'var(--bg-app)' : 'var(--text-2)',
    background: primair ? 'var(--brand)' : 'transparent',
    border: `1px solid ${primair ? 'var(--brand)' : 'var(--border-strong)'}`,
  }
}

function ActieKnop({ actie, keuze, onKies }: ActieRijProps) {
  if (actie.knop === 'checkin') {
    return <a href="#checkin" className="mf-pressable mf-vandaag-knop" style={knopStijl(true)}>Inchecken</a>
  }
  if (actie.knop === 'plan') {
    return <Link href="/1/plan" className="mf-pressable mf-vandaag-knop" style={knopStijl(true)}>Plan invullen</Link>
  }
  if (keuze === 'oke') {
    return (
      <button type="button" onClick={() => onKies(actie, 'later')} className="mf-pressable mf-vandaag-knop" style={knopStijl(false)} aria-label={`${actie.titel}: gedaan, tik om ongedaan te maken`}>
        <Check size={15} aria-hidden style={{ color: 'var(--brand)' }} /> Gedaan
      </button>
    )
  }
  return (
    <button type="button" onClick={() => onKies(actie, 'oke')} className="mf-pressable mf-vandaag-knop" style={knopStijl(true)}>
      <Check size={15} aria-hidden /> Doe ik
    </button>
  )
}

interface VandaagKaartProps {
  kaart: Kaart
  gekozen: Readonly<Record<string, Keuze>>
  onKies: (actie: Actie, keuze: Keuze) => void
}

export function VandaagKaart({ kaart, gekozen, onKies }: VandaagKaartProps) {
  return (
    <article aria-labelledby="vandaag-kop" style={{ display: 'grid', gap: 28 }}>
      <header style={{ display: 'grid', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)' }}>
          {datumTekst(kaart.datum)}
        </p>
        <h1 id="vandaag-kop" style={{ margin: 0, fontSize: 'clamp(32px, 8vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.02em', fontWeight: 600, color: 'var(--text-1)' }}>
          {kaart.kop}
        </h1>
      </header>

      {kaart.feiten.length > 0 && (
        <section aria-label="Waar de kaart op rust">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {kaart.feiten.map((feit) => (
              <li key={feit} style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.5 }}>{feit}</li>
            ))}
          </ul>
        </section>
      )}

      {kaart.training && (
        <section aria-label="Training vandaag" style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Training</p>
          <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 600, color: 'var(--text-1)' }}>
            {kaart.training.soort}{kaart.training.tijd ? ` · ${kaart.training.tijd}` : ''}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 14, color: kaart.training.advies === 'zoals_gepland' ? 'var(--text-2)' : 'var(--brand)' }}>
            {ADVIES_TEKST[kaart.training.advies]}
          </p>
        </section>
      )}

      {kaart.acties.length > 0 && (
        <section aria-labelledby="acties-kop">
          <h2 id="acties-kop" style={{ margin: '0 0 4px', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 500 }}>
            Wat telt vandaag
          </h2>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {kaart.acties.map((actie) => (
              <ActieRij key={actie.id} actie={actie} keuze={gekozen[actie.id]} onKies={onKies} />
            ))}
          </ol>
        </section>
      )}
    </article>
  )
}
