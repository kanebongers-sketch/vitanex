'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { PIN_PATROON, type PinStatus } from '@/lib/lifeos/leads/leads'
import { ptApi } from './api'

// Vóór het dashboard: pincode kiezen (eerste keer), wachten op Kane's
// goedkeuring, of inloggen op dit toestel.

const leesStaat = (r: unknown): true | null => (typeof r === 'object' && r !== null ? true : null)

export function PinPoort({ code, pinStatus }: { code: string; pinStatus: PinStatus }) {
  const router = useRouter()
  const [staat, setStaat] = useState<PinStatus>(pinStatus)
  const [pin, setPin] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const kiezen = staat === 'geen'

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!PIN_PATROON.test(pin)) return setFout('Een pincode is precies 6 cijfers.')
    if (kiezen && pin !== herhaal) return setFout('De twee pincodes zijn niet gelijk.')
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, kiezen ? 'pin' : 'inloggen', 'POST', { pin }, leesStaat)
    setBezig(false)
    setPin('')
    setHerhaal('')
    if (!uit.ok) return setFout(uit.fout)
    if (kiezen) setStaat('wacht')
    else router.refresh()
  }

  if (staat === 'wacht') {
    return (
      <div role="status" className="ptd-form ptd-smal">
        <h3>Je pincode wacht op goedkeuring</h3>
        <p className="ptd-tekst">
          Kane keurt je pincode goed in zijn dashboard. Daarna log je hier in met die pincode en zie je je leads en klanten.
          Kom straks terug of vernieuw de pagina.
        </p>
        <div><button type="button" className="ptd-knop" onClick={() => router.refresh()}>Vernieuwen</button></div>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => void verstuur(e)} className="ptd-form ptd-smal" aria-labelledby="pin-kop">
      <h3 id="pin-kop">{kiezen ? 'Kies je pincode' : 'Vul je pincode in'}</h3>
      <p className="ptd-tekst">
        {kiezen
          ? 'Kies zelf 6 cijfers. Kane keurt je pincode eerst goed; daarna log je ermee in. Onthoud hem goed.'
          : 'Eén keer per telefoon. Daarna blijf je 90 dagen ingelogd.'}
      </p>
      <PinVeld id="pin" label="Pincode" waarde={pin} onWijzig={setPin} nieuw={kiezen} />
      {kiezen ? <PinVeld id="pin-herhaal" label="Herhaal pincode" waarde={herhaal} onWijzig={setHerhaal} nieuw /> : null}
      <div>
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig}>
          {bezig ? 'Bezig…' : kiezen ? 'Pincode aanvragen' : 'Inloggen'}
        </button>
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
      {!kiezen ? <p className="ptd-hint">Pincode vergeten? Vraag Kane om hem te resetten.</p> : null}
    </form>
  )
}

function PinVeld({ id, label, waarde, onWijzig, nieuw }: { id: string; label: string; waarde: string; onWijzig: (v: string) => void; nieuw: boolean }) {
  return (
    <div className="ptd-veld">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        autoComplete={nieuw ? 'new-password' : 'current-password'}
        value={waarde}
        onChange={(e) => onWijzig(e.target.value.replace(/\D/g, '').slice(0, 6))}
        required
        className="ptd-invoer ptd-pin"
      />
    </div>
  )
}
