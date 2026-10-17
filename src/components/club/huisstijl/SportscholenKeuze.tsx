'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Plus } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'

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
  const router = useRouter()
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [nieuw, setNieuw] = useState<string | null>(null)
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
    router.push('/clubkane/huisstijl')
    router.refresh()
    setBezig(null)
  }

  async function maak() {
    const naam = (nieuw ?? '').trim()
    if (!naam) return
    setBezig('nieuw')
    setFout(null)
    const uit = await stuur('/api/club/organisatie/nieuw', 'POST', { naam })
    setBezig(null)
    if (!uit.ok) return setFout(uit.fout)
    setNieuw(null)
    router.push('/clubkane/instellingen?tab=vestigingen')
    router.refresh()
  }

  return (
    <section className="club-huisstijl-scholen" aria-labelledby="sportscholen-kop">
      <h2 id="sportscholen-kop" className="club-huisstijl-kop">Sportscholen</h2>
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
                {s.demo && <span className="club-chip club-chip--info">Demo</span>}
                {isActief ? (
                  <span className="club-huisstijl-open"><Check aria-hidden size={15} /> Open</span>
                ) : (
                  <span className="club-huisstijl-open">{bezig === s.id ? 'Openen...' : 'Openen'}</span>
                )}
              </button>
            </li>
          )
        })}
        <li>
          {nieuw === null ? (
            <button ref={nieuwKnop} type="button" className="club-huisstijl-school club-huisstijl-school--nieuw" disabled={bezig !== null} onClick={() => setNieuw('')}>
              <Plus aria-hidden size={16} /> Nieuwe sportschool
            </button>
          ) : (
            <form
              className="club-huisstijl-nieuw"
              onSubmit={(e) => {
                e.preventDefault()
                void maak()
              }}
            >
              <input className="club-invoer" autoFocus aria-label="Naam van de nieuwe sportschool" placeholder="Naam van de sportschool" maxLength={60} value={nieuw} onChange={(e) => setNieuw(e.target.value)} />
              <button type="submit" className="club-knop club-knop--primair" disabled={bezig !== null || !nieuw.trim()}>
                {bezig === 'nieuw' ? 'Aanmaken...' : 'Aanmaken'}
              </button>
              <button type="button" className="club-knop club-knop--stil" onClick={() => setNieuw(null)}>
                Annuleren
              </button>
            </form>
          )}
        </li>
      </ul>
      <p className="club-hint">Een nieuwe sportschool krijgt een eigen, lege omgeving met de complete oefenbibliotheek. Daarna voeg je de vestigingen toe en kies je de huisstijl.</p>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </section>
  )
}
