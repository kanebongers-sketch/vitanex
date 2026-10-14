'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Save, X } from 'lucide-react'
import { WEEKDAG_LABEL } from '@/lib/club/rooster/openingstijden'
import type { LesSerie, Lestype, Zaal } from '@/lib/club/rooster/typen'
import { useClubActie } from '@/components/club/rooster/vraag'
import { bewaarItem } from './opslaan'

// Een vaste les in het weekrooster toevoegen of aanpassen, in een zijpaneel.
// Wijzigingen gelden voor lessen die daarna worden aangemaakt; lessen die al
// in het rooster staan pas je per les aan in het rooster.

interface Optie {
  id: string
  naam: string
}

interface Props {
  serie: LesSerie | null
  weekdag: number
  vestiging: string
  vandaag: string
  lestypen: Lestype[]
  zalen: Zaal[]
  instructeurs: Optie[]
  onSluit: () => void
}

interface Velden {
  lestypeId: string
  zaalId: string
  instructeurId: string
  weekdag: string
  starttijd: string
  duurMin: string
  capaciteit: string
  vanaf: string
  tot: string
}

function beginWaarden({ serie, weekdag, vandaag, lestypen, zalen }: Props): Velden {
  const type = lestypen.find((t) => t.id === serie?.lestypeId) ?? lestypen.find((t) => t.actief)
  const zaal = zalen.find((z) => z.id === serie?.zaalId) ?? zalen.find((z) => z.actief)
  return {
    lestypeId: type?.id ?? '',
    zaalId: serie ? (serie.zaalId ?? '') : (zaal?.id ?? ''),
    instructeurId: serie?.instructeurId ?? '',
    weekdag: String(serie?.weekdag ?? weekdag),
    starttijd: serie?.starttijd ?? '19:00',
    duurMin: String(serie?.duurMin ?? type?.duurMin ?? 60),
    capaciteit: String(serie?.capaciteit ?? zaal?.capaciteit ?? 20),
    vanaf: serie?.vanaf ?? vandaag,
    tot: serie?.tot ?? '',
  }
}

export function SerieFormulier(props: Props) {
  const { serie, vestiging, lestypen, zalen, instructeurs, onSluit } = props
  const [v, setV] = useState<Velden>(() => beginWaarden(props))
  const { bezig, fout, voerUit } = useClubActie()
  const zet = (k: keyof Velden) => (e: { target: { value: string } }) => setV((oud) => ({ ...oud, [k]: e.target.value }))

  useEffect(() => {
    const opToets = (e: KeyboardEvent) => e.key === 'Escape' && onSluit()
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [onSluit])

  function kiesType(id: string) {
    const type = lestypen.find((t) => t.id === id)
    setV((oud) => ({ ...oud, lestypeId: id, duurMin: serie || !type ? oud.duurMin : String(type.duurMin) }))
  }

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    const velden = {
      lestypeId: v.lestypeId,
      zaalId: v.zaalId || null,
      instructeurId: v.instructeurId || null,
      weekdag: Number(v.weekdag),
      starttijd: v.starttijd,
      duurMin: Number(v.duurMin),
      capaciteit: Number(v.capaciteit),
      vanaf: v.vanaf,
      tot: v.tot || null,
    }
    const uit = await voerUit(() => bewaarItem('weekrooster', vestiging, serie?.id ?? null, velden))
    if (uit.ok) onSluit()
  }

  async function zetActief(actief: boolean) {
    if (!serie) return
    const uit = await voerUit(() => bewaarItem('weekrooster', vestiging, serie.id, { actief }))
    if (uit.ok) onSluit()
  }

  return (
    <div className="club-paneel-scherm" onClick={(e) => e.target === e.currentTarget && onSluit()}>
      <aside className="club-paneel" role="dialog" aria-modal="true" aria-labelledby="club-instellingen-serie-titel">
        <header className="club-instellingen-paneelkop">
          <h2 id="club-instellingen-serie-titel">{serie ? 'Vaste les aanpassen' : 'Vaste les toevoegen'}</h2>
          <button type="button" className="club-knop club-knop--stil" aria-label="Sluiten" onClick={onSluit}>
            <X aria-hidden size={18} />
          </button>
        </header>
        <form className="club-instellingen-serie" onSubmit={bewaar}>
          <label className="club-veld">
            <span>Les</span>
            <select className="club-invoer" required value={v.lestypeId} onChange={(e) => kiesType(e.target.value)}>
              <option value="" disabled>
                Kies een les
              </option>
              {lestypen.filter((t) => t.actief || t.id === v.lestypeId).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.naam}
                </option>
              ))}
            </select>
          </label>
          <div className="club-formrij">
            <label className="club-veld">
              <span>Dag</span>
              <select className="club-invoer" value={v.weekdag} onChange={zet('weekdag')}>
                {WEEKDAG_LABEL.map((d, i) => (
                  <option key={d} value={i + 1}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="club-veld">
              <span>Starttijd</span>
              <input className="club-invoer" type="time" required value={v.starttijd} onChange={zet('starttijd')} />
            </label>
            <label className="club-veld">
              <span>Duur (min)</span>
              <input className="club-invoer" type="number" min={10} max={240} required value={v.duurMin} onChange={zet('duurMin')} />
            </label>
          </div>
          <div className="club-formrij">
            <label className="club-veld">
              <span>Zaal</span>
              <select className="club-invoer" value={v.zaalId} onChange={zet('zaalId')}>
                <option value="">Geen zaal</option>
                {zalen.filter((z) => z.actief || z.id === v.zaalId).map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.naam} ({z.capaciteit})
                  </option>
                ))}
              </select>
            </label>
            <label className="club-veld">
              <span>Capaciteit</span>
              <input className="club-invoer" type="number" min={1} max={500} required value={v.capaciteit} onChange={zet('capaciteit')} />
            </label>
          </div>
          <label className="club-veld">
            <span>Instructeur</span>
            <select className="club-invoer" value={v.instructeurId} onChange={zet('instructeurId')}>
              <option value="">Nog niet bekend</option>
              {instructeurs.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.naam}
                </option>
              ))}
            </select>
          </label>
          <div className="club-formrij">
            <label className="club-veld">
              <span>Vanaf</span>
              <input className="club-invoer" type="date" required value={v.vanaf} onChange={zet('vanaf')} />
            </label>
            <label className="club-veld">
              <span>Tot en met (leeg = doorlopend)</span>
              <input className="club-invoer" type="date" value={v.tot} onChange={zet('tot')} />
            </label>
          </div>
          <p className="club-hint">Geldt voor lessen die hierna worden aangemaakt. Lessen die al in het rooster staan, pas je daar per les aan.</p>
          {fout && <p className="club-fout" role="alert">{fout}</p>}
          <div className="club-instellingen-formvoet">
            {serie && (
              <button type="button" className={`club-knop club-knop--klein${serie.actief ? ' club-knop--gevaar' : ''}`} disabled={bezig} onClick={() => zetActief(!serie.actief)}>
                {serie.actief ? 'Uit het weekrooster halen' : 'Weer aanzetten'}
              </button>
            )}
            <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
              <Save aria-hidden size={16} />
              Opslaan
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}
