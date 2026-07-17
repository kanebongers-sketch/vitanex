'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Square, Coffee } from 'lucide-react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Knop } from '@/components/lifeos/os/Knop'
import {
  INACTIEF,
  startWerk,
  stop,
  volgendeFase,
  resterendMs,
  voortgang,
  klokTekst,
  pauzeMinutenNa,
  type FocusSessie,
} from '@/lib/lifeos/focus/focus'

// Client-eiland: een timer heeft de klok nodig, en die kent de server niet.
// Alle logica zit in `lib/focus/focus.ts` (puur, 14 tests); dit component doet
// niets anders dan de klok laten tikken en het resultaat tekenen.
//
// Bewust GEEN opslag: een focusblok dat je gisteren begon is geen focusblok.
// Zodra er een DB is kan hier een logregel bij ("3 blokken vandaag"), maar de
// timer zelf hoort nergens te overleven.

const TIK_MS = 250 // vloeiend genoeg voor de ring, goedkoop genoeg voor de accu

export function FocusKaart() {
  const [sessie, setSessie] = useState<FocusSessie>(INACTIEF)
  const [nu, setNu] = useState<number | null>(null)
  const [waaraan, setWaaraan] = useState('')

  // De klok pas ná mount lezen: de server heeft een andere tijd, en dan wijkt
  // de eerste render af van de HTML die de server stuurde (hydration-mismatch).
  const tikRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // setState in een callback (de interval), niet synchroon in de effect-body:
    // dat is de vorm die React bedoelt en die geen cascaderende render geeft.
    tikRef.current = setInterval(() => setNu(Date.now()), TIK_MS)
    return () => {
      if (tikRef.current !== null) clearInterval(tikRef.current)
    }
  }, [])

  const begin = useCallback(() => {
    setSessie(startWerk(Date.now(), waaraan.trim()))
    setNu(Date.now())
  }, [waaraan])

  const beeindig = useCallback(() => setSessie(stop()), [])

  const door = useCallback(() => {
    setSessie((s) => volgendeFase(s, Date.now()))
  }, [])

  const rest = nu === null ? null : resterendMs(sessie, nu)
  const vg = nu === null ? null : voortgang(sessie, nu)
  const klaar = rest === 0

  // `normaal`, niet `dragend`: er mag er precies één per moment dragend zijn
  // (zie os/Kaart.tsx) en dat is Vita — hij legt het verband tussen de rest.
  // Een eierwekker hoort niet de luidste stem op het scherm te zijn.
  return (
    <Kaart titel="Focus" vervangt="Pomodoro-apps" nadruk="normaal">
      {sessie.fase === 'inactief' ? (
        <div className="os-focus">
          <p className="os-focus__uitleg">
            Eén blok van 25 minuten. Wat je nú doet, niet wat er allemaal ligt.
          </p>
          <div className="os-focus__start">
            <label className="os-focus__label" htmlFor="focus-waaraan">
              Waaraan werk je?
            </label>
            <input
              id="focus-waaraan"
              className="os-focus__invoer"
              type="text"
              value={waaraan}
              onChange={(e) => setWaaraan(e.target.value)}
              placeholder="Mag leeg — soms weet je het pas als je begint"
              maxLength={80}
            />
            <Knop variant="primair" onClick={begin}>
              <Play size={14} strokeWidth={2.4} aria-hidden="true" />
              Start blok
            </Knop>
          </div>
        </div>
      ) : (
        <div className="os-focus">
          <div className="os-focus__loopt">
            {/* aria-hidden: de tijd staat hieronder al in woorden, en een
                voorleesbeurt per 250ms is onbruikbaar. */}
            <p className="os-cijfer os-focus__klok" aria-hidden="true">
              {rest === null ? '—' : klokTekst(rest)}
            </p>
            {/* Status-update: role=status meldt een fase-wissel één keer,
                zonder de focus te stelen (WCAG 4.1.3). */}
            <p className="os-focus__fase" role="status">
              {klaar
                ? sessie.fase === 'werk'
                  ? `Blok ${sessie.ronde} klaar. Neem ${pauzeMinutenNa(sessie.ronde)} minuten.`
                  : 'Pauze voorbij.'
                : sessie.fase === 'werk'
                  ? `Blok ${sessie.ronde}${sessie.waaraan ? ` — ${sessie.waaraan}` : ''}`
                  : 'Pauze'}
            </p>
          </div>

          {vg !== null ? (
            <div
              className="os-focus__balk"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(vg * 100)}
              aria-label={sessie.fase === 'werk' ? 'Voortgang focusblok' : 'Voortgang pauze'}
            >
              {/* scaleX is compositor-werk; width animeren zou per frame layout
                  triggeren (animation.md). */}
              <span className="os-focus__balk-vul" style={{ transform: `scaleX(${vg})` }} />
            </div>
          ) : null}

          <div className="os-focus__acties">
            {klaar ? (
              <Knop variant="primair" onClick={door}>
                <Coffee size={14} strokeWidth={2.4} aria-hidden="true" />
                {sessie.fase === 'werk' ? 'Start pauze' : 'Volgend blok'}
              </Knop>
            ) : null}
            <Knop onClick={beeindig}>
              <Square size={13} strokeWidth={2.4} aria-hidden="true" />
              Stoppen
            </Knop>
          </div>
        </div>
      )}
    </Kaart>
  )
}
