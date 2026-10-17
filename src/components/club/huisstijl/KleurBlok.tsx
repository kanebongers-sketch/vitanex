'use client'

import { Moon, Sun } from 'lucide-react'
import { HEX, MIN_CONTRAST_ACCENT, bruikbaarAccent, contrast, THEMA_BASIS, type Thema } from '@/lib/club/kern/huisstijl'

// Accentkleur en thema. Een paar sterke startkleuren, of een eigen kleur. Is
// het contrast te laag, dan zeggen we dat eerlijk en laten we zien welke
// kleur we in de app gebruiken om het leesbaar te houden.

const STARTKLEUREN = [
  { kleur: '#B58E5C', naam: 'Brons' },
  { kleur: '#E8A33F', naam: 'Amber' },
  { kleur: '#E5484D', naam: 'Rood' },
  { kleur: '#FF6B3D', naam: 'Oranje' },
  { kleur: '#30A46C', naam: 'Groen' },
  { kleur: '#3E63DD', naam: 'Blauw' },
  { kleur: '#8E4EC6', naam: 'Paars' },
  { kleur: '#12A594', naam: 'Petrol' },
]

interface KleurBlokProps {
  kleur: string
  thema: Thema
  onKleur: (kleur: string) => void
  onThema: (thema: Thema) => void
}

export function KleurBlok({ kleur, thema, onKleur, onThema }: KleurBlokProps) {
  const geldig = HEX.test(kleur)
  const getoond = geldig ? bruikbaarAccent(kleur, thema) : null
  const verhouding = geldig ? contrast(kleur, THEMA_BASIS[thema].bgApp) : 0
  return (
    <section className="club-huisstijl-blok" aria-labelledby="kleur-kop">
      <h2 id="kleur-kop" className="club-huisstijl-kop">Kleuren</h2>

      <div className="club-segment club-huisstijl-thema" role="group" aria-label="Thema">
        <button type="button" aria-pressed={thema === 'donker'} onClick={() => onThema('donker')}>
          <Moon aria-hidden size={15} /> Donker
        </button>
        <button type="button" aria-pressed={thema === 'licht'} onClick={() => onThema('licht')}>
          <Sun aria-hidden size={15} /> Licht
        </button>
      </div>

      <div className="club-huisstijl-stalen" role="group" aria-label="Startkleuren">
        {STARTKLEUREN.map((s) => (
          <button
            key={s.kleur}
            type="button"
            className="club-huisstijl-staal"
            style={{ background: s.kleur }}
            aria-label={s.naam}
            aria-pressed={kleur.toUpperCase() === s.kleur}
            title={s.naam}
            onClick={() => onKleur(s.kleur)}
          />
        ))}
      </div>

      <div className="club-formrij club-huisstijl-eigen">
        <label className="club-veld">
          <span>Eigen kleur</span>
          <span className="club-huisstijl-kleurveld">
            <input type="color" value={geldig ? kleur : '#B58E5C'} onChange={(e) => onKleur(e.target.value.toUpperCase())} aria-label="Kleur kiezen" />
            <input
              className="club-invoer"
              value={kleur}
              maxLength={7}
              spellCheck={false}
              onChange={(e) => onKleur(e.target.value.trim().toUpperCase())}
              aria-invalid={!geldig}
            />
          </span>
        </label>
      </div>

      {!geldig && <p className="club-melding club-melding--fout" role="alert">Schrijf de kleur als # en zes tekens, bijvoorbeeld #B58E5C.</p>}
      {getoond?.aangepast && (
        <p className="club-melding" role="status">
          Deze kleur valt weg tegen de {thema === 'donker' ? 'donkere' : 'lichte'} achtergrond (contrast {verhouding.toFixed(1)}:1, minimaal {MIN_CONTRAST_ACCENT}:1).
          In de app gebruiken we daarom <span className="club-huisstijl-code" style={{ color: getoond.kleur }}>{getoond.kleur}</span>, zodat knoppen en lijnen leesbaar blijven.
        </p>
      )}
    </section>
  )
}
