'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Check, UserPlus } from 'lucide-react'
import { stuur } from '@/components/club/rooster/vraag'
import { MEDEWERKER_ROLLEN, ROL_LABEL, type MedewerkerRol } from '@/lib/club/kern/medewerker'
import { TeamRij, wisselIn, type TeamLid } from './TeamRij'

// Stap 6: het hele team in de wizard. Toevoegen met naam, e-mail, functie en
// vestiging; elke medewerker daaronder meteen te bewerken, te verwijderen en
// uit te nodigen (Club mailt een eenmalige link als mailen aan staat, anders
// stuur je hem zelf door; de medewerker kiest daar een wachtwoord). De
// vestiging staat altijd in beeld; met een vestiging is die al gekozen.
// Gaat via dezelfde API's als Medewerkers.

export type { TeamLid } from './TeamRij'

interface TeamFormulierProps {
  vestigingen: { sleutel: string; naam: string }[]
  /** De vestiging die open staat; nieuwe medewerkers werken daar standaard. */
  vestiging: string
  team: TeamLid[]
  /** Staat inloggen voor medewerkers aan (CLUB_EIGEN_LOGIN)? */
  loginAan: boolean
  /** Het adres van de sportschool voor de uitnodigingslink, of null (dan dit domein). */
  linkBasis: string | null
  /** Wat er staat zolang er nog niemand is (de keuze Ik werk alleen). */
  leeg?: ReactNode
}

export function TeamFormulier({ vestigingen, vestiging, team, loginAan, linkBasis, leeg }: TeamFormulierProps) {
  const router = useRouter()
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [rollen, setRollen] = useState<MedewerkerRol[]>(['trainer'])
  const [waar, setWaar] = useState<string[]>([vestiging])
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/instellingen/medewerkers', 'POST', { vestiging: waar[0] ?? vestiging, naam: naam.trim(), email: email.trim(), rollen, vestigingen: waar })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: `${naam.trim()} staat erin. Nodig hieronder meteen uit om in te loggen.` })
    setNaam('')
    setEmail('')
    router.refresh()
  }

  return (
    <section className="club-start-blok" aria-labelledby="start-team-kop">
      <h2 id="start-team-kop">Wie werkt er?</h2>
      <form className="club-start-teamnieuw" onSubmit={(e) => void voegToe(e)}>
        <div className="club-start-teamrij-velden">
          <label className="club-veld">
            <span>Naam</span>
            <input className="club-invoer" required maxLength={80} autoComplete="off" value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Voor- en achternaam" />
          </label>
          <label className="club-veld">
            <span>E-mail</span>
            <input className="club-invoer" type="email" maxLength={160} autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@jouwsportschool.nl" />
          </label>
        </div>
        <fieldset className="club-start-keuzes">
          <legend>Functie</legend>
          {MEDEWERKER_ROLLEN.map((r) => (
            <label key={r} className="club-start-keuze" data-aan={rollen.includes(r) || undefined}>
              <input type="checkbox" checked={rollen.includes(r)} onChange={() => setRollen((oud) => wisselIn(oud, r))} />
              {rollen.includes(r) && <Check aria-hidden size={14} strokeWidth={3} />} {ROL_LABEL[r]}
            </label>
          ))}
        </fieldset>
        <fieldset className="club-start-keuzes">
          <legend>Vestiging</legend>
          {vestigingen.map((v) => (
            <label key={v.sleutel} className="club-start-keuze" data-aan={waar.includes(v.sleutel) || undefined}>
              <input type="checkbox" checked={waar.includes(v.sleutel)} onChange={() => setWaar((oud) => wisselIn(oud, v.sleutel))} />
              {waar.includes(v.sleutel) && <Check aria-hidden size={14} strokeWidth={3} />} {v.naam}
            </label>
          ))}
        </fieldset>
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
            <TeamRij key={`${m.id}-${m.naam}-${m.email ?? ''}-${m.rollen.join()}-${m.vestigingen.join()}`} lid={m} vestigingen={vestigingen} vestiging={vestiging} loginAan={loginAan} linkBasis={linkBasis} />
          ))}
        </ul>
      ) : (
        (leeg ?? <p className="club-leeg">Nog niemand.</p>)
      )}
      <p className="club-hint">Je team logt in met het eigen e-mailadres en een wachtwoord dat ieder zelf kiest. Uitnodigen mailt een eenmalige link naar die medewerker; staat mailen nog niet aan, dan zie je de link om zelf door te sturen.</p>
    </section>
  )
}
