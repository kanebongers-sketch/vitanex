'use client'

import { useState, type FormEvent } from 'react'
import { DoorOpen, Plus, UserRound } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import type { Keuze } from './WeekLessen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// Zalen en instructeurs voor de vaste lessen, meteen toe te voegen in de
// wizard (dezelfde API's als Zalen en Medewerkers). Een nieuwe instructeur
// staat daarna ook in stap Team, waar je hem uitnodigt om in te loggen.

interface ZalenEnInstructeursProps {
  vestiging: string
  zalen: Keuze[]
  instructeurs: Keuze[]
  onZaal: (z: Keuze) => void
  onInstructeur: (m: Keuze) => void
}

function idUit(data: unknown): string | null {
  return typeof data === 'object' && data !== null && 'id' in data && typeof data.id === 'string' ? data.id : null
}

/** Een klein formulier met een naam en een getal of e-mail, dat na toevoegen weer leeg is. */
function useToevoegen(maak: () => Promise<string | null>) {
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  async function verstuur(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setFout(await maak())
    setBezig(false)
  }
  return { bezig, fout, verstuur }
}

export function ZalenEnInstructeurs({ vestiging, zalen, instructeurs, onZaal, onInstructeur }: ZalenEnInstructeursProps) {
  const [zaal, setZaal] = useState('')
  const [plekken, setPlekken] = useState('20')
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const t = useTekst(START)

  const nieuweZaal = useToevoegen(async () => {
    const uit = await stuur('/api/club/instellingen/zalen', 'POST', { vestiging, naam: zaal.trim(), capaciteit: Number(plekken) })
    const id = uit.ok ? idUit(uit.data) : null
    if (!uit.ok || !id) return uit.ok ? t.zalen.zaalNietTerug : uit.fout
    onZaal({ id, naam: zaal.trim() })
    setZaal('')
    return null
  })
  const nieuweInstructeur = useToevoegen(async () => {
    const uit = await stuur('/api/club/instellingen/medewerkers', 'POST', { vestiging, naam: naam.trim(), email: email.trim(), rollen: ['instructeur'], vestigingen: [vestiging] })
    const id = uit.ok ? idUit(uit.data) : null
    if (!uit.ok || !id) return uit.ok ? t.zalen.instructeurNietTerug : uit.fout
    onInstructeur({ id, naam: naam.trim() })
    setNaam('')
    setEmail('')
    return null
  })

  return (
    <section className="club-start-blok" aria-labelledby="start-zalen-kop">
      <h2 id="start-zalen-kop">{t.zalen.kop}</h2>
      <div className="club-start-twee club-start-zalen">
        <div className="club-start-stapel">
          <p className="club-start-lijstje">
            <DoorOpen aria-hidden size={16} /> {zalen.length > 0 ? zalen.map((z) => z.naam).join(', ') : t.zalen.geenZaal}
          </p>
          <form className="club-start-minirij" onSubmit={(e) => void nieuweZaal.verstuur(e)}>
            <label className="club-veld">
              <span>{t.zalen.nieuweZaal}</span>
              <input className="club-invoer" required maxLength={60} value={zaal} onChange={(e) => setZaal(e.target.value)} placeholder={t.zalen.zaalPlaats} />
            </label>
            <label className="club-veld club-start-minirij-getal">
              <span>{t.zalen.plekken}</span>
              <input className="club-invoer" type="number" inputMode="numeric" min={1} max={500} required value={plekken} onChange={(e) => setPlekken(e.target.value)} />
            </label>
            <button type="submit" className="club-knop" disabled={nieuweZaal.bezig || !zaal.trim()}>
              <Plus aria-hidden size={16} /> {nieuweZaal.bezig ? t.zalen.bezig : t.zalen.zaalToevoegen}
            </button>
          </form>
          {nieuweZaal.fout && <p className="club-fout" role="alert">{nieuweZaal.fout}</p>}
        </div>
        <div className="club-start-stapel">
          <p className="club-start-lijstje">
            <UserRound aria-hidden size={16} /> {instructeurs.length > 0 ? instructeurs.map((m) => m.naam).join(', ') : t.zalen.geenInstructeur}
          </p>
          <form className="club-start-minirij" onSubmit={(e) => void nieuweInstructeur.verstuur(e)}>
            <label className="club-veld">
              <span>{t.zalen.nieuweInstructeur}</span>
              <input className="club-invoer" required maxLength={80} autoComplete="off" value={naam} onChange={(e) => setNaam(e.target.value)} placeholder={t.team.naamPlaats} />
            </label>
            <label className="club-veld">
              <span>{t.team.email}</span>
              <input className="club-invoer" type="email" maxLength={160} autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.team.emailPlaats} />
            </label>
            <button type="submit" className="club-knop" disabled={nieuweInstructeur.bezig || !naam.trim()}>
              <Plus aria-hidden size={16} /> {nieuweInstructeur.bezig ? t.zalen.bezig : t.zalen.instructeurToevoegen}
            </button>
          </form>
          {nieuweInstructeur.fout && <p className="club-fout" role="alert">{nieuweInstructeur.fout}</p>}
        </div>
      </div>
    </section>
  )
}
