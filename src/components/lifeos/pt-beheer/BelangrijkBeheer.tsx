'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react'
import type { Aandachtspunt } from '@/lib/lifeos/pt-dashboard/belangrijk'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { leesLeeg, ptApi } from '@/components/lifeos/pt-dashboard/api'
import { AandachtspuntFormulier, type PuntInvoer } from './AandachtspuntFormulier'

// /<beheerder>/beheer — Kane beheert "Belangrijk": de algemene punten bovenaan
// het startscherm van elke PT'er. Toevoegen, wijzigen, volgorde, aan/uit en
// verwijderen; per punt zie je hoeveel PT'ers het hebben afgevinkt. Daaronder
// wie zijn kledingmaten nog niet heeft doorgegeven. Alleen de beheerder komt
// hier (de pagina geeft anderen een 404, de API een 403).

interface Props {
  code: string
  punten: readonly Aandachtspunt[]
  /** punt-id → aantal PT'ers dat het heeft afgevinkt. */
  gedaan: Readonly<Record<string, number>>
  aantalPts: number
  /** Namen van PT'ers zonder kledingmaten. */
  zonderMaten: readonly string[]
}

export function BelangrijkBeheer({ code, punten, gedaan, aantalPts, zonderMaten }: Props) {
  const router = useRouter()
  const [bewerk, setBewerk] = useState<string | null>(null)
  const [bezig, setBezig] = useState<string | null>(null)
  const [verversen, start] = useTransition()
  const [fout, setFout] = useState<string | null>(null)

  async function actie(body: Record<string, unknown>): Promise<string | null> {
    const uit = await ptApi(code, 'belangrijk', 'POST', body, leesLeeg)
    if (!uit.ok) return uit.fout
    start(() => router.refresh())
    return null
  }

  async function knop(id: string, body: Record<string, unknown>) {
    if (bezig || verversen) return
    setBezig(id)
    setFout(null)
    const f = await actie(body)
    setBezig(null)
    if (f) setFout(f)
  }

  function verwijder(p: Aandachtspunt) {
    if (window.confirm(`"${p.titel}" verwijderen? Ook wie het had afgevinkt, verdwijnt. Tijdelijk weghalen kan met Uitzetten.`)) {
      void knop(p.id, { actie: 'verwijderen', id: p.id })
    }
  }

  const opslaan = (p?: Aandachtspunt) => async (v: PuntInvoer) => {
    const f = await actie(p ? { actie: 'wijzigen', id: p.id, ...v } : { actie: 'toevoegen', ...v })
    if (!f && p) setBewerk(null)
    return f
  }

  const vast = bezig !== null || verversen
  return (
    <section className="ptd-sectie" aria-labelledby="beheer-belangrijk-kop">
      <div className="ptd-sectiekop">
        <h2 id="beheer-belangrijk-kop">Belangrijk voor PT&apos;ers</h2>
        <span>bovenaan het startscherm van elke PT&apos;er</span>
      </div>
      {punten.length === 0 ? (
        <p className="ptd-leeg">Nog geen punten. Voeg hieronder het eerste toe, bijvoorbeeld &quot;Vraag om een recensie&quot;.</p>
      ) : (
        <ol className="ptd-lijst">
          {punten.map((p, i) =>
            bewerk === p.id ? (
              <li key={p.id}>
                <AandachtspuntFormulier kop="Punt wijzigen" begin={p} knop="Opslaan" opslaan={opslaan(p)} annuleren={() => setBewerk(null)} />
              </li>
            ) : (
              <li key={p.id} className={`ptd-rij${p.actief ? '' : ' ptd-belangrijk-punt--uit'}`}>
                <div className="ptd-rij-kop">
                  <span className="ptd-naam">{p.titel}</span>
                  {p.actief ? null : <span className="ptd-badge ptd-badge--stil">Uit</span>}
                </div>
                {p.uitleg ? <p className="ptd-tekst">{p.uitleg}</p> : null}
                <p className="ptd-meta">
                  {p.link ? <span>Link: {p.link}</span> : null}
                  <span>
                    {gedaan[p.id] ?? 0} van {aantalPts} afgevinkt
                  </span>
                </p>
                <div className="ptd-acties ptd-acties--rij">
                  <button type="button" className="ptd-knop ptd-knop--klein" disabled={vast || i === 0} aria-label={`${p.titel} omhoog`} onClick={() => void knop(p.id, { actie: 'verplaats', id: p.id, richting: 'op' })}>
                    <ArrowUp size={15} aria-hidden />
                  </button>
                  <button type="button" className="ptd-knop ptd-knop--klein" disabled={vast || i === punten.length - 1} aria-label={`${p.titel} omlaag`} onClick={() => void knop(p.id, { actie: 'verplaats', id: p.id, richting: 'neer' })}>
                    <ArrowDown size={15} aria-hidden />
                  </button>
                  <button type="button" className="ptd-knop ptd-knop--klein" disabled={vast} onClick={() => setBewerk(p.id)} aria-label={`${p.titel} wijzigen`}>
                    <Pencil size={15} aria-hidden /> Wijzig
                  </button>
                  <button type="button" className="ptd-knop ptd-knop--klein" disabled={vast} onClick={() => void knop(p.id, { actie: 'actief', id: p.id, actief: !p.actief })}>
                    {p.actief ? 'Uitzetten' : 'Aanzetten'}
                  </button>
                  <button type="button" className="ptd-knop ptd-knop--klein ptd-knop--gevaar" disabled={vast} onClick={() => verwijder(p)} aria-label={`${p.titel} verwijderen`}>
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </li>
            ),
          )}
        </ol>
      )}
      {fout ? <Foutmelding bericht={fout} /> : null}
      <AandachtspuntFormulier kop="Punt toevoegen" knop="Toevoegen" opslaan={opslaan()} />
      <p className="ptd-hint">
        Kledingmaten: {aantalPts - zonderMaten.length} van {aantalPts} PT&apos;ers doorgegeven
        {zonderMaten.length > 0 ? ` · nog niet: ${zonderMaten.join(', ')}` : ''}. Wie ze nog niet doorgaf, ziet dat als eerste punt.
      </p>
    </section>
  )
}
