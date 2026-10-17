'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
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
      </ul>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </section>
  )
}
