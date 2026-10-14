'use client'

import { useCallback, useState } from 'react'
import { CalendarPlus, Plus } from 'lucide-react'
import { WEEKDAG_LABEL } from '@/lib/club/rooster/openingstijden'
import { SOORT_LABEL, type LesSerie, type Lestype, type Zaal } from '@/lib/club/rooster/typen'
import { minutenNaarTijd, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import { stuur, useClubActie } from '@/components/club/rooster/vraag'
import { SerieFormulier } from './SerieFormulier'

// Het vaste weekrooster als raster: per dag de vaste lessen op tijd. Klik op
// een les om hem aan te passen, of op + om er een toe te voegen. Daarna maak
// je met een knop de echte lessen aan voor de komende zes weken.

interface Optie {
  id: string
  naam: string
}

interface Props {
  series: LesSerie[]
  lestypen: Lestype[]
  zalen: Zaal[]
  instructeurs: Optie[]
  medewerkers: Optie[]
  vestiging: string
  vandaag: string
}

type Open = { serie: LesSerie | null; weekdag: number } | null

function Genereren({ vestiging, aantal }: { vestiging: string; aantal: number }) {
  const { bezig, fout, voerUit } = useClubActie()
  const [klaar, setKlaar] = useState<string | null>(null)

  async function maak() {
    setKlaar(null)
    const uit = await voerUit(() => stuur('/api/club/rooster/genereren', 'POST', { vestiging, weken: 6 }))
    if (!uit.ok) return
    const n = typeof uit.data === 'object' && uit.data !== null && 'aangemaakt' in uit.data && typeof uit.data.aangemaakt === 'number' ? uit.data.aangemaakt : 0
    setKlaar(n === 0 ? 'Alles stond er al. Er zijn geen nieuwe lessen nodig.' : `${n} lessen aangemaakt voor de komende 6 weken.`)
  }

  return (
    <div className="club-instellingen-genereer">
      <div>
        <strong>Lessen aanmaken</strong>
        <p className="club-hint">Zet de {aantal} vaste lessen in het rooster voor de komende 6 weken. Lessen die er al staan blijven ongemoeid, dus vaker klikken kan geen kwaad.</p>
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        {klaar && <p className="club-melding club-melding--ok" role="status">{klaar}</p>}
      </div>
      <button type="button" className="club-knop club-knop--primair" disabled={bezig || aantal === 0} onClick={maak}>
        <CalendarPlus aria-hidden size={16} />
        Lessen aanmaken voor de komende 6 weken
      </button>
    </div>
  )
}

export function WeekroosterBeheer({ series, lestypen, zalen, instructeurs, medewerkers, vestiging, vandaag }: Props) {
  const [open, setOpen] = useState<Open>(null)
  const sluit = useCallback(() => setOpen(null), [])
  const typen = new Map(lestypen.map((t) => [t.id, t]))
  const zaalNaam = new Map(zalen.map((z) => [z.id, z.naam]))
  const mensNaam = new Map(medewerkers.map((m) => [m.id, m.naam]))
  const actief = series.filter((s) => s.actief)

  return (
    <section className="club-instellingen-sectie">
      <Genereren vestiging={vestiging} aantal={actief.length} />
      <div className="club-instellingen-week" role="list" aria-label="Vast weekrooster">
        {WEEKDAG_LABEL.map((dag, i) => {
          const vandaagDeDag = series.filter((s) => s.weekdag === i + 1).sort((a, b) => tijdNaarMinuten(a.starttijd) - tijdNaarMinuten(b.starttijd))
          return (
            <div key={dag} className="club-instellingen-weekdag" role="listitem">
              <h3>
                {dag}
                <span className="club-getal">{vandaagDeDag.filter((s) => s.actief).length}</span>
              </h3>
              {vandaagDeDag.map((s) => {
                const type = typen.get(s.lestypeId)
                return (
                  <button
                    key={s.id}
                    type="button"
                    className="club-instellingen-serie-kaart club-rooster-soortstreep"
                    data-soort={type?.soort ?? 'overig'}
                    data-uit={!s.actief || undefined}
                    onClick={() => setOpen({ serie: s, weekdag: s.weekdag })}
                  >
                    <span className="club-instellingen-serie-tijd club-getal">
                      {s.starttijd} tot {minutenNaarTijd(tijdNaarMinuten(s.starttijd) + s.duurMin)}
                    </span>
                    <span className="club-instellingen-serie-naam">{type?.naam ?? 'Onbekende les'}</span>
                    <span className="club-zacht">
                      {[s.instructeurId ? mensNaam.get(s.instructeurId) : 'Instructeur open', s.zaalId ? zaalNaam.get(s.zaalId) : null, `${s.capaciteit} plekken`].filter(Boolean).join(' · ')}
                    </span>
                    {!s.actief && <span className="club-chip club-chip--uit">Uit</span>}
                    <span className="club-sr">{type ? SOORT_LABEL[type.soort] : ''}</span>
                  </button>
                )
              })}
              <button type="button" className="club-instellingen-plus" onClick={() => setOpen({ serie: null, weekdag: i + 1 })} aria-label={`Vaste les toevoegen op ${dag.toLowerCase()}`}>
                <Plus aria-hidden size={16} />
              </button>
            </div>
          )
        })}
      </div>
      {open && (
        <SerieFormulier
          key={open.serie?.id ?? `nieuw-${open.weekdag}`}
          serie={open.serie}
          weekdag={open.weekdag}
          vestiging={vestiging}
          vandaag={vandaag}
          lestypen={lestypen}
          zalen={zalen}
          instructeurs={instructeurs}
          onSluit={sluit}
        />
      )}
    </section>
  )
}
