'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Search, X } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'
import { ROL_CATEGORIEEN, type Rol } from '@/lib/club/rollen/typen'
import type { TeamLid } from '@/lib/club/rollen/opslag'
import { Avatar } from '@/components/club/ontwerp/Avatar'
import './rollen.css'

// Team (rollen v2): iedereen met zijn rollen, per categorie (Leiding, Vloer,
// Planning en administratie). Klik op een persoon: rechts (op de telefoon
// eronder) een paneel om de rollen te zetten. Wat de kijker niet mag geven,
// staat er met een slot (regels in src/lib/club/rollen/escalatie.ts; de API
// controleert ze opnieuw).

interface TeamBeheerProps {
  team: TeamLid[]
  /** De rollen die deze kijker mag geven en weghalen. */
  magGeven: Rol[]
  /** Het totaal aantal vestigingen van de sportschool. */
  aantalVestigingen: number
  /** Link naar Medewerkers (nieuwe persoon, uitnodigen, vestigingen). */
  nieuwHref: string | null
  rechtenHref: string | null
}

export function TeamBeheer({ team, magGeven, aantalVestigingen, nieuwHref, rechtenHref }: TeamBeheerProps) {
  const tekst = useTekst(ROLLEN_TEKST)
  const router = useRouter()
  const [zoek, setZoek] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const lijst = useMemo(() => {
    const z = zoek.trim().toLowerCase()
    return z ? team.filter((p) => p.naam.toLowerCase().includes(z)) : team
  }, [team, zoek])
  const gekozen = team.find((p) => p.id === open) ?? null

  return (
    <div className="club-team">
      <div className="club-team-balk">
        <label className="club-team-zoek">
          <Search size={16} aria-hidden />
          <span className="club-sr">{tekst.team.zoek}</span>
          <input type="search" value={zoek} placeholder={tekst.team.zoek} onChange={(e) => setZoek(e.target.value)} />
        </label>
        <div className="club-team-links">
          {rechtenHref && <a className="club-knop club-knop--stil" href={rechtenHref}>{tekst.team.rechtenLink}</a>}
          {nieuwHref && <a className="club-knop club-knop--primair" href={nieuwHref}>{tekst.team.nieuw}</a>}
        </div>
      </div>

      <div className={`club-team-raster${gekozen ? ' heeft-paneel' : ''}`}>
        <ul className="club-team-lijst">
          {lijst.length === 0 && <li className="club-rollen-leeg">{tekst.team.geen}</li>}
          {lijst.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`club-team-persoon${p.id === open ? ' is-open' : ''}${p.actief ? '' : ' is-inactief'}`}
                aria-expanded={p.id === open}
                aria-label={tekst.team.bewerk(p.naam)}
                onClick={() => setOpen(p.id === open ? null : p.id)}
              >
                <Avatar naam={p.naam} foto={{ soort: 'mw', id: p.id, versie: p.foto }} />
                <span className="club-team-wie">
                  <strong>{p.naam}</strong>
                  <small>
                    {p.alleVestigingen ? tekst.team.alleVestigingen : tekst.team.vestigingen(Math.min(p.vestigingen.length, aantalVestigingen))}
                    {!p.actief && ` · ${tekst.team.inactief}`}
                  </small>
                </span>
                <span className="club-team-chips">
                  {p.rollen.length === 0 && <span className="club-chip club-chip--uit club-chip--geen">{tekst.team.geenRol}</span>}
                  {ROL_CATEGORIEEN.flatMap((c) =>
                    c.rollen.filter((r) => p.rollen.includes(r)).map((r) => (
                      <span key={r} className={`club-chip club-team-chip club-team-chip--${c.sleutel}`}>{tekst.rollen[r]}</span>
                    )),
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {gekozen && <RollenPaneel key={gekozen.id} lid={gekozen} magGeven={magGeven} onSluit={() => setOpen(null)} onOpgeslagen={() => router.refresh()} />}
      </div>
      <p className="club-team-fase2">{tekst.team.fase2}</p>
    </div>
  )
}

interface RollenPaneelProps {
  lid: TeamLid
  magGeven: Rol[]
  onSluit: () => void
  onOpgeslagen: () => void
}

function RollenPaneel({ lid, magGeven, onSluit, onOpgeslagen }: RollenPaneelProps) {
  const tekst = useTekst(ROLLEN_TEKST)
  const [rollen, setRollen] = useState<Rol[]>(lid.rollen)
  const [alle, setAlle] = useState(lid.alleVestigingen)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const gewijzigd = alle !== lid.alleVestigingen || rollen.length !== lid.rollen.length || rollen.some((r) => !lid.rollen.includes(r))

  function wissel(rol: Rol) {
    setMelding(null)
    setRollen((oud) => (oud.includes(rol) ? oud.filter((r) => r !== rol) : [...oud, rol]))
  }

  async function bewaar() {
    setBezig(true)
    setMelding(null)
    const uit = await stuur(`/api/club/team/${lid.id}`, 'PATCH', { rollen, alleVestigingen: alle })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: tekst.team.opgeslagen })
    onOpgeslagen()
  }

  return (
    <aside className="club-team-paneel" aria-labelledby="club-team-paneel-kop">
      <div className="club-team-paneel-kop">
        <div>
          <p className="club-boventitel">{tekst.team.paneelKop}</p>
          <h2 id="club-team-paneel-kop">{lid.naam}</h2>
          {lid.email && <p className="club-team-mail">{lid.email}</p>}
        </div>
        <button type="button" className="club-team-sluit" aria-label={tekst.team.sluiten} onClick={onSluit}><X size={18} aria-hidden /></button>
      </div>
      <p className="club-team-uitleg">{tekst.team.paneelUitleg}</p>
      {ROL_CATEGORIEEN.map((c) => (
        <fieldset key={c.sleutel} className="club-team-categorie">
          <legend>{tekst.categorieen[c.sleutel]}</legend>
          {c.rollen.map((r) => {
            const mag = magGeven.includes(r)
            const aan = rollen.includes(r)
            return (
              <button
                key={r}
                type="button"
                className={`club-team-rol club-team-chip--${c.sleutel}${aan ? ' is-aan' : ''}`}
                aria-pressed={aan}
                disabled={!mag || bezig}
                title={mag ? undefined : tekst.team.slotEigenaar}
                onClick={() => wissel(r)}
              >
                <span className="club-team-rol-naam">
                  {!mag && <Lock size={13} aria-hidden />}
                  {tekst.rollen[r]}
                </span>
                <small>{mag ? tekst.rolUitleg[r] : tekst.team.slotEigenaar}</small>
              </button>
            )
          })}
        </fieldset>
      ))}
      <label className="club-team-alle">
        <input type="checkbox" checked={alle} disabled={bezig} onChange={(e) => setAlle(e.target.checked)} />
        {tekst.team.alleVestigingenLabel}
      </label>
      <div className="club-beheer-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig || !gewijzigd} onClick={() => void bewaar()}>
          {bezig ? tekst.team.bezig : tekst.team.opslaan}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>
    </aside>
  )
}
