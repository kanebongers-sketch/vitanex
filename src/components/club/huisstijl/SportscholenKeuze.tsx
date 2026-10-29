'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { HUISSTIJL } from '@/lib/aiyourgym/taal/woorden/club/huisstijl'

// Wisselen tussen sportscholen. Na het wisselen laadt heel Club opnieuw met de
// data en huisstijl van de gekozen sportschool (de data is strikt gescheiden).

interface Sportschool {
  id: string
  naam: string
  demo: boolean
  kleurAccent: string
}

interface SportscholenKeuzeProps {
  actief: string
  sportscholen: Sportschool[]
}

export function SportscholenKeuze({ actief, sportscholen }: SportscholenKeuzeProps) {
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [nieuw, setNieuw] = useState<string | null>(null)
  const tekst = useTekst(HUISSTIJL)
  const t = tekst.scholen
  const nieuwKnop = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  // Na annuleren of aanmaken gaat de focus terug naar de knop "Nieuwe sportschool".
  useEffect(() => {
    if (nieuw === null && wasOpen.current) nieuwKnop.current?.focus()
    wasOpen.current = nieuw !== null
  }, [nieuw])

  async function open(id: string) {
    setBezig(id)
    setFout(null)
    const uit = await stuur('/api/club/organisatie/wissel', 'POST', { id })
    if (!uit.ok) {
      setBezig(null)
      return setFout(uit.fout)
    }
    // Heel Club opnieuw laden: menu, huisstijl en vestigingen horen bij de nieuwe sportschool.
    window.location.assign('/club/huisstijl')
  }

  // Een slot dat meteen dicht gaat, zodat twee snelle klikken niet twee keer aanmaken.
  const slot = useRef(false)

  async function maak() {
    const naam = (nieuw ?? '').trim()
    if (!naam || slot.current) return
    slot.current = true
    setBezig('nieuw')
    setFout(null)
    const uit = await stuur('/api/club/organisatie/nieuw', 'POST', { naam })
    slot.current = false
    setBezig(null)
    if (!uit.ok) return setFout(uit.fout)
    setNieuw(null)
    window.location.assign('/club/instellingen/vestigingen')
  }

  return (
    <section className="club-huisstijl-scholen" aria-labelledby="sportscholen-kop">
      <h2 id="sportscholen-kop" className="club-huisstijl-kop">{t.kop}</h2>
      <ul>
        {sportscholen.map((s) => {
          const isActief = s.id === actief
          return (
            <li key={s.id}>
              <button
                type="button"
                className="club-huisstijl-school"
                aria-current={isActief ? 'true' : undefined}
                disabled={isActief || bezig !== null}
                onClick={() => void open(s.id)}
              >
                <span className="club-huisstijl-stip" style={{ background: s.kleurAccent }} aria-hidden />
                <span className="club-huisstijl-schoolnaam">{s.naam}</span>
                {s.demo && <span className="club-chip club-chip--info">{t.demo}</span>}
                {isActief ? (
                  <span className="club-huisstijl-open"><Check aria-hidden size={15} /> {t.open}</span>
                ) : (
                  <span className="club-huisstijl-open">{bezig === s.id ? t.openenBezig : t.openen}</span>
                )}
              </button>
            </li>
          )
        })}
        <li>
          {nieuw === null ? (
            <button ref={nieuwKnop} type="button" className="club-huisstijl-school club-huisstijl-school--nieuw" disabled={bezig !== null} onClick={() => setNieuw('')}>
              <Plus aria-hidden size={16} /> {t.nieuw}
            </button>
          ) : (
            <form
              className="club-huisstijl-nieuw"
              onSubmit={(e) => {
                e.preventDefault()
                void maak()
              }}
            >
              <input className="club-invoer" autoFocus aria-label={t.naamNieuw} placeholder={t.naam} maxLength={60} value={nieuw} onChange={(e) => setNieuw(e.target.value)} />
              <button type="submit" className="club-knop club-knop--primair" disabled={bezig !== null || !nieuw.trim()}>
                {bezig === 'nieuw' ? t.aanmakenBezig : t.aanmaken}
              </button>
              <button type="button" className="club-knop club-knop--stil" onClick={() => setNieuw(null)}>
                {tekst.algemeen.annuleren}
              </button>
            </form>
          )}
        </li>
      </ul>
      <p className="club-hint">{t.uitleg}</p>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </section>
  )
}
