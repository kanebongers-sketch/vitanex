'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import type { AppChallenge, LedenappChallengesData } from '@/lib/club/challenges/app'
import { AppChallengeKaart } from './AppChallengeKaart'
import { BadgeRaster } from './BadgeRaster'
import './challenges.css'

// Challenges en badges in de ledenapp. Data komt uit haalLedenappChallenges()
// op de server. Inschrijven en uitschrijven gaan via de API; daarna ververst
// de pagina. Geen beloningen of prijzen: puur voortgang en erkenning.

export interface LedenappChallengesProps {
  /** Uit haalLedenappChallenges(admin, userId, lid, nu) op de server. */
  data: LedenappChallengesData
}

export function LedenappChallenges({ data }: LedenappChallengesProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState<string | null>(null)
  const [melding, setMelding] = useState<string | null>(null)

  async function wissel(c: AppChallenge) {
    setBezig(c.id)
    setMelding(null)
    const uit = await stuur(`/api/club/challenges/${c.id}/deelnemers`, c.doetMee ? 'DELETE' : 'POST', { lidId: data.lidId })
    setBezig(null)
    if (!uit.ok) return setMelding(uit.fout)
    setMelding(c.doetMee ? `Je bent uitgeschreven voor ${c.titel}.` : `Je doet mee met ${c.titel}.`)
    router.refresh()
  }

  function knop(c: AppChallenge) {
    if (c.deelname !== 'inschrijven' || c.status === 'afgelopen') return null
    return (
      <button
        type="button"
        className={c.doetMee ? 'club-challenges-app-uit' : 'club-challenges-app-mee'}
        onClick={() => void wissel(c)}
        disabled={bezig === c.id}
        aria-label={c.doetMee ? `Uitschrijven voor ${c.titel}` : `Meedoen met ${c.titel}`}
      >
        {bezig === c.id ? 'Even geduld...' : c.doetMee ? 'Uitschrijven' : 'Doe mee'}
      </button>
    )
  }

  return (
    <section className="club-challenges-app" aria-labelledby="lidapp-challenges-kop">
      <h3 id="lidapp-challenges-kop" className="club-challenges-app-kop">
        Challenges
      </h3>
      <div role="status" aria-live="polite" className="club-challenges-app-melding">
        {melding && <p>{melding}</p>}
      </div>
      {data.fouten.length > 0 && <p className="club-challenges-app-leeg">Niet alles kon worden geladen. Probeer het straks opnieuw.</p>}
      {data.challenges.length > 0 ? (
        <ul className="club-challenges-app-lijst">
          {data.challenges.map((c) => (
            <AppChallengeKaart key={c.id} c={c} knop={knop(c)} />
          ))}
        </ul>
      ) : (
        <p className="club-challenges-app-leeg">Er loopt nu geen challenge. Je badges groeien gewoon door met elk bezoek.</p>
      )}
      <BadgeRaster badges={data.badges} />
    </section>
  )
}
