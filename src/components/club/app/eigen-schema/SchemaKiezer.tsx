'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Lock, PencilLine, Plus, Trash2, X } from 'lucide-react'
import type { SchemaKeuze } from '@/lib/club/training/lid-schemas/typen'
import { MAX_EIGEN_SCHEMAS } from '@/lib/club/training/lid-schemas/regels'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { EIGEN_SCHEMA } from '@/lib/aiyourgym/taal/woorden/ledenapp/eigen-schema'
import { stuur } from '../verzoek'
import { haal, lijstUit } from './haal'

// "Mijn schema's": het schema van de trainer en de eigen schema's, het actieve
// bovenaan. Kiezen welk schema je gebruikt, een eigen schema aanpassen of
// verwijderen, of een nieuw schema maken.

interface Props {
  url: (pad: string) => string
  onAanpassen: (id: string) => void
  onNieuw: () => void
  /** Er is iets veranderd (ander actief schema, verwijderd): de pagina laadt opnieuw. */
  onVeranderd: () => void
  onSluit: () => void
}

export function SchemaKiezer({ url, onAanpassen, onNieuw, onVeranderd, onSluit }: Props) {
  const es = useTekst(EIGEN_SCHEMA)
  const t = es.mijn
  const [keuzes, setKeuzes] = useState<SchemaKeuze[] | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState<string | null>(null)
  const [weg, setWeg] = useState<SchemaKeuze | null>(null)
  const [versie, setVersie] = useState(0)
  const blad = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stop = new AbortController()
    void haal(url('schemas'), lijstUit<SchemaKeuze>('keuzes'), stop.signal).then((r) => {
      if (r.ok) setKeuzes(r.data)
      else if (r.fout) setFout(r.fout)
    })
    return () => stop.abort()
  }, [url, versie])

  useEffect(() => {
    const vorige = document.activeElement instanceof HTMLElement ? document.activeElement : null
    blad.current?.focus()
    const toets = (e: KeyboardEvent) => e.key === 'Escape' && onSluit()
    window.addEventListener('keydown', toets)
    return () => {
      window.removeEventListener('keydown', toets)
      vorige?.focus()
    }
  }, [onSluit])

  async function actie(id: string, doe: () => ReturnType<typeof stuur>) {
    setBezig(id)
    setFout(null)
    const r = await doe()
    setBezig(null)
    setWeg(null)
    if (!r.ok) return setFout(r.fout)
    setVersie((v) => v + 1)
    onVeranderd()
  }

  const eigen = (keuzes ?? []).filter((k) => k.maker === 'lid').length
  return (
    <div className="club-lidapp-blad-scherm" onMouseDown={(e) => e.target === e.currentTarget && onSluit()}>
      <div ref={blad} className="club-lidapp-blad club-es-kiezer" role="dialog" aria-modal="true" aria-label={t.kop} tabIndex={-1}>
        <div className="club-lidapp-blad-kop">
          <h3>{t.kop}</h3>
          <button type="button" className="club-lidapp-blad-sluit" onClick={onSluit} aria-label={es.editor.sluiten}>
            <X aria-hidden size={20} />
          </button>
        </div>
        {fout && <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert">{fout}</p>}
        {!keuzes && !fout && <div className="club-lidapp-skelet club-es-skelet" aria-busy="true" />}
        {keuzes && (
          <ul className="club-es-keuzelijst">
            {keuzes.map((k) => (
              <li key={k.id} data-actief={k.actief || undefined}>
                <div className="club-es-keuze-kop">
                  <span className={`club-lidapp-chip ${k.maker === 'trainer' ? 'club-es-chip-trainer' : 'club-lidapp-chip--info'}`}>{k.maker === 'trainer' ? es.herkomst.trainer : es.herkomst.eigen}</span>
                  {k.actief && <span className="club-es-actief"><Check aria-hidden size={14} /> {t.actief}</span>}
                </div>
                <strong className="club-es-keuze-naam">{k.naam}</strong>
                <small className="club-es-keuze-sub">{t.dagen(k.dagen)}</small>
                {weg?.id === k.id ? (
                  <div className="club-es-keuze-acties" role="group" aria-label={t.verwijderVraag(k.naam)}>
                    <p>{t.verwijderVraag(k.naam)}</p>
                    <button type="button" className="club-lidapp-knop club-es-weg" disabled={bezig === k.id} onClick={() => void actie(k.id, () => stuur(url(`schemas/${encodeURIComponent(k.id)}`), 'DELETE'))}>{t.jaVerwijderen}</button>
                    <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={() => setWeg(null)}>{t.annuleren}</button>
                  </div>
                ) : (
                  <div className="club-es-keuze-acties">
                    {!k.actief && (
                      <button type="button" className="club-lidapp-knop club-lidapp-knop--primair" disabled={bezig === k.id} onClick={() => void actie(k.id, () => stuur(url(`schemas/${encodeURIComponent(k.id)}/actief`), 'POST'))}>{t.gebruiken}</button>
                    )}
                    {k.magBewerken ? (
                      <button type="button" className="club-lidapp-knop" onClick={() => onAanpassen(k.id)}><PencilLine aria-hidden size={16} /> {t.aanpassen}</button>
                    ) : (
                      <span className="club-es-vast"><Lock aria-hidden size={14} /> {t.vast}</span>
                    )}
                    {k.magVerwijderen && (
                      <button type="button" className="club-lidapp-knop club-lidapp-knop--stil" onClick={() => setWeg(k)} aria-label={`${t.verwijderen}: ${k.naam}`}><Trash2 aria-hidden size={16} /></button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {keuzes && (eigen >= MAX_EIGEN_SCHEMAS ? (
          <p className="club-lidapp-leeg">{t.maxBereikt(MAX_EIGEN_SCHEMAS)}</p>
        ) : (
          <button type="button" className="club-lidapp-knop club-lidapp-knop--breed" onClick={onNieuw}><Plus aria-hidden size={18} /> {t.nieuw}</button>
        ))}
      </div>
    </div>
  )
}
