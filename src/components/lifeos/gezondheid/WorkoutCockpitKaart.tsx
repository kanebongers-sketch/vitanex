'use client'

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import Link from 'next/link'
import { Dumbbell, Plus, ArrowUpRight } from 'lucide-react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { supabase } from '@/lib/supabase/supabase'
import { vitaEvent } from '@/lib/vita/events'
import { vandaagNL } from '@/lib/utils/date-nl'
import { tijdelijkeId } from './lees'

// ─── Workout — echte MentaForce-data ────────────────────────────────────────
// Quick-log naar tabel `training_logs` via de browser-supabase-client, precies
// zoals de /sport/training-pagina. Eén rij (naam + duur + optionele notitie) is
// genoeg voor een snelle log; de rijke logger (sets/oefeningen) blijft op
// /sport/training. Na succes voedt `vitaEvent` de retentie-loop.
//
// Optimistisch met rollback + zichtbare fout. We lezen en schrijven dezelfde
// NL-dagsleutel, zodat een cockpit-log meteen in "vandaag" verschijnt.

interface TLog {
  id: string
  naam: string
  duur_minuten: number | null
}

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; userId: string; logs: TLog[] }

/**
 * Een mislukte log, mét de training die niet werd opgeslagen.
 *
 * We bewaren de invoer omdat `Foutmelding` zonder `opnieuw` een doodlopende weg
 * is ("Weglaten = geen weg terug. Doe dat niet."). Het formulier is op dat
 * moment al leeggemaakt noch verzonden — zonder deze kopie zou "opnieuw" de
 * gebruiker vragen alles opnieuw te typen.
 */
interface ActieFout {
  bericht: string
  naam: string
  duurMinuten: number | null
  notitie: string | null
}

export function WorkoutCockpitKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<ActieFout | null>(null)
  const [bezig, setBezig] = useState(false)
  const generatie = useRef(0)

  // Bewust GEEN `async` op de buitenste functie, maar een async IIFE erbinnen —
  // zelfde vorm als `WaterCockpitKaart`. De React-lintregel `set-state-in-effect`
  // kan bij een `async` functie niet bewijzen dát er geen setState vóór de eerste
  // await staat, en gaat er dan conservatief van uit dat het wél zo is. Dat gaf
  // hier een harde lint-error terwijl de code correct was. Door de asynchronie
  // één niveau naar binnen te halen is de functie die het effect aanroept
  // aantoonbaar synchroon-vrij van setState.
  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return (async () => {
      try {
        const { data: { user }, error: authFout } = await supabase.auth.getUser()
        if (authFout) throw authFout
        if (mijn !== generatie.current) return
        if (!user) {
          setStaat({ fase: 'fout', bericht: 'Je bent niet ingelogd.' })
          return
        }

        const { data, error } = await supabase
          .from('training_logs')
          .select('id, naam, duur_minuten')
          .eq('user_id', user.id)
          .eq('datum', vandaagNL())
        if (error) throw error
        if (mijn !== generatie.current) return

        const logs: TLog[] = (data ?? []).map((r) => ({
          id: String(r.id),
          naam: typeof r.naam === 'string' ? r.naam : 'Training',
          duur_minuten: typeof r.duur_minuten === 'number' && Number.isFinite(r.duur_minuten) ? r.duur_minuten : null,
        }))
        setStaat({ fase: 'ok', userId: user.id, logs })
      } catch {
        if (mijn !== generatie.current) return
        setStaat({ fase: 'fout', bericht: 'We konden je trainingen niet ophalen. Probeer het opnieuw.' })
      }
    })()
  }, [])

  useEffect(() => {
    void laad()
    return () => {
      generatie.current++
    }
  }, [laad])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  const voegToe = useCallback(
    async (naam: string, duurMinuten: number | null, notitie: string | null): Promise<boolean> => {
      if (staat.fase !== 'ok' || bezig) return false
      const userId = staat.userId
      setBezig(true)
      setActieFout(null)

      const tijdId = tijdelijkeId()
      const optimistisch: TLog = { id: tijdId, naam, duur_minuten: duurMinuten }
      setStaat((s) => (s.fase === 'ok' ? { ...s, logs: [...s.logs, optimistisch] } : s))

      try {
        const { data, error } = await supabase
          .from('training_logs')
          .insert({
            user_id: userId,
            datum: vandaagNL(),
            naam,
            duur_minuten: duurMinuten,
            notities: notitie,
          })
          .select('id')
          .single()
        if (error || !data) throw error ?? new Error('Geen rij teruggekregen.')

        setBezig(false)
        setStaat((s) =>
          s.fase === 'ok'
            ? { ...s, logs: s.logs.map((l) => (l.id === tijdId ? { ...l, id: String(data.id) } : l)) }
            : s,
        )
        // Voed de retentie-loop, net als de volledige workout-logger.
        vitaEvent('habit_completed', { kind: 'training' })
        return true
      } catch {
        setBezig(false)
        // Rollback: optimistische regel eruit + zichtbare fout. De invoer gaat
        // mee zodat "Opnieuw proberen" dezelfde training nog eens kan loggen.
        setStaat((s) => (s.fase === 'ok' ? { ...s, logs: s.logs.filter((l) => l.id !== tijdId) } : s))
        setActieFout({ bericht: 'Opslaan mislukt.', naam, duurMinuten, notitie })
        return false
      }
    },
    [staat, bezig],
  )

  return (
    <Kaart titel="Workout" vervangt="Strong · Hevy">
      {staat.fase === 'laden' ? <Skelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? (
        <Inhoud logs={staat.logs} bezig={bezig} actieFout={actieFout} onToevoeg={voegToe} />
      ) : null}
    </Kaart>
  )
}

