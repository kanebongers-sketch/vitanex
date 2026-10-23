'use client'

import { useState, type FormEvent } from 'react'
import { Plus, Save } from 'lucide-react'
import { MEDEWERKER_ROLLEN, RECHTEN, ROL_LABEL, type Medewerker, type MedewerkerRol } from '@/lib/club/kern/medewerker'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { useVestigingen, useVestigingNaam } from '@/components/club/shell/VestigingenContext'
import { ONDERDELEN } from '@/components/club/shell/onderdelen'
import { useClubActie } from '@/components/club/rooster/vraag'
import type { LoginOverzicht } from '@/lib/club/medewerker-login/medewerker-login'
import { bewaarItem } from './opslaan'
import { MedewerkerLogin } from './MedewerkerLogin'
import { MedewerkerPrivacy } from './MedewerkerPrivacy'

// Medewerkers met hun rollen en vestigingen. De rollen bepalen wat iemand ziet
// als hij zelf inlogt; de eigenaar of clubmanager deelt hier de inloglink uit.

const ONDERDEEL_LABEL = new Map(ONDERDELEN.map((o) => [o.sleutel, o.label]))

export function RollenUitleg() {
  return (
    <section className="club-kaart club-kaart--vlak club-instellingen-rollen" aria-label="Wat elke rol straks ziet">
      <h3 className="club-instellingen-kop">Wat elke rol straks ziet</h3>
      <dl>
        {MEDEWERKER_ROLLEN.map((rol) => (
          <div key={rol}>
            <dt>{ROL_LABEL[rol]}</dt>
            <dd>{RECHTEN[rol].map((s) => ONDERDEEL_LABEL.get(s) ?? s).join(', ')}</dd>
          </div>
        ))}
      </dl>
      <p className="club-hint">Een medewerker die zelf inlogt, ziet de onderdelen van al zijn rollen samen, en alleen zijn eigen vestigingen. Je past de rechten per rol aan bij Beheer, Rechten per rol.</p>
    </section>
  )
}

interface Velden {
  naam: string
  email: string
  rollen: MedewerkerRol[]
  vestigingen: Vestiging[]
}

function wissel<T>(lijst: readonly T[], x: T): T[] {
  return lijst.includes(x) ? lijst.filter((y) => y !== x) : [...lijst, x]
}

