'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { BookmarkPlus, CheckCircle2, Printer, Redo2, Save, Trash2, Undo2, UserPlus } from 'lucide-react'
import { SCHEMA_STATUS_LABEL, type SchemaStatus } from '@/lib/club/training/typen'
import { idUit, stuur } from './api'
import { SjabloonToepassen } from './SchemaActies'
import { EditorMeer, type MeerItem } from './editor/EditorMeer'
import { KopieNaarLid } from './editor/KopieNaarLid'

interface EditorWerkbalkProps {
  schemaId: string
  naam: string
  isSjabloon: boolean
  status: SchemaStatus
  vestiging: string
  gewijzigd: boolean
  bezig: boolean
  onOpslaan: () => void
  /** Opslaan en meteen op actief zetten (alleen bij een concept van een lid). */
  onActiveren: () => void
  editorHref: string
  terugHref: string
  kanOngedaan: boolean
  kanOpnieuw: boolean
  onOngedaan: () => void
  onOpnieuw: () => void
}

const STATUS_CHIP: Record<SchemaStatus, string> = { concept: 'club-chip--info', actief: 'club-chip--ok', afgerond: 'club-chip--uit' }
const OPSLAAN_EERST = 'Sla eerst je wijzigingen op'

/**
 * De werkbalk van de editor. Een hoofdactie: Opslaan, of bij een concept van een lid
 * Activeren (opslaan en op actief zetten). Printen en ongedaan maken zijn altijd
 * zichtbaar; sjabloon maken, kopie naar een ander lid en verwijderen staan onder Meer.
 */
export function EditorWerkbalk(p: EditorWerkbalkProps) {
  const router = useRouter()
  const [melding, setMelding] = useState<{ tekst: string; href?: string; fout?: boolean } | null>(null)
  const [kopieOpen, setKopieOpen] = useState(false)
  const sluitKopie = useCallback(() => setKopieOpen(false), [])
  const isConcept = !p.isSjabloon && p.status === 'concept'

  async function alsSjabloon() {
    const u = await stuur(`/schemas/${p.schemaId}/kopie`, 'POST', { lidId: null })
    const id = u.ok ? idUit(u.data) : null
    setMelding(id ? { tekst: 'Opgeslagen als sjabloon.', href: p.editorHref.replace('__id__', id) } : { tekst: u.ok ? 'Mislukt.' : u.fout, fout: true })
  }

  async function verwijder() {
    if (!window.confirm(`"${p.naam}" verwijderen? Dit kan niet ongedaan worden.`)) return
    const u = await stuur(`/schemas/${p.schemaId}`, 'DELETE')
    if (!u.ok) return setMelding({ tekst: u.fout, fout: true })
    router.push(p.terugHref)
    router.refresh()
  }

  const meer: MeerItem[] = [
    ...(p.isSjabloon
      ? []
      : [
          { sleutel: 'sjabloon', label: 'Opslaan als sjabloon', icoon: <BookmarkPlus aria-hidden size={16} />, onKies: alsSjabloon, uit: p.gewijzigd ? OPSLAAN_EERST : undefined },
          { sleutel: 'kopie', label: 'Kopie naar ander lid', icoon: <UserPlus aria-hidden size={16} />, onKies: () => setKopieOpen(true), uit: p.gewijzigd ? OPSLAAN_EERST : undefined },
        ]),
    { sleutel: 'weg', label: p.isSjabloon ? 'Sjabloon verwijderen' : 'Schema verwijderen', icoon: <Trash2 aria-hidden size={16} />, onKies: verwijder, gevaar: true },
  ]

  const opslagTekst = p.bezig ? 'Opslaan...' : p.gewijzigd ? 'Niet opgeslagen' : 'Alles opgeslagen'
  return (
    <div className="club-training-werkbalk">
      <div className="club-training-werkbalk-status">
        <span className={`club-chip ${p.isSjabloon ? 'club-chip--merk' : STATUS_CHIP[p.status]}`}>{p.isSjabloon ? 'Sjabloon' : SCHEMA_STATUS_LABEL[p.status]}</span>
        <span className="club-training-opslag" data-gewijzigd={p.gewijzigd || undefined} role="status">{opslagTekst}</span>
      </div>
      <div className="club-training-werkbalk-acties">
        <span className="club-training-undo" role="group" aria-label="Ongedaan maken">
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={p.onOngedaan} disabled={!p.kanOngedaan} aria-label="Ongedaan maken" title="Ongedaan maken (Ctrl+Z)">
            <Undo2 aria-hidden size={16} />
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={p.onOpnieuw} disabled={!p.kanOpnieuw} aria-label="Opnieuw" title="Opnieuw (Ctrl+Y)">
            <Redo2 aria-hidden size={16} />
          </button>
        </span>
        <button type="button" className="club-knop club-knop--stil" onClick={() => window.print()} aria-label="Printen">
          <Printer aria-hidden size={16} /> <span className="club-training-werkbalk-tekst">Printen</span>
        </button>
        <EditorMeer
          items={meer}
          voet={<><kbd>Ctrl</kbd> <kbd>S</kbd> opslaan · <kbd>Ctrl</kbd> <kbd>Z</kbd> terug · <kbd>Alt</kbd> <kbd>N</kbd> oefening · <kbd>Alt</kbd> <kbd>↑↓</kbd> verplaatsen</>}
        />
        {p.isSjabloon && <SjabloonToepassen sjabloonId={p.schemaId} sjabloonNaam={p.naam} vestiging={p.vestiging} lid={null} editorHref={p.editorHref} klein={false} />}
        {isConcept ? (
          <>
            {p.gewijzigd && (
              <button type="button" className="club-knop" onClick={p.onOpslaan} disabled={p.bezig} title="Opslaan als concept (Ctrl+S)">
                <Save aria-hidden size={16} /> <span className="club-training-werkbalk-tekst">Concept</span> opslaan
              </button>
            )}
            <button type="button" className="club-knop club-knop--primair" onClick={p.onActiveren} disabled={p.bezig} title="Opslaan en op actief zetten">
              <CheckCircle2 aria-hidden size={16} /> Activeren
            </button>
          </>
        ) : (
          <button type="button" className="club-knop club-knop--primair" onClick={p.onOpslaan} disabled={p.bezig || !p.gewijzigd} title="Ctrl+S">
            <Save aria-hidden size={16} /> {p.bezig ? 'Opslaan...' : p.gewijzigd ? 'Opslaan' : 'Opgeslagen'}
          </button>
        )}
      </div>
      {melding && (
        <p className={`club-training-werkmelding ${melding.fout ? 'club-fout' : 'club-hint'}`} role="status">
          {melding.tekst} {melding.href && <Link href={melding.href}>Bekijk het sjabloon</Link>}
        </p>
      )}
      {kopieOpen && <KopieNaarLid schemaId={p.schemaId} naam={p.naam} vestiging={p.vestiging} editorHref={p.editorHref} onSluit={sluitKopie} />}
    </div>
  )
}
