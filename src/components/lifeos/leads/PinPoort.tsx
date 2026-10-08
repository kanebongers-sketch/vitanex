'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { PIN_PATROON, type PinStatus } from '@/lib/lifeos/leads/leads'
import { veldStijl } from './stijl'
import { LeadKop } from './LeadKop'

// Vóór de lead tracker: pincode kiezen (eerste keer), wachten op Kane's
// goedkeuring, of inloggen op dit toestel.

interface Props {
  code: string
  naam: string
  pinStatus: PinStatus
}

export function PinPoort({ code, naam, pinStatus }: Props) {
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
    const res = await fetch(`/api/lead/${encodeURIComponent(code)}/${kiezen ? 'pin' : 'inloggen'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    }).catch(() => null)
    const body: unknown = res ? await res.json().catch(() => null) : null
    setBezig(false)
    setPin('')
    setHerhaal('')
    if (!res?.ok) {
      const f = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).fout : null
      setFout(typeof f === 'string' ? f : 'Er ging iets mis. Controleer je verbinding en probeer het opnieuw.')
      return
    }
    if (kiezen) setStaat('wacht')
    else router.refresh()
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', display: 'grid', gap: 22 }}>
      <LeadKop titel={`Hoi ${naam}`} />
      {staat === 'wacht' ? (
        <div role="status" style={kaart}>
          <h2 style={kop}>Je pincode wacht op goedkeuring</h2>
          <p style={tekst}>
            Kane keurt je pincode goed in zijn dashboard. Daarna log je hier in met die pincode en kun je je leads invullen.
            Kom straks terug of vernieuw de pagina.
          </p>
          <Knop onClick={() => router.refresh()}>Vernieuwen</Knop>
        </div>
      ) : (
        <form onSubmit={(e) => void verstuur(e)} style={kaart} aria-labelledby="pin-kop">
          <h2 id="pin-kop" style={kop}>{kiezen ? 'Kies je pincode' : 'Vul je pincode in'}</h2>
          <p style={tekst}>
            {kiezen
              ? 'Kies zelf 6 cijfers. Kane keurt je pincode eerst goed; daarna log je ermee in. Onthoud hem goed.'
              : 'Eén keer per telefoon. Daarna blijf je 90 dagen ingelogd.'}
          </p>
          <PinVeld id="pin" label="Pincode" waarde={pin} onWijzig={setPin} nieuw={kiezen} />
          {kiezen ? <PinVeld id="pin-herhaal" label="Herhaal pincode" waarde={herhaal} onWijzig={setHerhaal} nieuw /> : null}
          <div>
            <Knop type="submit" variant="primair" disabled={bezig}>
              {bezig ? 'Bezig…' : kiezen ? 'Pincode aanvragen' : 'Inloggen'}
            </Knop>
          </div>
          {fout ? <Foutmelding bericht={fout} /> : null}
          {!kiezen ? <p style={{ ...tekst, fontSize: 12.5, color: 'var(--text-3)' }}>Pincode vergeten? Vraag Kane om hem te resetten.</p> : null}
        </form>
      )}
    </div>
  )
}

function PinVeld({ id, label, waarde, onWijzig, nieuw }: { id: string; label: string; waarde: string; onWijzig: (v: string) => void; nieuw: boolean }) {
  return (
    <div style={{ display: 'grid', gap: 5 }}>
      <label htmlFor={id} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-3)' }}>{label}</label>
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
        style={{ ...veldStijl, fontSize: 22, letterSpacing: '0.4em', textAlign: 'center' }}
      />
    </div>
  )
}

const kaart: React.CSSProperties = { display: 'grid', gap: 14, padding: 18, borderRadius: 14, border: '1px solid var(--line-strong)', background: 'var(--bg-card)' }
const kop: React.CSSProperties = { margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-1)' }
const tekst: React.CSSProperties = { margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--text-2)' }
