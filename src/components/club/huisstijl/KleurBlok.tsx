'use client'

import { Moon, Sun } from 'lucide-react'
import { HEX, MIN_CONTRAST_ACCENT, MIN_CONTRAST_VLAK, bruikbaarAccent, type Thema } from '@/lib/club/kern/huisstijl'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { HUISSTIJL } from '@/lib/aiyourgym/taal/woorden/club/huisstijl'

// Accentkleur en thema. Een paar sterke startkleuren, of een eigen kleur. Is
// het contrast te laag, dan zeggen we dat eerlijk en laten we zien welke
// kleur we in de app gebruiken om het leesbaar te houden.

const STARTKLEUREN = [
  { kleur: '#B58E5C', naam: 'brons' },
  { kleur: '#E8A33F', naam: 'amber' },
  { kleur: '#E5484D', naam: 'rood' },
  { kleur: '#FF6B3D', naam: 'oranje' },
  { kleur: '#30A46C', naam: 'groen' },
  { kleur: '#3E63DD', naam: 'blauw' },
  { kleur: '#8E4EC6', naam: 'paars' },
  { kleur: '#12A594', naam: 'petrol' },
] as const

interface KleurBlokProps {
  kleur: string
  thema: Thema
  onKleur: (kleur: string) => void
  onThema: (thema: Thema) => void
}

export function KleurBlok({ kleur, thema, onKleur, onThema }: KleurBlokProps) {
  const geldig = HEX.test(kleur)
  const vlak = geldig ? bruikbaarAccent(kleur, thema, MIN_CONTRAST_VLAK) : null
  const tekst = geldig ? bruikbaarAccent(kleur, thema, MIN_CONTRAST_ACCENT) : null
  const lichter = thema === 'donker'
  const t = useTekst(HUISSTIJL).kleur
  return (
    <section className="club-huisstijl-blok" aria-labelledby="kleur-kop">
      <h2 id="kleur-kop" className="club-huisstijl-kop">{t.kop}</h2>

      <div className="club-segment club-huisstijl-thema" role="group" aria-label={t.thema}>
        <button type="button" aria-pressed={thema === 'donker'} onClick={() => onThema('donker')}>
          <Moon aria-hidden size={15} /> {t.donker}
        </button>
        <button type="button" aria-pressed={thema === 'licht'} onClick={() => onThema('licht')}>
          <Sun aria-hidden size={15} /> {t.licht}
        </button>
      </div>

      <div className="club-huisstijl-stalen" role="group" aria-label={t.startkleuren}>
        {STARTKLEUREN.map((s) => (
          <button
            key={s.kleur}
            type="button"
            className="club-huisstijl-staal"
            style={{ background: s.kleur }}
            aria-label={t.namen[s.naam]}
            aria-pressed={kleur.toUpperCase() === s.kleur}
            title={t.namen[s.naam]}
            onClick={() => onKleur(s.kleur)}
          />
        ))}
      </div>

      <div className="club-formrij club-huisstijl-eigen">
        <label className="club-veld">
          <span>{t.eigen}</span>
          <span className="club-huisstijl-kleurveld">
            <input type="color" value={geldig ? kleur : '#B58E5C'} onChange={(e) => onKleur(e.target.value.toUpperCase())} aria-label={t.kiezen} />
            <input
              className="club-invoer"
              aria-label={t.code}
              aria-describedby="kleur-melding"
              value={kleur}
              maxLength={7}
              spellCheck={false}
              onChange={(e) => onKleur(e.target.value.trim().toUpperCase())}
              aria-invalid={!geldig}
            />
          </span>
        </label>
      </div>

      <div id="kleur-melding" aria-live="polite">
        {!geldig && <p className="club-melding club-melding--fout">{t.ongeldig}</p>}
        {vlak?.aangepast && (
          <p className="club-melding">
            {t.valtWeg.voor(lichter, MIN_CONTRAST_VLAK)}{' '}
            <Code kleur={vlak.kleur} />
            {t.valtWeg.na(lichter)}
          </p>
        )}
        {!vlak?.aangepast && tekst?.aangepast && (
          <p className="club-melding">
            {t.tekstAangepast.voor} <Code kleur={tekst.kleur} />
            {t.tekstAangepast.na(lichter, MIN_CONTRAST_ACCENT)}
          </p>
        )}
      </div>
    </section>
  )
}

function Code({ kleur }: { kleur: string }) {
  return (
    <span className="club-huisstijl-code">
      <span className="club-huisstijl-codestaal" style={{ background: kleur }} aria-hidden />
      {kleur}
    </span>
  )
}
