'use client'

import { useId, useRef, useState, type DragEvent } from 'react'
import { Upload } from 'lucide-react'
import { ACCEPT, bestandsFout } from '@/lib/lifeos/pt-dashboard/documenten'
import { lijktKopie, suggestieVoorBestand } from '@/lib/lifeos/pt-dashboard/documenten-suggestie'
import type { PtDocument } from '@/lib/lifeos/pt-dashboard/documenten-lezers'
import { uploadDocument } from '@/lib/lifeos/pt-dashboard/documenten-upload'
import { metaVan, type DocConcept } from './DocumentVelden'
import { UploadRij, type UploadItem } from './UploadRij'

// Kane kiest of sleept meerdere bestanden tegelijk. Per bestand staat er een
// voorstel (titel, categorie, beschrijving) klaar dat hij kan aanpassen; daarna
// gaan ze één voor één naar de privé opslag, met voortgang en eerlijke fouten.

interface Props {
  bestaandeTitels: readonly string[]
  onGeupload: (doc: PtDocument) => void
}

function nieuwItem(bestand: File, sleutel: string): UploadItem {
  const fout = bestandsFout(bestand.name, bestand.size)
  const s = suggestieVoorBestand(bestand.name)
  const concept: DocConcept = { titel: s.titel, beschrijving: s.beschrijving ?? '', categorie: s.categorie, volgorde: String(s.volgorde), zichtbaar: true }
  return { sleutel, bestand, concept, fase: fout ? 'ongeldig' : 'wacht', voortgang: 0, fout, kopie: lijktKopie(bestand.name) }
}

const norm = (t: string) => t.trim().toLowerCase()

export function DocumentUpload({ bestaandeTitels, onGeupload }: Props) {
  const basisId = useId()
  const invoer = useRef<HTMLInputElement>(null)
  const teller = useRef(0)
  const [rij, setRij] = useState<UploadItem[]>([])
  const [sleept, setSleept] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState('')

  const werkBij = (sleutel: string, w: Partial<UploadItem>) => setRij((r) => r.map((i) => (i.sleutel === sleutel ? { ...i, ...w } : i)))

  function voegToe(lijst: FileList | null): void {
    if (!lijst || lijst.length === 0) return
    const nieuw = Array.from(lijst, (b) => nieuwItem(b, `${basisId}-${(teller.current += 1)}`))
    setRij((r) => [...r, ...nieuw])
    setMelding(`${nieuw.length} ${nieuw.length === 1 ? 'bestand' : 'bestanden'} klaargezet. Controleer de titels en upload.`)
  }

  function opDrop(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    setSleept(false)
    if (!bezig) voegToe(e.dataTransfer.files)
  }

  async function uploadAlles(): Promise<void> {
    const teDoen = rij.filter((i) => i.fase === 'wacht' || i.fase === 'fout')
    if (teDoen.length === 0) return
    setBezig(true)
    let gelukt = 0
    for (const item of teDoen) {
      if (!item.concept.titel.trim()) {
        werkBij(item.sleutel, { fase: 'fout', fout: 'Geef het document een titel.' })
        continue
      }
      werkBij(item.sleutel, { fase: 'bezig', voortgang: 0, fout: null })
      const uit = await uploadDocument(item.bestand, metaVan(item.concept), (v) => werkBij(item.sleutel, { voortgang: v }))
      if (uit.ok) {
        gelukt += 1
        onGeupload(uit.waarde)
        setRij((r) => r.filter((i) => i.sleutel !== item.sleutel))
      } else {
        werkBij(item.sleutel, { fase: 'fout', fout: uit.fout })
      }
    }
    setBezig(false)
    const mislukt = teDoen.length - gelukt
    setMelding(
      mislukt === 0
        ? `${gelukt} ${gelukt === 1 ? 'document staat' : 'documenten staan'} nu in de lijst.`
        : `${gelukt} gelukt, ${mislukt} niet. Zie de melding bij het bestand en probeer opnieuw.`,
    )
  }

  const titels = rij.map((i) => norm(i.concept.titel))
  const bestaand = new Set(bestaandeTitels.map(norm))
  const klaar = rij.filter((i) => i.fase === 'wacht' || i.fase === 'fout').length

  return (
    <section className="ptd-sectie" aria-labelledby={`${basisId}-kop`}>
      <div className="ptd-sectiekop">
        <h2 id={`${basisId}-kop`}>Uploaden</h2>
        <span>PDF, Word, PowerPoint, Excel of afbeelding · max. 50 MB</span>
      </div>
      <div
        className="ffdoc-zone"
        data-sleept={sleept || undefined}
        onDragOver={(e) => {
          e.preventDefault()
          if (!bezig) setSleept(true)
        }}
        onDragLeave={(e) => {
          // Niet "uit" bij het slepen over een kind-element van de zone.
          if (!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget))) setSleept(false)
        }}
        onDrop={opDrop}
      >
        <Upload size={22} aria-hidden="true" />
        <p>Sleep bestanden hierheen, of</p>
        <button type="button" className="ptd-knop" onClick={() => invoer.current?.click()} disabled={bezig}>
          Bestanden kiezen
        </button>
        <input
          ref={invoer}
          type="file"
          multiple
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            voegToe(e.target.files)
            e.target.value = ''
          }}
        />
        <p className="ptd-hint">Bestanden gaan rechtstreeks naar de privé opslag in de EU. Alleen ingelogde PT&apos;ers kunnen ze openen.</p>
      </div>

      {rij.length > 0 ? (
        <ul className="ptd-lijst">
          {rij.map((item, i) => (
            <UploadRij
              key={item.sleutel}
              item={item}
              dubbeleTitel={bestaand.has(titels[i]) || titels.indexOf(titels[i]) !== i}
              vergrendeld={bezig}
              onWijzig={(c) => werkBij(item.sleutel, { concept: c })}
              onWeg={() => setRij((r) => r.filter((x) => x.sleutel !== item.sleutel))}
            />
          ))}
        </ul>
      ) : null}

      {rij.length > 0 ? (
        <div className="ptd-acties">
          <button type="button" className="ptd-knop ptd-knop--primair" onClick={() => void uploadAlles()} disabled={bezig || klaar === 0} aria-busy={bezig}>
            {bezig ? 'Bezig met uploaden…' : `Upload ${klaar} ${klaar === 1 ? 'bestand' : 'bestanden'}`}
          </button>
          <button type="button" className="ptd-knop" onClick={() => setRij([])} disabled={bezig}>
            Rij leegmaken
          </button>
        </div>
      ) : null}
      <p className="ptd-hint" role="status" aria-live="polite">
        {melding}
      </p>
    </section>
  )
}
