'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { Knop } from '@/components/lifeos/os/Knop'
import { haalJson } from '@/lib/lifeos/api/http'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import {
  eersteVrijePositie,
  leesTaakAntwoord,
  leesTakenAntwoord,
  top3Van,
  TOP3_POSITIES,
  type Taak,
} from '@/lib/lifeos/taken/taken'
import { Top3Rij } from './Top3Rij'

// Container voor de top-3. Vervangt Todoist openen.
//
// Afvinken is optimistisch: de vink springt meteen om, want wachten op een
// server om te zien dat je iets afmaakte, voelt als een defect. Mislukt het,
// dan draaien we terug ÉN zeggen we het. Stil terugdraaien is erger dan geen
// optimistische update: dan zie je je taak spontaan terugspringen zonder reden.

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; taken: Taak[] }

export function Top3Kaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<string | null>(null)
  const [nieuweTitel, setNieuweTitel] = useState('')
  const [bezig, setBezig] = useState(false)

  // De dag in een ref, niet in state: hij stuurt geen render aan (je ziet 'm
  // nergens staan), hij bepaalt alleen wát we ophalen. En hij wordt pas ná mount
  // bepaald — `new Date()` tijdens render geeft op de server de servertijd en in
  // de browser de jouwe.
  const dagRef = useRef<string | null>(null)

  // Generatieteller: `laad` loopt vanaf mount, vanaf de retry-knop en na elk
  // afvinken. Zonder deze teller kunnen twee vluchten elkaar inhalen en wint de
  // oudste die toevallig als laatste terugkomt — dan springt een net afgevinkte
  // taak weer aan. De cleanup hoogt 'm op, zodat een vlucht die bij unmount nog
  // loopt niets meer zet.
  const generatie = useRef(0)

  const laad = useCallback((voorDag: string): Promise<void> => {
    const mijn = ++generatie.current
    // setState in de .then-callback, niet in de effect-body: dat is de vorm die
    // React bedoelt en die geen cascaderende render veroorzaakt.
    return haalJson(
      `/api/lifeos/taken?datum=${encodeURIComponent(voorDag)}&top3=1`,
      leesTakenAntwoord,
    ).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', taken: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  /** Verklaart alles wat nu in de lucht is ongeldig — zie AgendaKaart. */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    const dag = datumSleutel(new Date())
    dagRef.current = dag
    void laad(dag)
    return verval
  }, [laad, verval])

  const opnieuw = useCallback(() => {
    const dag = dagRef.current
    if (!dag) return
    setStaat({ fase: 'laden' })
    void laad(dag)
  }, [laad])

  const vink = useCallback(
    async (taak: Taak) => {
      if (staat.fase !== 'ok') return

      const terug = staat.taken // snapshot voor de rollback
      const klaar = !taak.klaar
      setActieFout(null)
      setStaat({
        fase: 'ok',
        taken: terug.map((t) =>
          t.id === taak.id ? { ...t, klaar, klaarOp: klaar ? new Date().toISOString() : null } : t,
        ),
      })

      const uitkomst = await haalJson(`/api/lifeos/taken/${taak.id}`, leesTaakAntwoord, {
        method: 'PATCH',
        body: JSON.stringify({ klaar }),
      })

      if (!uitkomst.ok) {
        // Terugdraaien én zeggen. Nooit stil.
        setStaat({ fase: 'ok', taken: terug })
        setActieFout(`${uitkomst.fout} Je taak staat nog op de oude stand.`)
        return
      }

      // De server is de waarheid: klaar_op komt daarvandaan, niet van onze klok.
      const bevestigd = uitkomst.waarde
      setStaat((huidig) =>
        huidig.fase === 'ok'
          ? { fase: 'ok', taken: huidig.taken.map((t) => (t.id === bevestigd.id ? bevestigd : t)) }
          : huidig,
      )
    },
    [staat],
  )

  const voegToe = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const dag = dagRef.current
      if (staat.fase !== 'ok' || !dag) return

      const titel = nieuweTitel.trim()
      const positie = eersteVrijePositie(staat.taken)
      if (titel.length === 0 || positie === null) return

      setBezig(true)
      setActieFout(null)
      const uitkomst = await haalJson('/api/lifeos/taken', leesTaakAntwoord, {
        method: 'POST',
        body: JSON.stringify({ titel, datum: dag, top3Positie: positie }),
      })
      setBezig(false)

      if (!uitkomst.ok) {
        setActieFout(uitkomst.fout)
        return
      }

      const nieuw = uitkomst.waarde
      setNieuweTitel('')
      setStaat((huidig) =>
        huidig.fase === 'ok' ? { fase: 'ok', taken: [...huidig.taken, nieuw] } : huidig,
      )
    },
    [staat, nieuweTitel],
  )

  return (
    <Kaart titel="Top 3 vandaag" vervangt="Todoist">
      {staat.fase === 'laden' ? <Skelet /> : null}

      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

      {staat.fase === 'ok' ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {top3Van(staat.taken).map((taak, i) => (
              <Top3Rij
                key={TOP3_POSITIES[i] ?? i}
                positie={TOP3_POSITIES[i] ?? 1}
                taak={taak}
                onVink={(t) => void vink(t)}
              />
            ))}
          </ul>

          {eersteVrijePositie(staat.taken) === null ? (
            <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0, lineHeight: 1.5 }}>
              Drie is drie. Vink er een af of haal er een weg om ruimte te maken.
            </p>
          ) : (
            <form onSubmit={(e) => void voegToe(e)} style={{ display: 'flex', gap: 8 }}>
              <label htmlFor="nieuwe-taak" style={VERBORGEN}>
                Nieuwe taak voor vandaag
              </label>
              <input
                id="nieuwe-taak"
                value={nieuweTitel}
                onChange={(e) => setNieuweTitel(e.target.value)}
                placeholder="Wat telt vandaag?"
                maxLength={500}
                style={INVOER}
              />
              <Knop type="submit" disabled={bezig || nieuweTitel.trim().length === 0}>
                <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
                Zet erbij
              </Knop>
            </form>
          )}

          {actieFout ? <Foutmelding bericht={actieFout} /> : null}
        </div>
      ) : null}
    </Kaart>
  )
}

/** Zichtbaar voor screenreaders, niet voor het oog. */
const VERBORGEN: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

const INVOER: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
}

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 11 }}>
      {[62, 48, 54].map((breedte) => (
        <div
          key={breedte}
          style={{ height: 14, width: `${breedte}%`, borderRadius: 4, background: 'var(--bg-raised)' }}
        />
      ))}
    </div>
  )
}
