'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Kaart, NogNiets, type Nadruk } from '@/components/lifeos/os/Kaart'
import { Foutregel } from './Foutregel'
import {
  bewaarGeheugen,
  haalGeheugen,
  wisGeheugen as wisBijServer,
} from '@/lib/lifeos/vita/client'
import {
  GEHEUGEN_SOORTEN,
  MAX_INHOUD_LENGTE,
  type GeheugenRegel,
  type GeheugenSoort,
} from '@/lib/lifeos/vita/geheugen'

// ─── Waarom dit bestand bestaat ─────────────────────────────────────────────
// `vita_geheugen` werd door `context.ts` gelezen en nergens geschreven: de sectie
// "Wat ik over Kane onthoud" stond permanent leeg, elke request opnieuw
// meebetaald in tokens. Dit is de plek waar Kane er iets in zet.
//
// ─── DE GRENS ───────────────────────────────────────────────────────────────
// Alleen Kane legt hier iets vast. Vita niet — hij heeft geen tool-use en kan
// deze route niet aanroepen. Dat is met opzet: een assistent die zelf mag
// besluiten wat "een feit over jou" is, slaat vroeg of laat een aanname op als
// waarheid, en die staat daarna in élke systeemprompt zonder dat iemand het ooit
// bevestigd heeft. Zie de kop van `lib/lifeos/vita/geheugen.ts`.

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; melding: string }
  | { fase: 'klaar'; regels: GeheugenRegel[] }

interface VitaGeheugenProps {
  nadruk?: Nadruk
  /** Kopniveau; geef 3 mee als deze kaart in een lade staat. */
  niveau?: 2 | 3
}

export function VitaGeheugen({ nadruk = 'compact', niveau = 2 }: VitaGeheugenProps) {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [soort, setSoort] = useState<GeheugenSoort>('feit')
  const [inhoud, setInhoud] = useState('')
  const [bezig, setBezig] = useState(false)
  const [schrijfFout, setSchrijfFout] = useState<string | null>(null)

  useEffect(() => {
    const afbreker = new AbortController()
    void haalGeheugen(afbreker.signal).then((uitkomst) => {
      if (afbreker.signal.aborted) return
      // Een storing is geen leeg geheugen — die twee mogen nooit hetzelfde renderen.
      setStaat(
        uitkomst.ok
          ? { fase: 'klaar', regels: uitkomst.regels }
          : { fase: 'fout', melding: uitkomst.melding },
      )
    })
    return () => afbreker.abort()
  }, [])

  async function bewaar(gebeurtenis: FormEvent) {
    gebeurtenis.preventDefault()
    const tekst = inhoud.trim()
    if (tekst.length === 0 || bezig) return

    setBezig(true)
    setSchrijfFout(null)
    const uitkomst = await bewaarGeheugen(soort, tekst)
    setBezig(false)

    if (!uitkomst.ok) {
      setSchrijfFout(uitkomst.melding)
      return
    }
    // Nieuwste eerst, gelijk aan de sortering van de server.
    setStaat((h) =>
      h.fase === 'klaar' ? { fase: 'klaar', regels: [uitkomst.regel, ...h.regels] } : h,
    )
    setInhoud('')
  }

  async function wis(id: string) {
    setSchrijfFout(null)
    const uitkomst = await wisBijServer(id)
    if (!uitkomst.ok) {
      // Niet uit de lijst halen: dan lijkt het gewist terwijl het er nog staat, en
      // staat het morgen weer in Vita's prompt.
      setSchrijfFout(uitkomst.melding)
      return
    }
    setStaat((h) =>
      h.fase === 'klaar' ? { fase: 'klaar', regels: h.regels.filter((r) => r.id !== id) } : h,
    )
  }

  return (
    <Kaart titel="Wat Vita onthoudt" nadruk={nadruk} niveau={niveau}>
      <Lijst staat={staat} wis={wis} />
      {schrijfFout === null ? null : <Foutregel melding={schrijfFout} />}
      <Formulier
        soort={soort}
        zetSoort={setSoort}
        inhoud={inhoud}
        zetInhoud={setInhoud}
        bezig={bezig}
        bewaar={bewaar}
      />
    </Kaart>
  )
}

