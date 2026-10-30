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
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'
import { RechtenV2 } from '@/components/club/rollen/RechtenV2'
import type { Rol, Rolrechten } from '@/lib/club/rollen/typen'
import type { Verborgen } from '@/lib/club/kern/pakketten'

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
  /** Rollen v2 (CLUB_ROLLEN_V2): de vraag "Werk je zelf op de vloer?" en de matrix met niveaus. */
  v2?: RollenV2Stap | null
}

export interface RollenV2Stap {
  rolrechten: Rolrechten
  uit: readonly Verborgen[]
  /** Het profiel van de eigenaar die de wizard doet (null voor Kane). */
  profiel: { id: string; rollen: Rol[] } | null
}

export function StapTeamInvoer(p: StapTeamInvoerProps) {
  const router = useRouter()
  const [rechten, setRechten] = useState<Rechten>(p.rechten)
  const [alleen, setAlleen] = useState(p.alleen)
  const [fout, setFout] = useState<string | null>(null)
  const tk = useTekst(START)
  const tr = useTekst(ROLLEN_TEKST)
  const [rolrechten, setRolrechten] = useState<Rolrechten | null>(p.v2?.rolrechten ?? null)
  const traintNu = p.v2?.profiel?.rollen.includes('trainer') ?? false
  const [traint, setTraint] = useState(traintNu)
  const rechtenGewijzigd = p.v2 ? JSON.stringify(rolrechten) !== JSON.stringify(p.v2.rolrechten) || traint !== traintNu : JSON.stringify(rechten) !== JSON.stringify(p.rechten)
  const alleenGewijzigd = alleen !== p.alleen
  const leeg = p.team.length === 0

  async function voorVerder(doel: 'verder' | 'stoppen'): Promise<boolean> {
    setFout(null)
    if (doel === 'verder' && leeg && !alleen) {
      setFout(tk.team.verplicht)
      return false
    }
    if (rechtenGewijzigd) {
      const fout = p.v2 ? await bewaarV2() : await bewaarRechten()
      if (fout) {
        setFout(fout)
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

  async function bewaarRechten(): Promise<string | null> {
    const uit = await stuur('/api/club/organisatie/instellingen', 'PATCH', { rechten })
    return uit.ok ? null : uit.fout
  }

  /** Rollen v2: de rechten per rol en "werk je zelf op de vloer" (de rol trainer bij de eigenaar). */
  async function bewaarV2(): Promise<string | null> {
    if (rolrechten && JSON.stringify(rolrechten) !== JSON.stringify(p.v2?.rolrechten)) {
      const uit = await stuur('/api/club/team/rechten', 'PATCH', { rollen: rolrechten.rollen, start: rolrechten.start })
      if (!uit.ok) return uit.fout
    }
    const profiel = p.v2?.profiel
    if (profiel && traint !== traintNu) {
      const rollen = traint ? [...profiel.rollen, 'trainer'] : profiel.rollen.filter((r) => r !== 'trainer')
      const uit = await stuur(`/api/club/team/${profiel.id}`, 'PATCH', { rollen })
      if (!uit.ok) return uit.fout
    }
    return null
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
        <strong>{tk.team.alleen}</strong>
        <span className="club-zacht">{tk.team.alleenUitleg}</span>
      </span>
    </label>
  )

  return (
    <>
      <div className="club-start-twee club-start-team-kolommen">
        <div className="club-start-stapel">
          <TeamFormulier vestigingen={p.vestigingen} vestiging={p.vestiging} team={p.team} loginAan={p.loginAan} linkBasis={p.linkBasis} leeg={keuzeAlleen} />
          {p.loginsFout && <p className="club-melding club-melding--fout" role="alert">{tk.team.loginsFout}</p>}
        </div>
        <section className="club-start-blok" aria-labelledby="start-rechten-kop">
          <h2 id="start-rechten-kop">{tk.team.rechtenKop}</h2>
          <AlvastIngevuld soort={p.soort} />
          <p className="club-hint">{tk.team.rechtenUitleg}</p>
          {p.v2 ? (
            <>
              {p.v2.profiel && (
                <fieldset className="club-start-zelf">
                  <legend>{tr.wizard.zelfVraag}</legend>
                  <p className="club-hint">{tr.wizard.zelfUitleg}</p>
                  <div className="club-start-zelf-keuzes">
                    <label className="club-start-bevestig">
                      <input type="radio" name="zelf-op-de-vloer" checked={traint} onChange={() => setTraint(true)} />
                      <span><strong>{tr.wizard.ja}</strong></span>
                    </label>
                    <label className="club-start-bevestig">
                      <input type="radio" name="zelf-op-de-vloer" checked={!traint} onChange={() => setTraint(false)} />
                      <span><strong>{tr.wizard.nee}</strong></span>
                    </label>
                  </div>
                </fieldset>
              )}
              <RechtenV2 begin={p.v2.rolrechten} uit={p.v2.uit} onWijzig={setRolrechten} compact />
            </>
          ) : (
            <RechtenMatrix begin={p.rechten} groepen={p.groepen} onWijzig={setRechten} />
          )}
        </section>
      </div>
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
      <StartVoet {...p.voet} voorVerder={voorVerder} primair={rechtenGewijzigd || alleenGewijzigd ? tk.voet.opslaanVerder : undefined} />
    </>
  )
}
