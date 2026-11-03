'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { TakenlijstKeuze } from '@/lib/club/prikbord/opslag'
import type { WerkwijzeWeergave } from '@/lib/club/prikbord/weergave'
import { stuur } from '@/components/club/leden/stuur'
import { WerkwijzeEditor } from './WerkwijzeEditor'
import { WerkwijzeUitvoeren } from './WerkwijzeUitvoeren'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'

// Een werkwijze: naam, soort, versie en stappen. Lezen klapt de stappen uit,
// Uitvoeren opent de afvinklijst, en wie mag beheren maakt een nieuwe versie,
// koppelt een takenlijst of archiveert. De leiding ziet de laatste uitvoeringen.

export type Modus = 'lezen' | 'uitvoeren' | 'bewerken'

interface Props {
  w: WerkwijzeWeergave
  vestigingen: readonly VestigingInfo[]
  vestiging: string | null
  magBeheren: boolean
  kanUitvoeren: boolean
  takenlijsten: readonly TakenlijstKeuze[]
  modus: Modus | null
  onModus: (m: Modus | null) => void
}

export function WerkwijzeKaart({ w, vestigingen, vestiging, magBeheren, kanUitvoeren, takenlijsten, modus, onModus }: Props) {
  const tekst = useTekst(PRIKBORD)
  const t = tekst.werkwijzen
  const taal = useTaal()
  const router = useRouter()
  const [fout, setFout] = useState<string | null>(null)
  const d = w.werkwijze
  const wissel = (m: Modus) => onModus(modus === m ? null : m)

  async function wijzig(body: Record<string, unknown>) {
    setFout(null)
    const uit = await stuur(`/api/club/prikbord/werkwijzen/${d.id}`, 'PATCH', body)
    if (!uit.ok) return setFout(uit.fout)
    router.refresh()
  }

  const vestigingNaam = (s: string) => vestigingen.find((v) => v.sleutel === s)?.naam ?? s

  return (
    <article className="pb-werkwijze" id={`werkwijze-${d.id}`} data-open={modus ? '' : undefined}>
      <div className="pb-mededeling-kop">
        <h3>{d.titel}</h3>
        <div className="pb-chips">
          <span className="club-chip club-chip--geen">{tekst.soorten[d.soort]}</span>
          <span className="club-chip club-chip--geen club-getal">{t.versie(d.versie)}</span>
        </div>
      </div>
      <p className="pb-meta">
        {t.stappen(d.stappen.length)}
        {d.bijgewerktOp ? ` · ${t.bijgewerkt(formatDatum(d.bijgewerktOp, taal, 'dagMaand'))}` : ''}
        {w.mijnVersie !== null ? ` · ${t.jouwVersie(w.mijnVersie)}` : ''}
      </p>
      {d.watAnders ? (
        <p className="pb-wat-anders">
          <b>{t.watAnders}:</b> {d.watAnders}
        </p>
      ) : null}
      <div className="pb-acties">
        <button type="button" className="club-knop club-knop--klein" aria-expanded={modus === 'lezen'} onClick={() => wissel('lezen')}>
          {t.lezen}
        </button>
        {kanUitvoeren ? (
          <button type="button" className="club-knop club-knop--klein club-knop--primair" aria-expanded={modus === 'uitvoeren'} onClick={() => wissel('uitvoeren')}>
            {t.uitvoeren}
          </button>
        ) : null}
        {magBeheren ? (
          <>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" aria-expanded={modus === 'bewerken'} onClick={() => wissel('bewerken')}>
              {t.bewerken}
            </button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => void wijzig({ gearchiveerd: true })}>
              {t.archiveren}
            </button>
          </>
        ) : null}
      </div>
      {fout ? (
        <p className="club-melding club-melding--fout" role="alert">
          {fout}
        </p>
      ) : null}
      {modus === 'lezen' ? (
        <ol className="pb-stappen">
          {d.stappen.map((s, i) => (
            <li key={i}>
              <b>{s.tekst}</b>
              {s.uitleg ? <span className="club-hint">{s.uitleg}</span> : null}
            </li>
          ))}
        </ol>
      ) : null}
      {modus === 'uitvoeren' ? <WerkwijzeUitvoeren werkwijze={d} vestigingen={vestigingen} vestiging={vestiging} onKlaar={() => onModus(null)} /> : null}
      {modus === 'bewerken' ? (
        <>
          <WerkwijzeEditor key={d.versie} werkwijze={d} vestigingen={vestigingen} takenlijsten={takenlijsten} onKlaar={() => onModus(null)} />
          {takenlijsten.length > 0 ? (
            <label className="club-veld pb-smal">
              <span>{t.takenlijst}</span>
              <select className="club-invoer" value={d.takenlijstId ?? ''} onChange={(e) => void wijzig({ takenlijstId: e.target.value || null })}>
                <option value="">{t.geenTakenlijst}</option>
                {takenlijsten.map((l) => (
                  <option key={l.id} value={l.id}>
                    {vestigingen.length > 1 ? `${l.naam} · ${vestigingNaam(l.vestiging)}` : l.naam}
                  </option>
                ))}
              </select>
              <span className="club-hint">{t.takenlijstUitleg}</span>
            </label>
          ) : null}
        </>
      ) : null}
      {magBeheren ? (
        <div className="pb-uitvoeringen">
          <span className="club-label">{t.laatste}</span>
          {w.uitvoeringen.length === 0 ? (
            <span className="club-hint">{t.geenUitvoeringen}</span>
          ) : (
            <ul>
              {w.uitvoeringen.map((u) => (
                <li key={u.id}>
                  {t.uitvoeringDoor(u.door ?? tekst.leiding, formatDatum(u.op, taal, 'dagMaand'), vestigingNaam(u.vestiging))} · <span className="club-getal">{t.afgevinktVan(u.klaar, u.totaal)}</span>
                  {u.notitie ? <span className="club-hint"> {u.notitie}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </article>
  )
}
