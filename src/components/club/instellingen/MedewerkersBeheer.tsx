'use client'

import { useState, type FormEvent } from 'react'
import { Plus, Save } from 'lucide-react'
import { MEDEWERKER_ROLLEN, RECHTEN, rolLabel, type Medewerker, type MedewerkerRol } from '@/lib/club/kern/medewerker'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { INSTELLINGEN } from '@/lib/aiyourgym/taal/woorden/club/instellingen'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { useVestigingen, useVestigingNaam } from '@/components/club/shell/VestigingenContext'
import { ONDERDELEN, onderdeelInTaal } from '@/components/club/shell/onderdelen'
import { useClubActie } from '@/components/club/rooster/vraag'
import type { LoginOverzicht } from '@/lib/club/medewerker-login/medewerker-login'
import { bewaarItem } from './opslaan'
import { MedewerkerLogin } from './MedewerkerLogin'
import { MedewerkerPrivacy } from './MedewerkerPrivacy'

// Medewerkers met hun rollen en vestigingen. De rollen bepalen wat iemand ziet
// als hij zelf inlogt; de eigenaar of clubmanager deelt hier de inloglink uit.

export function RollenUitleg() {
  const taal = useTaal()
  const t = useTekst(INSTELLINGEN).medewerkers
  const onderdeelLabel = new Map(ONDERDELEN.map((o) => [o.sleutel, onderdeelInTaal(o, taal).label]))
  return (
    <section className="club-kaart club-kaart--vlak club-instellingen-rollen" aria-label={t.rollenKop}>
      <h3 className="club-instellingen-kop">{t.rollenKop}</h3>
      <dl>
        {MEDEWERKER_ROLLEN.map((rol) => (
          <div key={rol}>
            <dt>{rolLabel(rol, taal)}</dt>
            <dd>{RECHTEN[rol].map((s) => onderdeelLabel.get(s) ?? s).join(', ')}</dd>
          </div>
        ))}
      </dl>
      <p className="club-hint">{t.rollenUitleg}</p>
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
  const taal = useTaal()
  const tekst = useTekst(INSTELLINGEN)
  const t = tekst.medewerkers

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    const uit = await voerUit(() => bewaarItem('medewerkers', vestiging, mens?.id ?? null, { ...v, email: v.email || null }))
    if (uit.ok && !mens) setV(leeg)
  }

  return (
    <form className="club-instellingen-mens" onSubmit={bewaar}>
      <div className="club-formrij">
        <label className="club-veld">
          <span>{tekst.algemeen.naam}</span>
          <input className="club-invoer" required maxLength={80} value={v.naam} onChange={(e) => setV({ ...v, naam: e.target.value })} />
        </label>
        <label className="club-veld">
          <span>{tekst.algemeen.email}</span>
          <input className="club-invoer" type="email" maxLength={160} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
        </label>
      </div>
      <fieldset className="club-instellingen-keuzes">
        <legend className="club-label">{t.rollen}</legend>
        {MEDEWERKER_ROLLEN.map((r) => (
          <label key={r} className="club-instellingen-keuze">
            <input type="checkbox" checked={v.rollen.includes(r)} onChange={() => setV({ ...v, rollen: wissel(v.rollen, r) })} />
            <span>{rolLabel(r, taal)}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="club-instellingen-keuzes">
        <legend className="club-label">{t.vestigingen}</legend>
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
            <span>{mens.actief ? t.actief : t.uitDienst}</span>
          </label>
        )}
        <button type="submit" className={`club-knop club-knop--klein${mens ? '' : ' club-knop--primair'}`} disabled={bezig}>
          {mens ? <Save aria-hidden size={14} /> : <Plus aria-hidden size={14} />}
          {mens ? tekst.algemeen.opslaan : t.toevoegen}
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
  /** Rollen v2: de link naar Team, waar alle rollen (ook eigenaar en roosteraar) worden gegeven. */
  teamHref?: string | null
}

export function MedewerkersBeheer({ medewerkers, vestiging, login, ikZelf, privacy, teamHref = null }: MedewerkersBeheerProps) {
  const gewist = new Set(privacy.gewist)
  const perMedewerker = new Map((login?.logins ?? []).map((l) => [l.medewerkerId, l]))
  const hier = medewerkers.filter((m) => m.vestigingen.includes(vestiging))
  const elders = medewerkers.filter((m) => !m.vestigingen.includes(vestiging))
  const naam = useVestigingNaam(vestiging)
  const taal = useTaal()
  const t = useTekst(INSTELLINGEN).medewerkers
  const rij = (m: Medewerker) => (
    <details key={m.id} className="club-instellingen-item" data-uit={!m.actief || undefined}>
      <summary>
        <span className="club-instellingen-item-naam">{m.naam}</span>
        <span className="club-zacht">{m.rollen.map((r) => rolLabel(r, taal)).join(', ') || t.geenRol}</span>
        {!m.actief && <span className="club-chip club-chip--uit">{gewist.has(m.id) ? t.gewist : t.uitDienst}</span>}
      </summary>
      {m.id === ikZelf ? (
        <p className="club-hint">{t.ikZelf}</p>
      ) : gewist.has(m.id) ? (
        <p className="club-hint">{t.gewistUitleg}</p>
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
        {teamHref && (
          <p className="club-melding" role="note">
            {t.naarTeam} <a href={teamHref}>{t.naarTeamLink}</a>
          </p>
        )}
        <h3 className="club-instellingen-kop">
          {naam} <span className="club-getal club-zacht">{hier.length}</span>
        </h3>
        {hier.length === 0 ? <p className="club-leeg">{t.leeg}</p> : hier.map(rij)}
        {elders.length > 0 && (
          <>
            <h3 className="club-instellingen-kop">
              {t.anderen} <span className="club-getal club-zacht">{elders.length}</span>
            </h3>
            {elders.map(rij)}
          </>
        )}
        <div className="club-kaart club-kaart--vlak">
          <h3 className="club-instellingen-kop">{t.nieuw}</h3>
          <MedewerkerFormulier mens={null} vestiging={vestiging} />
        </div>
      </div>
      <RollenUitleg />
      {login?.logins === null && (
        <p className="club-melding club-melding--fout" role="alert">{t.loginsFout}</p>
      )}
    </section>
  )
}
