'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import type { AppChallenge, LedenappChallengesData } from '@/lib/club/challenges/app'
import { AppChallengeKaart } from './AppChallengeKaart'
import { BadgeRaster } from './BadgeRaster'
import { useLedenappApi } from '@/components/club/app/LedenappApi'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CHALLENGES } from '@/lib/aiyourgym/taal/woorden/club/challenges'
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
  const api = useLedenappApi()
  const [bezig, setBezig] = useState<string | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const t = useTekst(CHALLENGES).app

  async function wissel(c: AppChallenge) {
    setBezig(c.id)
    setMelding(null)
    const verzoek = api.challenge(c.id, data.lidId)
    const uit = await stuur(verzoek.url, c.doetMee ? 'DELETE' : 'POST', verzoek.body)
    setBezig(null)
    if (!uit.ok) return setMelding(uit.fout)
    setMelding(c.doetMee ? t.uitgeschreven(c.titel) : t.meegedaan(c.titel))
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
        aria-label={c.doetMee ? t.uitschrijvenLabel(c.titel) : t.meedoenLabel(c.titel)}
      >
        {bezig === c.id ? t.bezig : c.doetMee ? t.uitschrijven : t.doeMee}
      </button>
    )
  }

  return (
    <section className="club-challenges-app" aria-labelledby="lidapp-challenges-kop">
      <h3 id="lidapp-challenges-kop" className="club-challenges-app-kop">
        {t.titel}
      </h3>
      <div role="status" aria-live="polite" className="club-challenges-app-melding">
        {melding && <p>{melding}</p>}
      </div>
      {data.fouten.length > 0 && <p className="club-challenges-app-leeg">{t.laadFout}</p>}
      {data.challenges.length > 0 ? (
        <ul className="club-challenges-app-lijst">
          {data.challenges.map((c) => (
            <AppChallengeKaart key={c.id} c={c} knop={knop(c)} />
          ))}
        </ul>
      ) : (
        <p className="club-challenges-app-leeg">{t.leeg}</p>
      )}
      <BadgeRaster badges={data.badges} />
    </section>
  )
}
