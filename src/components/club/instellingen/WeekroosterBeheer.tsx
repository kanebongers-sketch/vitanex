'use client'

import { useCallback, useState } from 'react'
import { CalendarPlus, Plus } from 'lucide-react'
import type { LesSerie, Lestype, Zaal } from '@/lib/club/rooster/typen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { INSTELLINGEN } from '@/lib/aiyourgym/taal/woorden/club/instellingen'
import { ROOSTER } from '@/lib/aiyourgym/taal/woorden/club/rooster'
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
  const t = useTekst(INSTELLINGEN).week

  async function maak() {
    setKlaar(null)
    const uit = await voerUit(() => stuur('/api/club/rooster/genereren', 'POST', { vestiging, weken: 6 }))
    if (!uit.ok) return
    const n = typeof uit.data === 'object' && uit.data !== null && 'aangemaakt' in uit.data && typeof uit.data.aangemaakt === 'number' ? uit.data.aangemaakt : 0
    setKlaar(t.aangemaakt(n))
  }

  return (
    <div className="club-instellingen-genereer">
      <div>
        <strong>{t.aanmakenKop}</strong>
        <p className="club-hint">{t.aanmakenUitleg(aantal)}</p>
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        {klaar && <p className="club-melding club-melding--ok" role="status">{klaar}</p>}
      </div>
      <button type="button" className="club-knop club-knop--primair" disabled={bezig || aantal === 0} onClick={maak}>
        <CalendarPlus aria-hidden size={16} />
        {t.aanmaken}
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
  const tekst = useTekst(INSTELLINGEN)
  const t = tekst.week
  const soorten = useTekst(ROOSTER).soort

  return (
    <section className="club-instellingen-sectie">
      <Genereren vestiging={vestiging} aantal={actief.length} />
      <div className="club-instellingen-week" role="list" aria-label={t.raster}>
        {tekst.weekdagen.map((dag, i) => {
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
                      {t.tijd(s.starttijd, minutenNaarTijd(tijdNaarMinuten(s.starttijd) + s.duurMin))}
                    </span>
                    <span className="club-instellingen-serie-naam">{type?.naam ?? t.onbekendeLes}</span>
                    <span className="club-zacht">
                      {[s.instructeurId ? mensNaam.get(s.instructeurId) : t.instructeurOpen, s.zaalId ? zaalNaam.get(s.zaalId) : null, t.plekken(s.capaciteit)].filter(Boolean).join(' · ')}
                    </span>
                    {!s.actief && <span className="club-chip club-chip--uit">{tekst.algemeen.uit}</span>}
                    <span className="club-sr">{type ? soorten[type.soort] : ''}</span>
                  </button>
                )
              })}
              <button type="button" className="club-instellingen-plus" onClick={() => setOpen({ serie: null, weekdag: i + 1 })} aria-label={t.toevoegenOp(dag)}>
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
