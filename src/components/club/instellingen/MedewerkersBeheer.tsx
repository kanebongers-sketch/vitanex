'use client'

import { useState, type FormEvent } from 'react'
import { Plus, Save } from 'lucide-react'
import { MEDEWERKER_ROLLEN, RECHTEN, ROL_LABEL, type Medewerker, type MedewerkerRol } from '@/lib/club/kern/medewerker'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { useVestigingen, useVestigingNaam } from '@/components/club/shell/VestigingenContext'
import { ONDERDELEN } from '@/components/club/shell/onderdelen'
import { useClubActie } from '@/components/club/rooster/vraag'
import { bewaarItem } from './opslaan'

// Medewerkers met hun rollen en vestigingen. De rollen bepalen straks wat
// iemand ziet; in de testfase werkt alleen Kane erin.

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
      <p className="club-hint">Nu, in de testfase, ziet alleen Kane de clubsoftware. Deze rechten gaan pas gelden als medewerkers zelf inloggen.</p>
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

export function MedewerkersBeheer({ medewerkers, vestiging }: { medewerkers: Medewerker[]; vestiging: Vestiging }) {
  const hier = medewerkers.filter((m) => m.vestigingen.includes(vestiging))
  const elders = medewerkers.filter((m) => !m.vestigingen.includes(vestiging))
  const naam = useVestigingNaam(vestiging)
  const rij = (m: Medewerker) => (
    <details key={m.id} className="club-instellingen-item" data-uit={!m.actief || undefined}>
      <summary>
        <span className="club-instellingen-item-naam">{m.naam}</span>
        <span className="club-zacht">{m.rollen.map((r) => ROL_LABEL[r]).join(', ') || 'Geen rol'}</span>
        {!m.actief && <span className="club-chip club-chip--uit">Uit dienst</span>}
      </summary>
      <MedewerkerFormulier key={`${m.naam}-${m.email}-${m.rollen.join()}-${m.vestigingen.join()}`} mens={m} vestiging={vestiging} />
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
    </section>
  )
}
