'use client'

import { useMemo, useState } from 'react'
import { Archive, Plus, Search } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { MAPPEN, leesKladAntwoord, pastKlad, sorteerKlad, voorproef, type KladMap, type KladNotitie } from '@/lib/club/kladblok/model'
import { stuur } from '@/components/club/leden/stuur'
import { vinkStand } from '@/lib/club/kladblok/opmaak'
import { NotitieEditor } from './NotitieEditor'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { NOTITIES } from '@/lib/aiyourgym/taal/woorden/club/notities'

// Notities à la Evernote: links de lijst (zoeken, mappen, archief), rechts de
// notitie zelf. Op de telefoon eerst de lijst, na een tik de notitie. De open
// notitie staat in de URL (?n=<id>), zodat terug/vooruit en delen werken.

interface Props {
  vestiging: Vestiging
  begin: KladNotitie[]
  startId: string | null
}

/** " · 2/5 afgevinkt" als de notitie afvinkpunten heeft, anders leeg. */
function vinkTekst(inhoud: string, afgevinkt: (klaar: number, totaal: number) => string): string {
  const v = vinkStand(inhoud)
  return v.totaal > 0 ? ` · ${afgevinkt(v.klaar, v.totaal)}` : ''
}

function zetUrl(id: string | null) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('n', id)
  else url.searchParams.delete('n')
  window.history.replaceState(null, '', url)
}

export function Kladblok({ vestiging, begin, startId }: Props) {
  const [notities, setNotities] = useState<KladNotitie[]>(begin)
  const [openId, setOpenId] = useState<string | null>(startId && begin.some((n) => n.id === startId) ? startId : null)
  const [zoek, setZoek] = useState('')
  const [map, setMap] = useState<KladMap | null>(null)
  const [archief, setArchief] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const taal = useTaal()
  const tekst = useTekst(NOTITIES)
  const t = tekst.lijst

  const zichtbaar = useMemo(
    () => notities.filter((n) => pastKlad(n, { vestiging, map, zoek, archief })).sort(sorteerKlad),
    [notities, vestiging, map, zoek, archief],
  )
  const open = notities.find((n) => n.id === openId) ?? null

  function kies(id: string | null) {
    setOpenId(id)
    zetUrl(id)
  }

  function vervang(n: KladNotitie) {
    setNotities((nu) => nu.map((x) => (x.id === n.id ? n : x)))
  }

  async function nieuw() {
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await stuur('/api/club/kladblok', 'POST', { map: map ?? 'algemeen', vestiging })
    setBezig(false)
    const n = uit.ok ? leesKladAntwoord(uit.data) : null
    if (!n) return setFout(uit.ok ? t.onverwacht : uit.fout)
    setNotities((nu) => [n, ...nu])
    setArchief(false)
    setZoek('')
    kies(n.id)
  }

  function weg(id: string) {
    setNotities((nu) => nu.filter((x) => x.id !== id))
    kies(null)
  }

  return (
    <div className={`kb${open ? ' kb--open' : ''}`}>
      <aside className="kb-lijst" aria-label={t.label}>
        <div className="kb-lijst-kop">
          <button type="button" className="club-knop club-knop--primair" onClick={() => void nieuw()} disabled={bezig}>
            <Plus size={16} aria-hidden /> {t.nieuw}
          </button>
          <label className="kb-zoek">
            <Search size={16} aria-hidden />
            <span className="club-sr">{t.zoekLabel}</span>
            <input className="club-invoer" type="search" value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder={t.zoekPlaats} />
          </label>
          <div className="kb-mappen" role="group" aria-label={t.mapLabel}>
            <button type="button" className="kb-map" aria-pressed={map === null} onClick={() => setMap(null)}>{t.alles}</button>
            {MAPPEN.map((m) => (
              <button key={m} type="button" className="kb-map" aria-pressed={map === m} onClick={() => setMap(m)}>{tekst.map[m]}</button>
            ))}
            <button type="button" className="kb-map" aria-pressed={archief} onClick={() => setArchief((x) => !x)}>
              <Archive size={13} aria-hidden /> {t.archief}
            </button>
          </div>
        </div>
        {fout ? <p className="club-melding club-melding--fout" role="alert">{fout}</p> : null}
        {zichtbaar.length === 0 ? (
          <p className="club-leeg">
            {zoek ? t.nietsGevonden : archief ? t.archiefLeeg : t.leeg}
          </p>
        ) : (
          <ul className="kb-items">
            {zichtbaar.map((n) => (
              <li key={n.id}>
                <button type="button" className="kb-item" aria-current={n.id === openId ? 'true' : undefined} onClick={() => kies(n.id)}>
                  <span className="kb-item-titel">{n.vastgepind ? <span className="kb-pin" aria-label={t.vastgepind}>●</span> : null}{n.titel}</span>
                  <span className="kb-item-tekst">{voorproef(n.inhoud) || t.legeNotitie}</span>
                  <span className="kb-item-meta">
                    {tekst.map[n.map]} · {n.vestiging ? '' : `${t.alleVestigingen} · `}{formatDatum(n.bijgewerktOp, taal, 'dagMaand')}{vinkTekst(n.inhoud, t.afgevinkt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
      <section className="kb-editor" aria-label={t.notitie}>
        {open ? (
          <NotitieEditor key={open.id} notitie={open} vestiging={vestiging} onWijziging={vervang} onWeg={weg} onSluit={() => kies(null)} />
        ) : (
          <p className="club-leeg kb-niets">{t.kies}</p>
        )}
      </section>
    </div>
  )
}
