'use client'

import { useState, type FormEvent } from 'react'
import { LockKeyhole } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import type { BeheerderPinStatus } from '@/lib/club/beheerders/beheerder'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/club/inloggen'

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
  const tekst = useTekst(CLUB_INLOGGEN)
  const t = tekst.pin
  const kiezen = staat === 'geen'
  const basis = apiBasis ?? `/api/club/inloggen/${encodeURIComponent(code)}`

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!PIN.test(pin)) return setFout(t.precies6)
    if (kiezen && pin !== herhaal) return setFout(t.nietGelijk)
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
    window.location.assign('/club?start=1')
  }

  const kop = staat === 'wacht' ? t.geduld : kiezen ? tekst.welkom(voornaam) : t.inloggen

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
              {t.controleVoor} <strong className="club-inlog-controle">{controle}</strong>. {t.controleNa}
            </p>
          )}
          <p>{t.wacht}</p>
          <p className="club-hint">{t.nietZelf}</p>
        </div>
      ) : (
        <form className="club-inlog-form" onSubmit={(e) => void verstuur(e)} noValidate>
          <p className="club-inlog-uitleg">
            {kiezen ? t.kiesUitleg : t.vulIn}
          </p>
          <label className="club-veld">
            <span>{kiezen ? t.nieuw : t.pincode}</span>
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
              <span>{t.herhaal}</span>
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
            {bezig ? t.bezig : kiezen ? t.kiezen : t.inloggen}
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
