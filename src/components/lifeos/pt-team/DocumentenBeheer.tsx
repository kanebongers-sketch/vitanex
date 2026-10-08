'use client'

import { useCallback, useEffect, useState } from 'react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { groepeerPerCategorie, leesDocumenten, type PtDocument } from '@/lib/lifeos/pt-dashboard/documenten-lezers'
import { DocumentUpload } from './DocumentUpload'
import { DocumentRij } from './DocumentRij'

// Container: Kane's beheer van de documenten die zijn PT'ers in hun app zien
// (Kennis → Documenten). Uploaden bovenaan, de lijst per categorie eronder.

type Staat = { fase: 'laden' } | { fase: 'fout'; bericht: string } | { fase: 'ok'; docs: PtDocument[] }

export function DocumentenBeheer() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const laad = useCallback(
    (): Promise<void> =>
      haalJson('/api/lifeos/pt-documenten', leesDocumenten).then((uit) =>
        setStaat(uit.ok ? { fase: 'ok', docs: uit.waarde } : { fase: 'fout', bericht: uit.fout }),
      ),
    [],
  )
  useEffect(() => {
    void laad()
  }, [laad])

  const pas = (f: (docs: PtDocument[]) => PtDocument[]) => setStaat((s) => (s.fase === 'ok' ? { fase: 'ok', docs: f(s.docs) } : s))

  if (staat.fase === 'laden') return <p className="ptd-hint">Laden…</p>
  if (staat.fase === 'fout') return <Foutmelding bericht={staat.bericht} opnieuw={() => void laad()} />

  const groepen = groepeerPerCategorie(staat.docs)
  const verborgen = staat.docs.filter((d) => !d.zichtbaar).length

  return (
    <div className="ptd ptd--ingebed">
      <DocumentUpload bestaandeTitels={staat.docs.map((d) => d.titel)} onGeupload={(d) => pas((docs) => [...docs, d])} />

      <section className="ptd-sectie" aria-labelledby="docs-kop">
        <div className="ptd-sectiekop">
          <h2 id="docs-kop">Gedeeld met de PT&apos;ers</h2>
          <span>
            {staat.docs.length} {staat.docs.length === 1 ? 'document' : 'documenten'}
            {verborgen > 0 ? ` · ${verborgen} verborgen` : ''}
          </span>
        </div>
        {groepen.length === 0 ? (
          <p className="ptd-leeg">Nog geen documenten. Upload ze hierboven; je PT&apos;ers zien ze dan onder Kennis → Documenten.</p>
        ) : (
          groepen.map((g) => (
            <div key={g.categorie} className="ffdoc-groep">
              <h3 className="ffdoc-groepkop">{g.label}</h3>
              <ul className="ptd-lijst">
                {g.documenten.map((d) => (
                  <DocumentRij
                    key={d.id}
                    doc={d}
                    onGewijzigd={(nieuw) => pas((docs) => docs.map((x) => (x.id === nieuw.id ? nieuw : x)))}
                    onVerwijderd={(id) => pas((docs) => docs.filter((x) => x.id !== id))}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
