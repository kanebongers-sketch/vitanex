'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Rechten } from '@/lib/club/kern/org-instellingen'
import type { SportschoolSoort } from '@/lib/club/start/soorten'
import { stuur } from '@/components/club/leden/stuur'
import { RechtenMatrix, type RechtenGroep } from '@/components/club/beheer/RechtenMatrix'
import { AlvastIngevuld } from './AlvastIngevuld'
import { TeamFormulier, type TeamLid } from './TeamFormulier'
import { StartVoet, type StartVoetProps } from './StartVoet'

// Stap 6 als geheel: links het team (toevoegen, bewerken, uitnodigen), rechts
// wat elke functie ziet. Geen losse opslaanknop voor de rechten: de knop
// onderaan bewaart ze. Zonder team ga je pas verder als je bevestigt dat je
// alleen werkt; dan telt de stap als af (regel in stappen.ts).

interface StapTeamInvoerProps {
  vestigingen: { sleutel: string; naam: string }[]
  vestiging: string
  team: TeamLid[]
  loginAan: boolean
  linkBasis: string | null
  rechten: Rechten
  groepen: RechtenGroep[]
  /** Bevestigde de eigenaar al dat hij alleen werkt? */
  alleen: boolean
  soort: SportschoolSoort | null
  /** Kon de stand van de logins niet worden gelezen? */
  loginsFout: boolean
  voet: Omit<StartVoetProps, 'voorVerder' | 'primair'>
}

export function StapTeamInvoer(p: StapTeamInvoerProps) {
  const router = useRouter()
  const [rechten, setRechten] = useState<Rechten>(p.rechten)
  const [alleen, setAlleen] = useState(p.alleen)
  const [fout, setFout] = useState<string | null>(null)
  const rechtenGewijzigd = JSON.stringify(rechten) !== JSON.stringify(p.rechten)
  const alleenGewijzigd = alleen !== p.alleen
  const leeg = p.team.length === 0

  async function voorVerder(doel: 'verder' | 'stoppen'): Promise<boolean> {
    setFout(null)
    if (doel === 'verder' && leeg && !alleen) {
      setFout('Voeg minstens een medewerker toe, of vink aan dat je alleen werkt.')
      return false
    }
    if (rechtenGewijzigd) {
      const uit = await stuur('/api/club/organisatie/instellingen', 'PATCH', { rechten })
      if (!uit.ok) {
        setFout(uit.fout)
        return false
      }
    }
    if (alleenGewijzigd) {
      const uit = await stuur('/api/club/start', 'PATCH', { bevestig: { alleen } })
      if (!uit.ok) {
        setFout(uit.fout)
        return false
      }
    }
    if (rechtenGewijzigd || alleenGewijzigd) router.refresh()
    return true
  }

  const keuzeAlleen = (
    <label className="club-start-bevestig">
      <input
        type="checkbox"
        checked={alleen}
        onChange={(e) => {
          setFout(null)
          setAlleen(e.target.checked)
        }}
      />
      <span>
        <strong>Ik werk alleen</strong>
        <span className="club-zacht">Nog geen medewerkers. Komt er iemand bij, dan voeg je die hierboven toe.</span>
      </span>
    </label>
  )

  return (
    <>
      <div className="club-start-twee club-start-team-kolommen">
        <div className="club-start-stapel">
          <TeamFormulier vestigingen={p.vestigingen} vestiging={p.vestiging} team={p.team} loginAan={p.loginAan} linkBasis={p.linkBasis} leeg={keuzeAlleen} />
          {p.loginsFout && <p className="club-melding club-melding--fout" role="alert">Of je team al kan inloggen, kon niet worden gelezen. Uitnodigen werkt gewoon.</p>}
        </div>
        <section className="club-start-blok" aria-labelledby="start-rechten-kop">
          <h2 id="start-rechten-kop">Wat elke functie ziet</h2>
          <AlvastIngevuld soort={p.soort} />
          <p className="club-hint">Vink per onderdeel aan welke functie het ziet. Jij als eigenaar ziet altijd alles. De knop onderaan bewaart je keuze.</p>
          <RechtenMatrix begin={p.rechten} groepen={p.groepen} onWijzig={setRechten} />
        </section>
      </div>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
      <StartVoet {...p.voet} voorVerder={voorVerder} primair={rechtenGewijzigd || alleenGewijzigd ? 'Opslaan en verder' : undefined} />
    </>
  )
}
