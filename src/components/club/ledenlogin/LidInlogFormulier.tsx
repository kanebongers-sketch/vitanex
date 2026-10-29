'use client'

import { useState, type FormEvent } from 'react'
import { stuur } from '@/components/club/app/verzoek'
import { LEDENAPP_PAD } from '@/lib/club/ledenlogin/contract'
import { MAX_LENGTE } from '@/lib/club/kern/wachtwoord-regels'
import { LidFout, LidVeld } from './LidVeld'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { LID_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/inloggen'

// Inloggen op de ledenapp met e-mailadres en wachtwoord (besluit Kane
// 23-10-2026: geen link of pincode meer). Is het adres lid bij meer
// sportscholen met dit wachtwoord, dan kiest het lid daarna de sportschool.

interface Props {
  /** De sportschool van deze pagina (subdomein of ?s=), of null: dan zoekt de server. */
  sportschool: string | null
}

interface Keuze {
  id: string
  naam: string
}

function leesKeuzes(data: Record<string, unknown>): Keuze[] {
  const lijst = Array.isArray(data.sportscholen) ? data.sportscholen : []
  return lijst.filter((k): k is Keuze => typeof k === 'object' && k !== null && typeof (k as Keuze).id === 'string' && typeof (k as Keuze).naam === 'string')
}

export function LidInlogFormulier({ sportschool }: Props) {
  const [email, setEmail] = useState('')
  const t = LID_INLOGGEN[useTaal()].inloggen
  const [wachtwoord, setWachtwoord] = useState('')
  const [keuzes, setKeuzes] = useState<Keuze[] | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  async function logIn(gekozen: string | null) {
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/lid/inloggen', 'POST', { email: email.trim(), wachtwoord, sportschool: gekozen ?? sportschool })
    if (uit.ok && uit.data.staat === 'kies') {
      setBezig(false)
      return setKeuzes(leesKeuzes(uit.data))
    }
    if (uit.ok) {
      // Vervangen, niet toevoegen: terug gaat niet naar de inlogpagina.
      window.location.replace(LEDENAPP_PAD)
      return
    }
    setBezig(false)
    setKeuzes(null)
    setWachtwoord('')
    setFout(uit.fout)
  }

  function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!email.trim() || !wachtwoord) return setFout(t.leeg)
    void logIn(null)
  }

  if (keuzes && keuzes.length > 0) {
    return (
      <div className="club-mijn-blok" role="group" aria-labelledby="lid-kies-kop">
        <p id="lid-kies-kop">{t.kies}</p>
        {keuzes.map((k) => (
          <button key={k.id} type="button" className="club-lidapp-knop club-lidapp-knop--breed" disabled={bezig} onClick={() => void logIn(k.id)}>
            {k.naam}
          </button>
        ))}
        <LidFout fout={fout} />
      </div>
    )
  }

  return (
    <form className="club-mijn-blok" onSubmit={verstuur} noValidate>
      <LidVeld
        id="lid-email" label={t.email} type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
        maxLength={120} required autoFocus waarde={email} onWaarde={setEmail} fout={fout !== null}
      />
      <LidVeld
        id="lid-wachtwoord" label={t.wachtwoord} type="password" autoComplete="current-password" maxLength={MAX_LENGTE} required
        waarde={wachtwoord} onWaarde={setWachtwoord} fout={fout !== null}
      />
      <LidFout fout={fout} />
      <button type="submit" className="club-lidapp-knop club-lidapp-knop--primair club-lidapp-knop--breed" disabled={bezig} aria-busy={bezig}>
        {bezig ? t.bezig : t.knop}
      </button>
    </form>
  )
}
