'use client'

import { useState, type FormEvent } from 'react'
import { LockKeyhole } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import type { BeheerderPinStatus } from '@/lib/club/beheerders/beheerder'

// De poort van een eigenaar, clubmanager of medewerker: eerste keer een pincode kiezen (met
// een controlecode die de beheerder doorgeeft), dan wachten op goedkeuring, daarna
// inloggen op dit toestel.

const PIN = /^\d{6}$/

interface ClubInlogPoortProps {
  code: string
  pinStatus: BeheerderPinStatus
  sportschool: string
  voornaam: string
  rol: string
  /** De inlog-API; standaard die van beheerders. Medewerkers: /api/club/inloggen/medewerker/<code>. */
  apiBasis?: string
}

function leesControle(data: unknown): string | null {
  const c = typeof data === 'object' && data !== null ? (data as { controle?: unknown }).controle : null
  return typeof c === 'string' ? c : null
}

function alleenCijfers(v: string): string {
  return v.replace(/\D/g, '').slice(0, 6)
}

export function ClubInlogPoort({ code, pinStatus, sportschool, voornaam, rol, apiBasis }: ClubInlogPoortProps) {
  const [staat, setStaat] = useState<BeheerderPinStatus>(pinStatus)
  const [pin, setPin] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [controle, setControle] = useState<string | null>(null)
  const kiezen = staat === 'geen'
  const basis = apiBasis ?? `/api/club/inloggen/${encodeURIComponent(code)}`

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!PIN.test(pin)) return setFout('Een pincode is precies 6 cijfers.')
    if (kiezen && pin !== herhaal) return setFout('De twee pincodes zijn niet gelijk.')
    setBezig(true)
    setFout(null)
    const uit = await stuur(kiezen ? `${basis}/pin` : basis, 'POST', { pin })
    setPin('')
    setHerhaal('')
    if (!uit.ok) {
      setBezig(false)
      return setFout(uit.fout)
    }
    if (kiezen) {
      setBezig(false)
      setControle(leesControle(uit.data))
      return setStaat('wacht')
    }
    window.location.assign('/clubkane')
  }

  const kop = staat === 'wacht' ? 'Even geduld' : kiezen ? `Welkom, ${voornaam}` : 'Inloggen'

  return (
    <section className="club-inlog-kaart" aria-labelledby="club-inlog-kop">
      <p className="club-inlog-merk">
        <span>{sportschool}</span>
        <span className="club-inlog-club">Club</span>
      </p>
      <h1 id="club-inlog-kop">{kop}</h1>
      <p className="club-inlog-rol">{rol}</p>

      {staat === 'wacht' ? (
        <div role="status" className="club-inlog-wacht">
          {controle && (
            <p>
              Je controlecode is <strong className="club-inlog-controle">{controle}</strong>. Geef deze code door aan wie je de link stuurde:
              zonder deze code wordt je pincode niet goedgekeurd. Je ziet hem maar een keer, dus schrijf hem op.
            </p>
          )}
          <p>Je pincode wacht op goedkeuring. Daarna log je hier in. Vernieuw de pagina als je bericht hebt gekregen.</p>
          <p className="club-hint">Heb je zelf geen pincode gekozen? Laat het meteen weten aan wie je de link stuurde.</p>
        </div>
      ) : (
        <form className="club-inlog-form" onSubmit={(e) => void verstuur(e)} noValidate>
          <p className="club-inlog-uitleg">
            {kiezen ? 'Kies een pincode van 6 cijfers. Daarmee log je voortaan in op dit toestel.' : 'Vul je pincode van 6 cijfers in.'}
          </p>
          <label className="club-veld">
            <span>{kiezen ? 'Nieuwe pincode' : 'Pincode'}</span>
            <input
              className="club-invoer club-inlog-pin"
              type="password"
              inputMode="numeric"
              autoComplete={kiezen ? 'new-password' : 'current-password'}
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(alleenCijfers(e.target.value))}
              aria-invalid={fout ? true : undefined}
              aria-describedby={fout ? 'club-inlog-fout' : undefined}
              autoFocus
            />
          </label>
          {kiezen && (
            <label className="club-veld">
              <span>Herhaal pincode</span>
              <input
                className="club-invoer club-inlog-pin"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={6}
                value={herhaal}
                onChange={(e) => setHerhaal(alleenCijfers(e.target.value))}
              />
            </label>
          )}
          <button type="submit" className="club-knop club-knop--primair club-knop--groot" disabled={bezig}>
            <LockKeyhole aria-hidden size={18} />
            {bezig ? 'Even wachten...' : kiezen ? 'Pincode kiezen' : 'Inloggen'}
          </button>
          {fout && (
            <p id="club-inlog-fout" className="club-melding club-melding--fout" role="alert">
              {fout}
            </p>
          )}
        </form>
      )}
    </section>
  )
}
