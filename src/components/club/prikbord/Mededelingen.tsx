'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Check, Plus } from 'lucide-react'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { MededelingWeergave } from '@/lib/club/prikbord/weergave'
import { stuur } from '@/components/club/leden/stuur'
import { MededelingFormulier } from './MededelingFormulier'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'

// Blok 1 van het Prikbord: mededelingen. Wat voor jou open staat eerst; bij
// een verplichte de knop "Gelezen en begrepen". Wie mag plaatsen ziet per
// mededeling "7 van 9 bevestigd" en wie nog niet, en kan archiveren.

interface Props {
  lopend: readonly MededelingWeergave[]
  archief: readonly MededelingWeergave[]
  vestigingen: readonly VestigingInfo[]
  magPlaatsen: boolean
  kanBevestigen: boolean
  onOpenWerkwijze: (id: string) => void
}

export function Mededelingen({ lopend, archief, vestigingen, magPlaatsen, kanBevestigen, onOpenWerkwijze }: Props) {
  const t = useTekst(PRIKBORD).mededelingen
  const [schrijven, setSchrijven] = useState(false)
  const [toonArchief, setToonArchief] = useState(false)
  const lijst = toonArchief ? archief : lopend

  return (
    <section className="pb-blok" aria-labelledby="pb-mededelingen">
      <div className="club-sectiekop">
        <h2 id="pb-mededelingen">{t.kop}</h2>
        {magPlaatsen ? (
          <div className="pb-acties">
            <button type="button" className="club-knop club-knop--klein club-knop--stil" aria-pressed={toonArchief} onClick={() => setToonArchief((x) => !x)}>
              <Archive size={14} aria-hidden /> {t.archief}
            </button>
            {!schrijven ? (
              <button type="button" className="club-knop club-knop--klein club-knop--primair" onClick={() => setSchrijven(true)}>
                <Plus size={14} aria-hidden /> {t.nieuw}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {schrijven ? <MededelingFormulier vestigingen={vestigingen} onKlaar={() => setSchrijven(false)} /> : null}
      {lijst.length === 0 ? (
        <p className="club-leeg">{toonArchief ? t.archiefLeeg : magPlaatsen ? t.leeg : t.leegTeam}</p>
      ) : (
        <ul className="pb-lijst">
          {lijst.map((m) => (
            <li key={m.mededeling.id}>
              <MededelingKaart m={m} magPlaatsen={magPlaatsen} kanBevestigen={kanBevestigen} onOpenWerkwijze={onOpenWerkwijze} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

interface KaartProps {
  m: MededelingWeergave
  magPlaatsen: boolean
  kanBevestigen: boolean
  onOpenWerkwijze: (id: string) => void
}

function MededelingKaart({ m, magPlaatsen, kanBevestigen, onOpenWerkwijze }: KaartProps) {
  const tekst = useTekst(PRIKBORD)
  const t = tekst.mededelingen
  const taal = useTaal()
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const d = m.mededeling

  async function actie(url: string, method: 'POST' | 'PATCH', body: unknown) {
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await stuur(url, method, body)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    router.refresh()
  }

  const lezen = () => void actie('/api/club/prikbord/gelezen', 'POST', { mededelingId: d.id, bevestig: d.verplicht })
  const archiveer = () => void actie(`/api/club/prikbord/mededelingen/${d.id}`, 'PATCH', { gearchiveerd: !d.gearchiveerd })

  return (
    <article className="pb-mededeling" data-open={m.open || undefined} data-verplicht={d.verplicht || undefined}>
      <div className="pb-mededeling-kop">
        <h3>{d.titel}</h3>
        <div className="pb-chips">
          {d.soort === 'wijziging' ? <span className="club-chip club-chip--info">{t.wijziging}</span> : null}
          {d.verplicht ? <span className="club-chip club-chip--merk">{t.verplicht}</span> : null}
          {m.voorMij && m.bevestigd ? <span className="club-chip club-chip--ok">{t.bevestigd}</span> : null}
          {m.voorMij && !d.verplicht && m.gelezen ? <span className="club-chip club-chip--ok">{t.gelezen}</span> : null}
        </div>
      </div>
      {d.inhoud ? <p className="pb-inhoud">{d.inhoud}</p> : null}
      <p className="pb-meta">
        {t.door(m.door ?? tekst.leiding, formatDatum(d.geplaatstOp, taal, 'dagMaand'))}
        {d.verlooptOp ? ` · ${t.verloopt(formatDatum(d.verlooptOp, taal, 'dagMaand'))}` : ''}
      </p>
      {m.telling && m.telling.totaal > 0 ? (
        <details className="pb-telling">
          <summary>
            <span className="club-getal">{t.telling(m.telling.gedaan, m.telling.totaal, d.verplicht)}</span>
          </summary>
          {m.telling.nogNiet.length > 0 ? <p className="club-hint">{t.nogNiet(m.telling.nogNiet.join(', '))}</p> : null}
        </details>
      ) : null}
      {fout ? (
        <p className="club-melding club-melding--fout" role="alert">
          {fout}
        </p>
      ) : null}
      <div className="pb-acties">
        {m.open && kanBevestigen ? (
          <button type="button" className={`club-knop club-knop--klein${d.verplicht ? ' club-knop--primair' : ''}`} onClick={lezen} disabled={bezig}>
            <Check size={14} aria-hidden /> {d.verplicht ? t.bevestig : t.markeerGelezen}
          </button>
        ) : null}
        {d.werkwijzeId ? (
          <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => onOpenWerkwijze(d.werkwijzeId as string)}>
            {t.openWerkwijze}
          </button>
        ) : null}
        {magPlaatsen ? (
          <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={archiveer} disabled={bezig}>
            {d.gearchiveerd ? t.terugzetten : t.archiveren}
          </button>
        ) : null}
      </div>
    </article>
  )
}