function MedewerkerFormulier({ mens, vestiging }: { mens: Medewerker | null; vestiging: Vestiging }) {
  const leeg: Velden = { naam: '', email: '', rollen: ['trainer'], vestigingen: [vestiging] }
  const [v, setV] = useState<Velden>(mens ? { naam: mens.naam, email: mens.email ?? '', rollen: mens.rollen, vestigingen: mens.vestigingen } : leeg)
  const { bezig, fout, voerUit } = useClubActie()
  const vestigingen = useVestigingen()

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    const uit = await voerUit(() => bewaarItem('medewerkers', vestiging, mens?.id ?? null, { ...v, email: v.email || null }))
    if (uit.ok && !mens) setV(leeg)
  }

  return (
    <form className="club-instellingen-mens" onSubmit={bewaar}>
      <div className="club-formrij">
        <label className="club-veld">
          <span>Naam</span>
          <input className="club-invoer" required maxLength={80} value={v.naam} onChange={(e) => setV({ ...v, naam: e.target.value })} />
        </label>
        <label className="club-veld">
          <span>E-mail</span>
          <input className="club-invoer" type="email" maxLength={160} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
        </label>
      </div>
      <fieldset className="club-instellingen-keuzes">
        <legend className="club-label">Rollen</legend>
        {MEDEWERKER_ROLLEN.map((r) => (
          <label key={r} className="club-instellingen-keuze">
            <input type="checkbox" checked={v.rollen.includes(r)} onChange={() => setV({ ...v, rollen: wissel(v.rollen, r) })} />
            <span>{ROL_LABEL[r]}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="club-instellingen-keuzes">
        <legend className="club-label">Vestigingen</legend>
        {vestigingen.map((x) => (
          <label key={x.sleutel} className="club-instellingen-keuze">
            <input type="checkbox" checked={v.vestigingen.includes(x.sleutel)} onChange={() => setV({ ...v, vestigingen: wissel(v.vestigingen, x.sleutel) })} />
            <span>{x.naam}</span>
          </label>
        ))}
      </fieldset>
      <div className="club-instellingen-formvoet">
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        {mens && (
          <label className="club-instellingen-check">
            <input type="checkbox" checked={mens.actief} disabled={bezig} onChange={(e) => voerUit(() => bewaarItem('medewerkers', vestiging, mens.id, { actief: e.target.checked }))} />
            <span>{mens.actief ? 'Actief' : 'Uit dienst'}</span>
          </label>
        )}
        <button type="submit" className={`club-knop club-knop--klein${mens ? '' : ' club-knop--primair'}`} disabled={bezig}>
          {mens ? <Save aria-hidden size={14} /> : <Plus aria-hidden size={14} />}
          {mens ? 'Opslaan' : 'Medewerker toevoegen'}
        </button>
      </div>
    </form>
  )
}

/** Alleen voor wie medewerkers mag uitnodigen (Kane, eigenaar, clubmanager met Instellingen); anders null. */
export interface LoginBeheer {
  logins: LoginOverzicht[] | null
  linkBasis: string | null
  loginAan: boolean
}

interface MedewerkersBeheerProps {
  medewerkers: Medewerker[]
  vestiging: Vestiging
  login: LoginBeheer | null
  /** Het eigen id als een medewerker dit beheert: die rij is niet aan te passen. */
  ikZelf: string | null
  /** Privacy (AVG): wie mag wissen (Kane, eigenaar) en welke medewerkers al gewist zijn. */
  privacy: { magWissen: boolean; gewist: readonly string[] }
}

export function MedewerkersBeheer({ medewerkers, vestiging, login, ikZelf, privacy }: MedewerkersBeheerProps) {
  const gewist = new Set(privacy.gewist)
  const perMedewerker = new Map((login?.logins ?? []).map((l) => [l.medewerkerId, l]))
  const hier = medewerkers.filter((m) => m.vestigingen.includes(vestiging))
  const elders = medewerkers.filter((m) => !m.vestigingen.includes(vestiging))
  const naam = useVestigingNaam(vestiging)
  const rij = (m: Medewerker) => (
    <details key={m.id} className="club-instellingen-item" data-uit={!m.actief || undefined}>
      <summary>
        <span className="club-instellingen-item-naam">{m.naam}</span>
        <span className="club-zacht">{m.rollen.map((r) => ROL_LABEL[r]).join(', ') || 'Geen rol'}</span>
        {!m.actief && <span className="club-chip club-chip--uit">{gewist.has(m.id) ? 'Gewist' : 'Uit dienst'}</span>}
      </summary>
      {m.id === ikZelf ? (
        <p className="club-hint">Dit ben jij. Je eigen rollen en vestigingen past de eigenaar of clubmanager aan.</p>
      ) : gewist.has(m.id) ? (
        <p className="club-hint">De gegevens van deze oud-medewerker zijn gewist (AVG). Diensten en uren blijven zonder naam bewaard.</p>
      ) : (
        <MedewerkerFormulier key={`${m.naam}-${m.email}-${m.rollen.join()}-${m.vestigingen.join()}`} mens={m} vestiging={vestiging} />
      )}
      {login && (
        <MedewerkerLogin
          medewerkerId={m.id}
          naam={m.naam}
          emailVoorstel={m.email}
          login={perMedewerker.get(m.id) ?? null}
          inDienst={m.actief}
          linkBasis={login.linkBasis}
          loginAan={login.loginAan}
        />
      )}
      {m.id !== ikZelf && <MedewerkerPrivacy medewerkerId={m.id} naam={m.naam} actief={m.actief} gewist={gewist.has(m.id)} magWissen={privacy.magWissen} />}
    </details>
  )
  return (
    <section className="club-instellingen-sectie club-instellingen-medewerkers">
      <div className="club-instellingen-lijst">
        <h3 className="club-instellingen-kop">
          {naam} <span className="club-getal club-zacht">{hier.length}</span>
        </h3>
        {hier.length === 0 ? <p className="club-leeg">Nog geen medewerkers in deze vestiging.</p> : hier.map(rij)}
        {elders.length > 0 && (
          <>
            <h3 className="club-instellingen-kop">
              Andere vestigingen <span className="club-getal club-zacht">{elders.length}</span>
            </h3>
            {elders.map(rij)}
          </>
        )}
        <div className="club-kaart club-kaart--vlak">
          <h3 className="club-instellingen-kop">Nieuwe medewerker</h3>
          <MedewerkerFormulier mens={null} vestiging={vestiging} />
        </div>
      </div>
      <RollenUitleg />
      {login?.logins === null && (
        <p className="club-melding club-melding--fout" role="alert">De logins van medewerkers konden niet worden gelezen. Is migratie 457 al gedraaid?</p>
      )}
    </section>
  )
}
