'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Calendar } from 'lucide-react'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import {
  isSchrijfbaar,
  leesKalendersAntwoord,
  OPNIEUW_KOPPELEN,
  type KalendersAntwoord,
} from '@/lib/lifeos/agenda/agenda'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { AgendaKalenderLijst } from './AgendaKalenderLijst'
import { AgendaKiezer } from './AgendaKiezer'

// Container voor de agenda-instellingen: haalt ALLE agenda's op en voedt twee
// presentationele kinderen — de zijbalk met zichtbaarheids-vinkjes (wat je ZIET)
// en de schrijf-doel-kiezer (waar NIEUWE afspraken heen gaan). Twee dingen, één
// bron, hier gescheiden gehouden.
//
// Zichtbaarheid wijzigen → opnieuw synchroniseren + de dag herladen (`onGewijzigd`),
// zodat het rooster de nieuwe selectie toont. Het schrijf-doel wijzigen doet dat
// NIET: dat verandert niet wat je ziet, alleen waar het volgende blok landt.

interface AgendaKalendersProps {
  /** Re-sync + herlaad de dag na een zichtbaarheids-wijziging (bezit de AgendaKaart). */
  onGewijzigd: () => Promise<void>
  /** De bestaande koppel-flow (vraagt óók de calendarlist-scope). */
  onKoppelOpnieuw: () => void
}

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  /** De koppeling mist de calendarlist-scope: alleen opnieuw koppelen helpt. */
  | { fase: 'opnieuw_koppelen' }
  | { fase: 'ok'; data: KalendersAntwoord }

export function AgendaKalenders({ onGewijzigd, onKoppelOpnieuw }: AgendaKalendersProps) {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [bezigId, setBezigId] = useState<string | null>(null)
  const [schrijfBezig, setSchrijfBezig] = useState(false)
  const [actieFout, setActieFout] = useState<string | null>(null)

  // Zelfde generatie-/verval-patroon als AgendaKaart: een vlucht die bij unmount
  // nog loopt, zet straks niets meer.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/agenda/kalenders', leesKalendersAntwoord).then((uitkomst) => {
      if (mijn !== generatie.current) return
      if (uitkomst.ok) {
        setStaat({ fase: 'ok', data: uitkomst.waarde })
      } else if (uitkomst.fout === OPNIEUW_KOPPELEN) {
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
    void laad()
    return verval
  }, [laad, verval])

  /**
   * Zet één agenda aan/uit in de weergave: optimistisch, met rollback bij falen,
   * en na succes een re-sync + herlaad van de dag zodat het rooster meeverandert.
   */
  const wisselZichtbaar = useCallback(
    async (kalenderId: string, zichtbaar: boolean) => {
      const mijn = generatie.current
      setActieFout(null)
      setBezigId(kalenderId)
      setStaat((s) => (s.fase === 'ok' ? { fase: 'ok', data: metZichtbaar(s.data, kalenderId, zichtbaar) } : s))

      const uitkomst = await haalJson('/api/lifeos/agenda/kalender/zichtbaar', leesNiets, {
        method: 'POST',
        body: JSON.stringify({ kalenderId, zichtbaar }),
      })
      if (mijn !== generatie.current) return

      if (!uitkomst.ok) {
        // Rollback: terug naar de vorige stand.
        setStaat((s) => (s.fase === 'ok' ? { fase: 'ok', data: metZichtbaar(s.data, kalenderId, !zichtbaar) } : s))
        setActieFout(uitkomst.fout)
        setBezigId(null)
        return
      }

      await onGewijzigd()
      if (mijn !== generatie.current) return
      setBezigId(null)
    },
    [onGewijzigd],
  )

  /**
   * Kies het schrijf-doel (waar nieuwe afspraken heen gaan). Optimistisch, met
   * rollback. Géén re-sync/herlaad: dit verandert de weergave niet.
   */
  const kiesSchrijfDoel = useCallback(
    async (kalenderId: string) => {
      const mijn = generatie.current
      const vorig = staat.fase === 'ok' ? staat.data.schrijfDoel : null
      setActieFout(null)
      setSchrijfBezig(true)
      setStaat((s) => (s.fase === 'ok' ? { fase: 'ok', data: { ...s.data, schrijfDoel: kalenderId } } : s))

      const uitkomst = await haalJson('/api/lifeos/agenda/kalender', leesNiets, {
        method: 'POST',
        body: JSON.stringify({ kalenderId }),
      })
      if (mijn !== generatie.current) return

      if (!uitkomst.ok) {
        setStaat((s) => (s.fase === 'ok' ? { fase: 'ok', data: { ...s.data, schrijfDoel: vorig } } : s))
        setActieFout(uitkomst.fout)
      }
      setSchrijfBezig(false)
    },
    [staat],
  )

  if (staat.fase === 'laden') return <KalendersSkelet />

  if (staat.fase === 'fout') {
    return <Foutmelding bericht={staat.bericht} opnieuw={() => void laad()} />
  }

  if (staat.fase === 'opnieuw_koppelen') {
    return (
      <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
          Koppel je agenda opnieuw om je agenda&apos;s te kunnen tonen en kiezen.
        </p>
        <Knop onClick={onKoppelOpnieuw}>
          <Calendar size={13} strokeWidth={2.2} aria-hidden="true" />
          Koppel opnieuw
        </Knop>
      </div>
    )
  }

  const schrijfbaar = staat.data.kalenders.filter((k) => isSchrijfbaar(k.toegang))

  return (
    <div
      style={{
        display: 'grid',
        gap: 14,
        padding: 14,
        borderRadius: 'var(--radius-sm, 10px)',
        border: '1px solid var(--line)',
        background: 'var(--bg-app)',
      }}
    >
      <AgendaKalenderLijst kalenders={staat.data.kalenders} bezigId={bezigId} onToggle={wisselZichtbaar} />
      <div style={{ height: 1, background: 'var(--line)' }} aria-hidden="true" />
      <AgendaKiezer
        kalenders={schrijfbaar}
        schrijfDoel={staat.data.schrijfDoel}
        bezig={schrijfBezig}
        onKies={kiesSchrijfDoel}
      />
      {actieFout ? <Foutmelding bericht={actieFout} /> : null}
    </div>
  )
}

/** Zet de zichtbaarheid van één agenda in het antwoord — immutabel. */
function metZichtbaar(data: KalendersAntwoord, kalenderId: string, zichtbaar: boolean): KalendersAntwoord {
  return {
    ...data,
    kalenders: data.kalenders.map((k) => (k.id === kalenderId ? { ...k, zichtbaar } : k)),
  }
}

/** Rustige placeholder in navy terwijl de agenda's laden. */
function KalendersSkelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 8, padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
      <div style={{ height: 11, width: '30%', borderRadius: 4, background: 'var(--bg-raised)' }} />
      <div style={{ height: 26, width: '100%', borderRadius: 6, background: 'var(--bg-raised)' }} />
      <div style={{ height: 26, width: '100%', borderRadius: 6, background: 'var(--bg-raised)' }} />
      <div style={{ height: 38, width: '100%', borderRadius: 10, background: 'var(--bg-raised)' }} />
    </div>
  )
}