// ─── Onderdelen ─────────────────────────────────────────────────────────────

function Lijst({ staat, wis }: { staat: Staat; wis: (id: string) => void }) {
  if (staat.fase === 'laden') {
    return (
      <p aria-live="polite" style={{ margin: 0, fontSize: 13, color: 'var(--text-4)' }}>
        Ophalen…
      </p>
    )
  }
  if (staat.fase === 'fout') return <Foutregel melding={staat.melding} />
  if (staat.regels.length === 0) {
    return (
      <NogNiets
        wat="Ik onthoud nog niets over je"
        waarom="Leg hieronder een voorkeur, feit of doel vast. Ik verzin er zelf niets bij — wat hier niet staat, weet ik niet."
      />
    )
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 9 }}>
      {staat.regels.map((regel) => (
        <Regel key={regel.id} regel={regel} wis={wis} />
      ))}
    </ul>
  )
}

function Regel({ regel, wis }: { regel: GeheugenRegel; wis: (id: string) => void }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
      <span
        style={{
          flex: 'none',
          marginTop: 1,
          padding: '2px 7px',
          borderRadius: 999,
          border: '1px solid var(--line-strong)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.03em',
          color: 'var(--text-3)',
          textTransform: 'uppercase',
        }}
      >
        {regel.soort}
      </span>
      <span style={{ flex: 1, fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' }}>
        {regel.inhoud}
      </span>
      <button
        type="button"
        onClick={() => wis(regel.id)}
        aria-label={`Vergeet: ${regel.inhoud}`}
        style={{
          flex: 'none',
          display: 'inline-flex',
          padding: 3,
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          color: 'var(--text-4)',
          cursor: 'pointer',
        }}
      >
        <X size={13} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </li>
  )
}

interface FormulierProps {
  soort: GeheugenSoort
  zetSoort: (s: GeheugenSoort) => void
  inhoud: string
  zetInhoud: (s: string) => void
  bezig: boolean
  bewaar: (e: FormEvent) => void
}

function Formulier({ soort, zetSoort, inhoud, zetInhoud, bezig, bewaar }: FormulierProps) {
  const veld = {
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid var(--line-strong)',
    background: 'var(--bg-raised)',
    color: 'var(--text-1)',
    fontFamily: 'inherit',
    fontSize: 13,
  } as const

  return (
    <form onSubmit={bewaar} style={{ display: 'flex', gap: 7, marginTop: 14 }}>
      <label htmlFor="geheugen-soort" className="sr-only">
        Soort
      </label>
      <select
        id="geheugen-soort"
        value={soort}
        onChange={(e) => zetSoort(e.target.value as GeheugenSoort)}
        style={{ ...veld, flex: 'none' }}
      >
        {GEHEUGEN_SOORTEN.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <label htmlFor="geheugen-inhoud" className="sr-only">
        Wat moet Vita onthouden?
      </label>
      <input
        id="geheugen-inhoud"
        value={inhoud}
        onChange={(e) => zetInhoud(e.target.value.slice(0, MAX_INHOUD_LENGTE))}
        maxLength={MAX_INHOUD_LENGTE}
        placeholder="Ik train liever 's ochtends"
        style={{ ...veld, flex: 1, minWidth: 0 }}
      />

      <button
        type="submit"
        disabled={bezig || inhoud.trim().length === 0}
        style={{
          ...veld,
          flex: 'none',
          background: 'transparent',
          color: inhoud.trim().length === 0 ? 'var(--text-4)' : 'var(--text-2)',
          fontWeight: 600,
          cursor: inhoud.trim().length === 0 ? 'default' : 'pointer',
        }}
      >
        Onthoud
      </button>
    </form>
  )
}

