'use client'

import { useState, type CSSProperties, type FormEvent } from 'react'
import { ListChecks, Plus, StickyNote } from 'lucide-react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Knop } from '@/components/lifeos/os/Knop'
import { MAX_TEKST_LENGTE } from '@/lib/lifeos/notities/notities'
import { BrainDumpBody } from '@/components/lifeos/notities/BrainDumpBody'
import { useBrainDump } from '@/components/lifeos/notities/useBrainDump'
import { TakenBody } from '@/components/lifeos/taken/TakenBody'
import { useProjecten } from '@/components/lifeos/taken/useProjecten'
import { useTaken } from '@/components/lifeos/taken/useTaken'
import { useVandaag } from '@/components/lifeos/taken/useVandaag'

// ─── "Vang op" — één capture, twee bestemmingen ─────────────────────────────
// Hier stonden twee kaarten (takenlijst + brain dump) die elk bovenaan een eigen
// snelle-invoer hadden. Dat vóélde dubbel. De ONDERLIGGENDE systemen zijn dat
// níét: taken voeden de top-3 en de datums, notities voeden de kennisgrafiek.
// Dus is alleen de CAPTURE samengevoegd, niet de systemen.
//
// Eén balk bovenaan met twee knoppen ("+ Taak" / "+ Notitie"), een segment-toggle
// eronder, en daaronder de bijhorende rijke lijst (`TakenBody` of `BrainDumpBody`).
//
// ─── Waarom de container beide hooks bezit ──────────────────────────────────
// VangOp roept `useTaken` én `useBrainDump` zelf aan en geeft ze als props door
// aan de presentational bodies (architecture.md — container/presentational). Zo is
// er precies één hook-instantie per systeem: de capture-balk en de lijst kijken
// naar exact dezelfde staat en lopen nooit uit elkaar.
//
// Het invoerveld deelt de tekst-buffer van `useBrainDump` (`tekst`/`zetTekst`).
// Bewust: zo krijgt "+ Taak" én "+ Notitie" dezelfde tekst mee, en zet de
// rollback van een mislukte notitie je tekst terug in dít veld. De taken-kant
// leest die tekst en wist 'm na een geslaagde POST.

type Modus = 'taken' | 'notities'

export function VangOp() {
  const taken = useTaken()
  const projecten = useProjecten()
  const vandaag = useVandaag()
  const dump = useBrainDump()
  const [modus, setModus] = useState<Modus>('taken')

  const invoer = dump.tekst
  const leeg = invoer.trim().length === 0

  // Elke knop hangt aan zijn eigen systeem: een notitie-laadfout mag het opvoeren
  // van een taak niet blokkeren, en andersom. Het veld zelf blijft altijd te
  // typen — capture mag nooit op slot door een storing in één van beide lijsten.
  const kanTaak = vandaag !== null && taken.staat.fase === 'ok' && !taken.bezig
  const kanNotitie = dump.staat.fase === 'ok'

  // Enter in het veld = "+ Taak" (de standaard-submit). "+ Notitie" is een losse
  // knop. Na toevoegen springt de weergave naar het bijhorende tabblad, zodat je
  // ziet waar wat je net vastlegde terechtkwam.
  async function voegTaakToe(e: FormEvent) {
    e.preventDefault()
    if (leeg || !vandaag || taken.staat.fase !== 'ok' || taken.bezig) return
    setModus('taken')
    const gelukt = await taken.voegToe(invoer.trim(), vandaag)
    if (gelukt) dump.zetTekst('')
  }

  function voegNotitieToe() {
    if (leeg || dump.staat.fase !== 'ok') return
    setModus('notities')
    // Leest `dump.tekst`, wist het veld en draait bij een fout terug — met melding.
    dump.voegToe()
  }

  return (
    <Kaart titel="Vang op" vervangt="Todoist · Apple Notes">
      <div style={{ display: 'grid', gap: 14 }}>
        <form onSubmit={(e) => void voegTaakToe(e)} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <label htmlFor="vangop-invoer" style={VERBORGEN}>
            Wat speelt er?
          </label>
          <input
            id="vangop-invoer"
            value={invoer}
            onChange={(e) => dump.zetTekst(e.target.value)}
            placeholder="Wat speelt er?"
            maxLength={MAX_TEKST_LENGTE}
            autoComplete="off"
            style={INVOER}
          />
          <Knop type="submit" variant="primair" disabled={leeg || !kanTaak}>
            <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
            Taak
          </Knop>
          <Knop type="button" onClick={voegNotitieToe} disabled={leeg || !kanNotitie}>
            <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
            Notitie
          </Knop>
        </form>

        <SegmentToggle modus={modus} onKies={setModus} />

        {modus === 'taken' ? (
          <TakenBody taken={taken} projecten={projecten} vandaag={vandaag} />
        ) : (
          <BrainDumpBody dump={dump} />
        )}
      </div>
    </Kaart>
  )
}

interface SegmentToggleProps {
  modus: Modus
  onKies: (modus: Modus) => void
}

/** Segmentschakelaar "Taken | Notities". Toegankelijk via `aria-pressed`. */
function SegmentToggle({ modus, onKies }: SegmentToggleProps) {
  return (
    <div role="group" aria-label="Kies weergave" style={GROEP}>
      <SegmentKnop actief={modus === 'taken'} onClick={() => onKies('taken')} Icoon={ListChecks}>
        Taken
      </SegmentKnop>
      <SegmentKnop actief={modus === 'notities'} onClick={() => onKies('notities')} Icoon={StickyNote}>
        Notities
      </SegmentKnop>
    </div>
  )
}

interface SegmentKnopProps {
  actief: boolean
  onClick: () => void
  Icoon: typeof ListChecks
  children: string
}

function SegmentKnop({ actief, onClick, Icoon, children }: SegmentKnopProps) {
  const [hover, setHover] = useState(false)

  return (
    <button
      type="button"
      aria-pressed={actief}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={segmentStijl(actief, hover)}
    >
      <Icoon size={14} strokeWidth={2.2} aria-hidden="true" />
      {children}
    </button>
  )
}

/** Inline styles kennen geen `:hover`; de actieve/hover-staat loopt via props. */
function segmentStijl(actief: boolean, hover: boolean): CSSProperties {
  return {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '7px 12px',
    borderRadius: 999,
    border: `1px solid ${actief ? 'var(--brand)' : 'transparent'}`,
    background: actief ? 'var(--brand-soft)' : 'transparent',
    color: actief ? 'var(--brand)' : hover ? 'var(--text-2)' : 'var(--text-3)',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition:
      'color 180ms var(--ease), background 180ms var(--ease), border-color 180ms var(--ease)',
  }
}

const GROEP: CSSProperties = {
  display: 'flex',
  gap: 4,
  padding: 3,
  borderRadius: 999,
  background: 'var(--bg-raised)',
  border: '1px solid var(--line)',
}

/** Zichtbaar voor screenreaders, niet voor het oog. */
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

const INVOER: CSSProperties = {
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
