'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { CornerDownLeft } from 'lucide-react'
import { Kaart, type Nadruk } from '@/components/lifeos/os/Kaart'
import { Foutregel } from './Foutregel'
import { vraagVita } from '@/lib/lifeos/vita/client'
import { metDelta, MAX_VRAAG_TEKENS, type Bericht } from '@/lib/lifeos/vita/gesprek'

// ─── Waarom dit bestand bestaat ─────────────────────────────────────────────
// `/api/lifeos/vita/vraag` had NUL aanroepers. De persona, het streamen, het
// contextblok en het cache-breakpoint waren allemaal gebouwd, getest en betaald —
// en onbereikbaar. Dit is de knop erop.
//
// De kaart is bewust GEEN chatvenster met bubbels: Vita is de stem van de app, niet
// een contact in een lijst. Zijn antwoord staat er gewoon, als tekst; jouw vraag
// staat erboven als citaat. Zo leest een gesprek als een gesprek en niet als een
// support-widget.
//
// Dit component wordt geëXPORTEERD, niet gemount — de cockpit-layout beslist waar
// hij staat (zie `Kaart`: een kaart weet niets over de pagina waar hij op staat).

interface VitaGesprekProps {
  nadruk?: Nadruk
  /** Kopniveau; geef 3 mee als deze kaart in een lade staat. */
  niveau?: 2 | 3
}

export function VitaGesprek({ nadruk = 'normaal', niveau = 2 }: VitaGesprekProps) {
  const [berichten, setBerichten] = useState<Bericht[]>([])
  const [invoer, setInvoer] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const afbrekerRef = useRef<AbortController | null>(null)

  // Tab dicht, weggenavigeerd: breek de call af. Anders staan we tokens te betalen
  // voor een antwoord dat niemand meer leest (de route breekt op `cancel` mee af).
  useEffect(() => () => afbrekerRef.current?.abort(), [])

  async function verstuurVraag() {
    const vraag = invoer.trim()
    if (vraag.length === 0 || bezig) return

    const afbreker = new AbortController()
    afbrekerRef.current = afbreker

    const geschiedenis = berichten
    setBerichten([...geschiedenis, { rol: 'gebruiker', tekst: vraag }])
    setInvoer('')
    setFout(null)
    setBezig(true)

    let melding: string | null
    try {
      melding = await vraagVita(vraag, geschiedenis, afbreker.signal, (delta) => {
        setBerichten((huidig) => metDelta(huidig, delta))
      })
    } catch {
      // Netwerk weg, DNS, CORS. Een afgebroken call is geen fout: die vroegen we zelf.
      melding = afbreker.signal.aborted ? null : 'Vita is niet bereikbaar.'
    }

    if (afbreker.signal.aborted) return
    setBezig(false)
    if (melding !== null) setFout(melding)
  }

  function opVerstuur(gebeurtenis: FormEvent) {
    gebeurtenis.preventDefault()
    void verstuurVraag()
  }

  function opToets(gebeurtenis: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter verstuurt, Shift+Enter maakt een regel. Zonder dit typ je een vraag van
    // drie regels en verstuur je 'm per ongeluk drie keer.
    if (gebeurtenis.key === 'Enter' && !gebeurtenis.shiftKey) {
      gebeurtenis.preventDefault()
      void verstuurVraag()
    }
  }

  return (
    <Kaart titel="Vraag het Vita" nadruk={nadruk} niveau={niveau}>
      <Verloop berichten={berichten} bezig={bezig} />
      {fout === null ? null : <Foutregel melding={fout} />}
      <form onSubmit={opVerstuur} style={{ marginTop: 14 }}>
        <label htmlFor="vita-vraag" className="sr-only">
          Je vraag aan Vita
        </label>
        <textarea
          id="vita-vraag"
          value={invoer}
          onChange={(e) => setInvoer(e.target.value.slice(0, MAX_VRAAG_TEKENS))}
          onKeyDown={opToets}
          rows={2}
          maxLength={MAX_VRAAG_TEKENS}
          disabled={bezig}
          placeholder="Wat moet ik vandaag als eerste doen?"
          style={{
            width: '100%',
            resize: 'vertical',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid var(--line-strong)',
            background: 'var(--bg-raised)',
            color: 'var(--text-1)',
            fontFamily: 'inherit',
            fontSize: 14,
            lineHeight: 1.5,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 8,
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-4)' }}>
            Enter verstuurt · Shift+Enter maakt een regel
          </p>
          <VerstuurKnop bezig={bezig} leeg={invoer.trim().length === 0} />
        </div>
      </form>
    </Kaart>
  )
}

// ─── Onderdelen ─────────────────────────────────────────────────────────────

function Verloop({ berichten, bezig }: { berichten: Bericht[]; bezig: boolean }) {
  if (berichten.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-3)' }}>
        Ik ken je dag: je slaap, je agenda, je taken en wat je vandaag afvinkte. Vraag maar.
      </p>
    )
  }

  // `aria-live` zodat een screenreader het antwoord meekrijgt terwijl het
  // binnendruppelt. `polite`: Vita onderbreekt je niet.
  return (
    <div aria-live="polite" aria-busy={bezig} style={{ display: 'grid', gap: 14 }}>
      {berichten.map((bericht, i) => (
        <Regel key={`${i}-${bericht.rol}`} bericht={bericht} />
      ))}
      {bezig && berichten[berichten.length - 1]?.rol !== 'vita' ? <Denkt /> : null}
    </div>
  )
}

/**
 * Jouw vraag als citaat (cyaan lijn), Vita's antwoord als gewone tekst. Geen
 * bubbels: hiërarchie via schaal en kleur, niet via twee gekleurde ballonnen.
 */
function Regel({ bericht }: { bericht: Bericht }) {
  if (bericht.rol === 'gebruiker') {
    return (
      <p
        style={{
          margin: 0,
          paddingLeft: 11,
          borderLeft: '2px solid var(--brand)',
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--text-3)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {bericht.tekst}
      </p>
    )
  }
  return (
    <p
      style={{
        margin: 0,
        fontSize: 15,
        lineHeight: 1.6,
        color: 'var(--text-1)',
        whiteSpace: 'pre-wrap',
      }}
    >
      {bericht.tekst}
    </p>
  )
}

/** Geen animatie: een wachtindicator die beweegt is precies wat je uitzet bij reduced-motion. */
function Denkt() {
  return <p style={{ margin: 0, fontSize: 13, color: 'var(--text-4)' }}>Vita kijkt naar je dag…</p>
}


function VerstuurKnop({ bezig, leeg }: { bezig: boolean; leeg: boolean }) {
  const [hover, zetHover] = useState(false)
  const uit = bezig || leeg
  return (
    <button
      type="submit"
      disabled={uit}
      onMouseEnter={() => zetHover(true)}
      onMouseLeave={() => zetHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 14px',
        borderRadius: 999,
        border: `1px solid ${!uit && hover ? 'var(--brand)' : 'var(--line-strong)'}`,
        background: 'transparent',
        color: uit ? 'var(--text-4)' : hover ? 'var(--brand)' : 'var(--text-2)',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 600,
        cursor: uit ? 'default' : 'pointer',
        transition: 'color 180ms var(--ease), border-color 180ms var(--ease)',
      }}
    >
      <CornerDownLeft size={13} strokeWidth={2.2} aria-hidden="true" />
      {bezig ? 'Bezig…' : 'Vraag'}
    </button>
  )
}
