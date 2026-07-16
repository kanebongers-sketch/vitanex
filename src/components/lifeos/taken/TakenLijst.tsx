'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import {
  groepeerTaken,
  leesTaakAntwoord,
  leesTakenAntwoord,
  type GegroepeerdeTaken,
  type Taak,
} from '@/lib/lifeos/taken/taken'
import { TaakRij } from './TaakRij'
import { ToevoegVeld } from './ToevoegVeld'

// Container voor de héle takenlijst — niet alleen de top-3. Hier worden de
// bot-taken (via Telegram binnengekomen, top3-loos) eindelijk zichtbaar; ze
// stonden alleen in de database.
//
// Afvinken én verwijderen zijn optimistisch: de UI springt meteen om, want
// wachten op de server voelt als een defect. Mislukt het, dan draaien we terug
// ÉN zeggen we het. Stil terugdraaien is erger dan geen optimistische update.

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; taken: Taak[] }

export function TakenLijst() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  // De dag stuurt geen render aan als string, maar de groepering hangt ervan af.
  // Pas ná mount bepaald: `new Date()` tijdens render geeft op de server de
  // servertijd en in de browser de jouwe.
  const [vandaag, setVandaag] = useState<string | null>(null)

  // Generatieteller: `laad` loopt vanaf mount en vanaf de retry-knop. Zonder
  // deze teller wint een oudere vlucht die toevallig als laatste terugkomt. De
  // cleanup hoogt 'm op, zodat een vlucht die bij unmount nog loopt niets zet.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/taken?alle=1', leesTakenAntwoord).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', taken: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    setVandaag(datumSleutel(new Date()))
    void laad()
    return verval
  }, [laad, verval])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
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

  const verwijder = useCallback(
    async (taak: Taak) => {
      if (staat.fase !== 'ok') return

      const terug = staat.taken // snapshot voor de rollback
      setActieFout(null)
      setStaat({ fase: 'ok', taken: terug.filter((t) => t.id !== taak.id) })

      const uitkomst = await haalJson(`/api/lifeos/taken/${taak.id}`, leesNiets, {
        method: 'DELETE',
      })

      if (!uitkomst.ok) {
        setStaat({ fase: 'ok', taken: terug })
        setActieFout(`${uitkomst.fout} De taak staat er nog.`)
      }
    },
    [staat],
  )

  const voegToe = useCallback(
    async (titel: string, datum: string | null): Promise<boolean> => {
      if (staat.fase !== 'ok') return false

      setBezig(true)
      setActieFout(null)
      const uitkomst = await haalJson('/api/lifeos/taken', leesTaakAntwoord, {
        method: 'POST',
        body: JSON.stringify({ titel, datum }),
      })
      setBezig(false)

      if (!uitkomst.ok) {
        setActieFout(uitkomst.fout)
        return false
      }

      const nieuw = uitkomst.waarde
      setStaat((huidig) =>
        huidig.fase === 'ok' ? { fase: 'ok', taken: [...huidig.taken, nieuw] } : huidig,
      )
      return true
    },
    [staat],
  )

  return (
    <Kaart titel="Alles op je lijst" vervangt="Todoist · Things">
      {staat.fase === 'laden' ? <Skelet /> : null}

      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

      {staat.fase === 'ok' && vandaag !== null ? (
        <Inhoud
          groepen={groepeerTaken(staat.taken, vandaag)}
          leeg={staat.taken.length === 0}
          vandaag={vandaag}
          bezig={bezig}
          actieFout={actieFout}
          onVink={(t) => void vink(t)}
          onVerwijder={(t) => void verwijder(t)}
          onToevoeg={voegToe}
        />
      ) : null}
    </Kaart>
  )
}

interface InhoudProps {
  groepen: GegroepeerdeTaken
  leeg: boolean
  vandaag: string
  bezig: boolean
  actieFout: string | null
  onVink: (taak: Taak) => void
  onVerwijder: (taak: Taak) => void
  onToevoeg: (titel: string, datum: string | null) => Promise<boolean>
}

function Inhoud({ groepen, leeg, vandaag, bezig, actieFout, onVink, onVerwijder, onToevoeg }: InhoudProps) {
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {leeg ? (
        <NogNiets
          wat="Nog geen taken"
          waarom="Wat je hier zet — of via Telegram naar de bot stuurt — landt op deze lijst."
        />
      ) : (
        <>
          <Groep titel="Vandaag" taken={groepen.vandaag} toonPositie onVink={onVink} onVerwijder={onVerwijder} />
          <Groep titel="Backlog" taken={groepen.backlog} onVink={onVink} onVerwijder={onVerwijder} />
          <Groep titel="Ooit" taken={groepen.ooit} onVink={onVink} onVerwijder={onVerwijder} />
          <Groep titel="Gedaan" taken={groepen.gedaan} onVink={onVink} onVerwijder={onVerwijder} />
        </>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        <ToevoegVeld
          label="Nieuwe taak voor vandaag"
          placeholder="Wat moet er vandaag gebeuren?"
          bezig={bezig}
          onToevoeg={(titel) => onToevoeg(titel, vandaag)}
        />
        <ToevoegVeld
          label="Iets voor ooit, zonder datum"
          placeholder="Ooit, geen datum"
          bezig={bezig}
          onToevoeg={(titel) => onToevoeg(titel, null)}
        />
      </div>

      {actieFout ? <Foutmelding bericht={actieFout} /> : null}

      <p style={NOOT}>
        Taken zonder top-3-plek — ook die je via Telegram naar de bot stuurt — staan hier.
      </p>
    </div>
  )
}

interface GroepProps {
  titel: string
  taken: Taak[]
  toonPositie?: boolean
  onVink: (taak: Taak) => void
  onVerwijder: (taak: Taak) => void
}

function Groep({ titel, taken, toonPositie = false, onVink, onVerwijder }: GroepProps) {
  if (taken.length === 0) return null

  return (
    <section>
      <h3 style={KOP}>
        {titel}
        <span className="os-cijfer" style={{ color: 'var(--text-4)', fontWeight: 600 }}>
          {taken.length}
        </span>
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {taken.map((taak) => (
          <TaakRij
            key={taak.id}
            taak={taak}
            positie={toonPositie ? taak.top3Positie : null}
            onVink={onVink}
            onVerwijder={onVerwijder}
          />
        ))}
      </ul>
    </section>
  )
}

const KOP: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  margin: '0 0 4px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-3)',
}

const NOOT: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.5,
  color: 'var(--text-4)',
}

/** Rustige placeholder in navy. Geen spinner-spektakel. */
function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 11 }}>
      {[58, 72, 44, 66].map((breedte, i) => (
        <div
          key={i}
          style={{ height: 14, width: `${breedte}%`, borderRadius: 4, background: 'var(--bg-raised)' }}
        />
      ))}
    </div>
  )
}
