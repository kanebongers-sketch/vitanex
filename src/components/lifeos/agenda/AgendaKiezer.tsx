'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Calendar } from 'lucide-react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import {
  leesKalendersAntwoord,
  OPNIEUW_KOPPELEN,
  type KalendersAntwoord,
} from '@/lib/lifeos/agenda/agenda'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'

// De agenda-kiezer: in wélke Google-agenda LifeOS schrijft en leest. Haalt de
// beschrijfbare agenda's op, toont de huidige keuze, en laat de container na een
// wijziging de dag opnieuw synchroniseren zodat de weergave de nieuwe agenda toont.
//
// Container-light: hij kent zijn eigen laad-/keuze-staat, maar het herladen van de
// dag (sync + /vandaag) doet de AgendaKaart — die bezit de dag-data.

interface AgendaKiezerProps {
  /**
   * Roept de container om de dag opnieuw te synchroniseren + laden na een keuze.
   * Zonder deze stap toont /vandaag nog de vorige agenda (die staat in de cache).
   */
  onGewijzigd: () => Promise<void>
  /** De bestaande koppel-flow (vraagt nu óók de calendarlist-scope). */
  onKoppelOpnieuw: () => void
}

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  /** De koppeling mist de calendarlist-scope: alleen opnieuw koppelen helpt. */
  | { fase: 'opnieuw_koppelen' }
  | { fase: 'ok'; data: KalendersAntwoord }

export function AgendaKiezer({ onGewijzigd, onKoppelOpnieuw }: AgendaKiezerProps) {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [bezig, setBezig] = useState(false)
  const [actieFout, setActieFout] = useState<string | null>(null)

  // Zelfde generatie-/verval-patroon als AgendaKaart: een vlucht die bij unmount
  // nog loopt, zet straks niets meer.
  const generatie = useRef(0)

  const laadKalenders = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/agenda/kalenders', leesKalendersAntwoord).then((uitkomst) => {
      if (mijn !== generatie.current) return
      if (uitkomst.ok) {
        setStaat({ fase: 'ok', data: uitkomst.waarde })
      } else if (uitkomst.fout === OPNIEUW_KOPPELEN) {
        // Het sein uit /kalenders: scope ontbreekt. Geen kale foutmelding, maar
        // de nette herkoppel-knop.
        setStaat({ fase: 'opnieuw_koppelen' })
      } else {
        setStaat({ fase: 'fout', bericht: uitkomst.fout })
      }
    })
  }, [])

  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laadKalenders()
    return verval
  }, [laadKalenders, verval])

  const kies = useCallback(
    async (kalenderId: string) => {
      const mijn = generatie.current
      setActieFout(null)
      setBezig(true)

      const uitkomst = await haalJson('/api/lifeos/agenda/kalender', leesNiets, {
        method: 'POST',
        body: JSON.stringify({ kalenderId }),
      })
      if (mijn !== generatie.current) return
      if (!uitkomst.ok) {
        setBezig(false)
        setActieFout(uitkomst.fout)
        return
      }

      // Optimistisch de keuze in de select bijwerken, dan de dag laten herladen.
      setStaat((s) => (s.fase === 'ok' ? { fase: 'ok', data: { ...s.data, gekozen: kalenderId } } : s))
      await onGewijzigd()
      if (mijn !== generatie.current) return
      setBezig(false)
    },
    [onGewijzigd],
  )

  if (staat.fase === 'laden') return <KiezerSkelet />

  if (staat.fase === 'fout') {
    return <Foutmelding bericht={staat.bericht} opnieuw={() => void laadKalenders()} />
  }

  if (staat.fase === 'opnieuw_koppelen') {
    return (
      <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
          Koppel je agenda opnieuw om te kunnen kiezen in welke agenda LifeOS schrijft.
        </p>
        <Knop onClick={onKoppelOpnieuw}>
          <Calendar size={13} strokeWidth={2.2} aria-hidden="true" />
          Koppel opnieuw om je agenda te kiezen
        </Knop>
      </div>
    )
  }

  // Geen beschrijfbare agenda gevonden: niets te kiezen. Eerlijk melden i.p.v. een
  // lege select tonen.
  if (staat.data.kalenders.length === 0) {
    return (
      <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0 }}>
        Geen agenda gevonden waarin je mag schrijven.
      </p>
    )
  }

  // null (nog geen keuze) = de primaire agenda: toon die als geselecteerd.
  const gekozenId =
    staat.data.gekozen ??
    staat.data.kalenders.find((k) => k.primair)?.id ??
    staat.data.kalenders[0]?.id ??
    ''

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label htmlFor="agenda-kiezer" style={LABEL}>
        Agenda
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Calendar
          size={14}
          strokeWidth={2.2}
          aria-hidden="true"
          style={{ position: 'absolute', left: 11, color: 'var(--text-4)', pointerEvents: 'none' }}
        />
        <select
          id="agenda-kiezer"
          value={gekozenId}
          disabled={bezig}
          onChange={(e) => void kies(e.target.value)}
          style={SELECT}
        >
          {staat.data.kalenders.map((k) => (
            <option key={k.id} value={k.id}>
              {k.primair ? `${k.naam} (hoofdagenda)` : k.naam}
            </option>
          ))}
        </select>
      </div>
      {bezig ? (
        <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Bijwerken…</span>
      ) : null}
      {actieFout ? <Foutmelding bericht={actieFout} /> : null}
    </div>
  )
}

/** Rustige placeholder in navy terwijl de agenda's laden. */
function KiezerSkelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 6 }}>
      <div style={{ height: 11, width: '22%', borderRadius: 4, background: 'var(--bg-raised)' }} />
      <div style={{ height: 38, width: '100%', borderRadius: 10, background: 'var(--bg-raised)' }} />
    </div>
  )
}

const LABEL: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
}

const SELECT: CSSProperties = {
  width: '100%',
  minWidth: 0,
  // Ruimte links voor het icoon, rechts voor de eigen dropdown-pijl.
  padding: '9px 12px 9px 34px',
  borderRadius: 10,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
  cursor: 'pointer',
  colorScheme: 'dark',
}
