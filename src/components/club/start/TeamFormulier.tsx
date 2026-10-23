'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { stuur } from '@/components/club/rooster/vraag'
import { MEDEWERKER_ROLLEN, ROL_LABEL, type MedewerkerRol } from '@/lib/club/kern/medewerker'
import { clubPad } from '@/lib/club/kern/vestiging'

// Stap 6: medewerkers toevoegen met alleen naam, e-mail en rol. Uitnodigen om
// in te loggen (e-mailadres plus een zelfgekozen wachtwoord) doe je daarna bij
// Medewerkers. Gaat via dezelfde API als Instellingen.

export interface TeamLid {
  id: string
  naam: string
  email: string | null
  rollen: MedewerkerRol[]
}

interface TeamFormulierProps {
  vestigingen: { sleutel: string; naam: string }[]
  /** De vestiging die open staat; nieuwe medewerkers werken daar standaard. */
  vestiging: string
  team: TeamLid[]
}

const ALLE = '__alle'

export function TeamFormulier({ vestigingen, vestiging, team }: TeamFormulierProps) {
  const router = useRouter()
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<MedewerkerRol>('trainer')
  const [waar, setWaar] = useState(vestiging)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setMelding(null)
    const lijst = waar === ALLE ? vestigingen.map((v) => v.sleutel) : [waar]
    const uit = await stuur('/api/club/instellingen/medewerkers', 'POST', { vestiging: lijst[0], naam: naam.trim(), email: email.trim(), rollen: [rol], vestigingen: lijst })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: `${naam.trim()} staat erin als ${ROL_LABEL[rol].toLowerCase()}.` })
    setNaam('')
    setEmail('')
    router.refresh()
  }

  return (
    <section className="club-start-blok" aria-labelledby="start-team-kop">
      <h2 id="start-team-kop">Wie werkt er?</h2>
      <form className="club-start-team-form" onSubmit={(e) => void voegToe(e)}>
        <label className="club-veld">
          <span>Naam</span>
          <input className="club-invoer" required maxLength={80} autoComplete="off" value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Voor- en achternaam" />
        </label>
        <label className="club-veld">
          <span>E-mail</span>
          <input className="club-invoer" type="email" maxLength={160} autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@jouwsportschool.nl" />
        </label>
        <label className="club-veld">
          <span>Rol</span>
          <select className="club-invoer" value={rol} onChange={(e) => setRol(e.target.value as MedewerkerRol)}>
            {MEDEWERKER_ROLLEN.map((r) => (
              <option key={r} value={r}>
                {ROL_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        {vestigingen.length > 1 && (
          <label className="club-veld">
            <span>Werkt in</span>
            <select className="club-invoer" value={waar} onChange={(e) => setWaar(e.target.value)}>
              {vestigingen.map((v) => (
                <option key={v.sleutel} value={v.sleutel}>
                  {v.naam}
                </option>
              ))}
              <option value={ALLE}>Alle vestigingen</option>
            </select>
          </label>
        )}
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig || !naam.trim()}>
          <UserPlus aria-hidden size={16} /> {bezig ? 'Bezig...' : 'Toevoegen'}
        </button>
      </form>
      <div aria-live="polite">
        {melding && (
          <p className={`club-melding${melding.ok ? ' club-melding--ok' : ' club-melding--fout'}`} role={melding.ok ? 'status' : 'alert'}>
            {melding.tekst}
          </p>
        )}
      </div>
      {team.length > 0 ? (
        <ul className="club-start-team" role="list">
          {team.map((m) => (
            <li key={m.id}>
              <span className="club-start-team-bol" aria-hidden>
                {m.naam.trim().charAt(0).toUpperCase()}
              </span>
              <span className="club-start-team-naam">
                <strong>{m.naam}</strong>
                <span className="club-zacht">{m.email ?? 'Geen e-mail'}</span>
              </span>
              <span className="club-chip club-chip--merk">{m.rollen.map((r) => ROL_LABEL[r]).join(', ') || 'Geen rol'}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="club-leeg">Nog niemand. Werk je alleen? Dan kun je deze stap overslaan.</p>
      )}
      <p className="club-hint">
        Je team logt in met het eigen e-mailadres en een wachtwoord dat ieder zelf kiest. Stuur de uitnodiging wanneer het jou uitkomt: open bij{' '}
        <Link href={clubPad('/instellingen/medewerkers', vestiging)}>Medewerkers</Link> iemand en kies Uitnodigen.
      </p>
    </section>
  )
}
