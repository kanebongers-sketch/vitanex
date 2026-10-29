'use client'

import { useCallback, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { SOORTEN, leesBerichtAntwoord, type Bericht } from '@/lib/club/berichten/model'
import { pastInFilters, sorteerVoorBeheer, telPerStatus, type BeheerFilters, type BerichtStatus } from '@/lib/club/berichten/regels'
import { stuur } from '@/components/club/leden/stuur'
import { BerichtFormulier } from './BerichtFormulier'
import { BerichtRij, type RijActie } from './BerichtRij'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BERICHTEN } from '@/lib/aiyourgym/taal/woorden/club/berichten'

// Beheer van de berichten: tellers per status, filters (in de URL), de lijst
// en het paneel voor nieuw of bewerken.

interface Props {
  begin: Bericht[]
  vestigingen: VestigingInfo[]
  tags: string[]
  startFilters: BeheerFilters
  nuIso: string
}

type Open = { soort: 'nieuw' } | { soort: 'bewerk'; id: string } | null

const STATUSSEN: BerichtStatus[] = ['actief', 'gepland', 'verlopen']

function zetUrl(f: BeheerFilters) {
  const url = new URL(window.location.href)
  const zet = (k: string, w: string | null) => (w ? url.searchParams.set(k, w) : url.searchParams.delete(k))
  zet('status', f.status === 'alle' ? null : f.status)
  zet('soort', f.soort === 'alle' ? null : f.soort)
  zet('voor', f.vestiging)
  window.history.replaceState(null, '', url)
}

export function BerichtenWerkvlak({ begin, vestigingen, tags, startFilters, nuIso }: Props) {
  const [berichten, setBerichten] = useState(begin)
  const [filters, setFilters] = useState(startFilters)
  const [open, setOpen] = useState<Open>(null)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const [bezigId, setBezigId] = useState<string | null>(null)
  // Vast tijdens het renderen (geen hydration-verschil), ververst na elke wijziging.
  const [nu, setNu] = useState(() => new Date(nuIso))
  const tb = useTekst(BERICHTEN)
  const t = tb.werkvlak

  const tel = useMemo(() => telPerStatus(berichten, nu), [berichten, nu])
  const zichtbaar = useMemo(() => sorteerVoorBeheer(berichten.filter((b) => pastInFilters(b, filters, nu)), nu), [berichten, filters, nu])
  const bewerkt = open?.soort === 'bewerk' ? (berichten.find((b) => b.id === open.id) ?? null) : null
  const sluit = useCallback(() => setOpen(null), [])

  function filter(patch: Partial<BeheerFilters>) {
    const nieuw = { ...filters, ...patch }
    setFilters(nieuw)
    zetUrl(nieuw)
  }

  function opgeslagen(b: Bericht, nieuw: boolean) {
    setBerichten((lijst) => (nieuw ? [b, ...lijst] : lijst.map((x) => (x.id === b.id ? b : x))))
    setNu(new Date())
    setOpen(null)
    setMelding({ ok: true, tekst: nieuw ? t.klaar(b.titel) : t.bijgewerkt(b.titel) })
  }

  async function actie(b: Bericht, a: RijActie) {
    setBezigId(b.id)
    setMelding(null)
    const url = `/api/club/berichten/${b.id}`
    const uit =
      a === 'verwijderen'
        ? await stuur(url, 'DELETE')
        : await stuur(url, 'PATCH', a === 'stoppen' ? { actie: 'stoppen' } : { actie: 'vastpinnen', vastgepind: a === 'vastpinnen' })
    setBezigId(null)
    setNu(new Date())
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    if (a === 'verwijderen') {
      setBerichten((lijst) => lijst.filter((x) => x.id !== b.id))
      return setMelding({ ok: true, tekst: t.verwijderd(b.titel) })
    }
    const nieuw = leesBerichtAntwoord(uit.data)
    if (!nieuw) return setMelding({ ok: false, tekst: t.onverwacht })
    setBerichten((lijst) => lijst.map((x) => (x.id === nieuw.id ? nieuw : x)))
    const tekst = { vastpinnen: t.vastgepind, losmaken: t.losgemaakt, stoppen: t.gestopt }[a]
    setMelding({ ok: true, tekst: tekst(nieuw.titel) })
  }

  return (
    <>
      <div className="club-bericht-balk">
        <div className="club-bericht-tellers" role="group" aria-label={t.filterStatus}>
          <button type="button" aria-pressed={filters.status === 'alle'} onClick={() => filter({ status: 'alle' })}>
            <strong>{berichten.length}</strong> {t.alle}
          </button>
          {STATUSSEN.map((s) => (
            <button key={s} type="button" aria-pressed={filters.status === s} className={`club-bericht-teller--${s}`} onClick={() => filter({ status: s })}>
              <strong>{tel[s]}</strong> {tb.status[s]}
            </button>
          ))}
        </div>
        <button type="button" className="club-knop club-knop--primair" onClick={() => setOpen({ soort: 'nieuw' })}>
          <Plus size={16} aria-hidden /> {t.nieuw}
        </button>
      </div>

      <div className="club-bericht-filters">
        <div className="club-segment" role="group" aria-label={t.filterSoort}>
          {(['alle', ...SOORTEN] as const).map((s) => (
            <button key={s} type="button" aria-pressed={filters.soort === s} onClick={() => filter({ soort: s })}>
              {s === 'alle' ? t.alleSoorten : tb.soort[s]}
            </button>
          ))}
        </div>
        {vestigingen.length > 1 && (
          <label className="club-veld club-bericht-voorveld">
            <span className="club-sr">{t.voorVestiging}</span>
            <select className="club-invoer" value={filters.vestiging ?? ''} onChange={(e) => filter({ vestiging: e.target.value || null })}>
              <option value="">{t.alleVestigingen}</option>
              {vestigingen.map((v) => (
                <option key={v.sleutel} value={v.sleutel}>
                  {t.zichtbaarIn(v.naam)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div aria-live="polite" role="status">
        {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
      </div>

      {zichtbaar.length === 0 ? (
        <p className="club-leeg">{berichten.length === 0 ? t.geenBerichten : t.geenMetFilters}</p>
      ) : (
        <ul className="club-bericht-lijst">
          {zichtbaar.map((b) => (
            <BerichtRij key={b.id} bericht={b} vestigingen={vestigingen} nu={nu} bezig={bezigId === b.id} onBewerk={() => setOpen({ soort: 'bewerk', id: b.id })} onActie={(a) => actie(b, a)} />
          ))}
        </ul>
      )}

      {open && (open.soort === 'nieuw' || bewerkt) && (
        <BerichtFormulier key={open.soort === 'bewerk' ? open.id : 'nieuw'} bericht={bewerkt} vestigingen={vestigingen} tags={tags} onOpgeslagen={opgeslagen} onSluit={sluit} />
      )}
    </>
  )
}