interface InhoudProps {
  logs: TLog[]
  bezig: boolean
  actieFout: ActieFout | null
  onToevoeg: (naam: string, duurMinuten: number | null, notitie: string | null) => Promise<boolean>
}

function Inhoud({ logs, bezig, actieFout, onToevoeg }: InhoudProps) {
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {logs.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2 }}>
          {logs.map((log) => (
            <li
              key={log.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--line)' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <Dumbbell size={15} strokeWidth={2.2} aria-hidden="true" style={{ color: 'var(--brand)', flex: 'none' }} />
                <span style={{ fontSize: 13, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.naam}
                </span>
              </span>
              <span className="os-cijfer" style={{ fontSize: 13, color: 'var(--text-4)', flex: 'none' }}>
                {log.duur_minuten !== null ? `${log.duur_minuten} min` : '—'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-4)' }}>Nog geen training vandaag gelogd.</p>
      )}

      <WorkoutToevoegen bezig={bezig} onToevoeg={onToevoeg} />

      {actieFout ? (
        <Foutmelding
          bericht={`${actieFout.bericht} "${actieFout.naam}" is niet opgeslagen.`}
          opnieuw={() => {
            void onToevoeg(actieFout.naam, actieFout.duurMinuten, actieFout.notitie)
          }}
        />
      ) : null}

      {/* `os-knop-link` stond hier als className, maar die klasse bestaat
          nergens in globals.css — het uiterlijk kwam volledig uit VOLLEDIG_LINK.
          Weg: een klasse die niets doet laat de volgende lezer zoeken naar CSS
          die er niet is. */}
      <Link href="/sport/training" style={VOLLEDIG_LINK}>
        Volledige workout
        <ArrowUpRight size={14} strokeWidth={2.4} aria-hidden="true" />
      </Link>
    </div>
  )
}

interface WorkoutToevoegenProps {
  bezig: boolean
  onToevoeg: (naam: string, duurMinuten: number | null, notitie: string | null) => Promise<boolean>
}

function WorkoutToevoegen({ bezig, onToevoeg }: WorkoutToevoegenProps) {
  const idBasis = useId()
  const [naam, setNaam] = useState('')
  const [duur, setDuur] = useState('')
  const [notitie, setNotitie] = useState('')

  const kanVerzenden = naam.trim().length > 0 && !bezig

  const versturen = async (e: FormEvent) => {
    e.preventDefault()
    if (!kanVerzenden) return
    const duurGetal = duur.trim() === '' ? null : Number(duur)
    const geldigeDuur = duurGetal !== null && Number.isFinite(duurGetal) && duurGetal >= 0 ? Math.round(duurGetal) : null

    const gelukt = await onToevoeg(naam.trim(), geldigeDuur, notitie.trim() === '' ? null : notitie.trim())
    if (gelukt) {
      setNaam('')
      setDuur('')
      setNotitie('')
    }
  }

  return (
    <form onSubmit={(e) => void versturen(e)} style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label htmlFor={`${idBasis}-naam`} style={VERBORGEN}>
            Naam van de training
          </label>
          <input
            id={`${idBasis}-naam`}
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Bijv. Push, hardlopen…"
            maxLength={120}
            disabled={bezig}
            style={INVOER}
          />
        </div>
        <div style={{ width: 92, flex: 'none' }}>
          <label htmlFor={`${idBasis}-duur`} style={VERBORGEN}>
            Duur in minuten
          </label>
          <input
            id={`${idBasis}-duur`}
            type="number"
            inputMode="numeric"
            min={0}
            max={600}
            value={duur}
            onChange={(e) => setDuur(e.target.value)}
            placeholder="min"
            disabled={bezig}
            style={{ ...INVOER, textAlign: 'center' }}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${idBasis}-notitie`} style={VERBORGEN}>
          Notitie (optioneel)
        </label>
        <input
          id={`${idBasis}-notitie`}
          value={notitie}
          onChange={(e) => setNotitie(e.target.value)}
          placeholder="Notitie (optioneel)"
          maxLength={200}
          disabled={bezig}
          style={INVOER}
        />
      </div>

      <Knop type="submit" variant="primair" disabled={!kanVerzenden}>
        <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
        Training loggen
      </Knop>
    </form>
  )
}

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 11 }}>
      {[64, 48].map((breedte, i) => (
        <div key={i} style={{ height: 14, width: `${breedte}%`, borderRadius: 4, background: 'var(--bg-raised)' }} />
      ))}
      <div style={{ height: 34, width: '100%', borderRadius: 12, background: 'var(--bg-raised)' }} />
    </div>
  )
}

const INVOER: CSSProperties = {
  width: '100%',
  minWidth: 0,
  padding: '8px 12px',
  borderRadius: 12,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
}

const VOLLEDIG_LINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-3)',
  textDecoration: 'none',
  justifySelf: 'start',
}

const VERBORGEN: CSSProperties = {
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
