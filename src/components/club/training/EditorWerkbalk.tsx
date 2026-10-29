'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { BookmarkPlus, CheckCircle2, Printer, Redo2, Save, Trash2, Undo2, UserPlus } from 'lucide-react'
import type { SchemaStatus } from '@/lib/club/training/typen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_EDITOR } from '@/lib/aiyourgym/taal/woorden/club/schema-editor'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
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
  /** Wijzigingen opslaan zonder de editor te verversen; true als het lukte. Voor acties die het opgeslagen schema gebruiken. */
  onOpslaanEerst: () => Promise<boolean>
  editorHref: string
  terugHref: string
  kanOngedaan: boolean
  kanOpnieuw: boolean
  onOngedaan: () => void
  onOpnieuw: () => void
}

const STATUS_CHIP: Record<SchemaStatus, string> = { concept: 'club-chip--info', actief: 'club-chip--ok', afgerond: 'club-chip--uit' }

/**
 * De werkbalk van de editor. Een hoofdactie: Opslaan, of bij een concept van een lid
 * Activeren (opslaan en op actief zetten). Printen en ongedaan maken zijn altijd
 * zichtbaar; sjabloon maken, kopie naar een ander lid en verwijderen staan onder Meer.
 */
export function EditorWerkbalk(p: EditorWerkbalkProps) {
  const router = useRouter()
  const t = useTekst(SCHEMA_EDITOR).werkbalk
  const l = useTekst(TRAINING_LABELS)
  const [melding, setMelding] = useState<{ tekst: string; href?: string; fout?: boolean } | null>(null)
  const [kopieOpen, setKopieOpen] = useState(false)
  const sluitKopie = useCallback(() => setKopieOpen(false), [])
  const isConcept = !p.isSjabloon && p.status === 'concept'

  /** Een actie op het opgeslagen schema: eerst de wijzigingen opslaan, dan pas de actie (een klik minder). */
  async function naOpslaan(actie: () => void | Promise<void>) {
    setMelding(null)
    if (p.gewijzigd && !(await p.onOpslaanEerst())) return
    await actie()
  }

  async function alsSjabloon() {
    const u = await stuur(`/schemas/${p.schemaId}/kopie`, 'POST', { lidId: null })
    const id = u.ok ? idUit(u.data) : null
    setMelding(id ? { tekst: t.opgeslagenAlsSjabloon, href: p.editorHref.replace('__id__', id) } : { tekst: u.ok ? t.mislukt : u.fout, fout: true })
  }

  async function verwijder() {
    if (!window.confirm(t.verwijderVraag(p.naam))) return
    const u = await stuur(`/schemas/${p.schemaId}`, 'DELETE')
    if (!u.ok) return setMelding({ tekst: u.fout, fout: true })
    router.push(p.terugHref)
    router.refresh()
  }

  const meer: MeerItem[] = [
    ...(p.isSjabloon
      ? []
      : [
          { sleutel: 'sjabloon', label: t.opslaanAlsSjabloon, icoon: <BookmarkPlus aria-hidden size={16} />, onKies: () => void naOpslaan(alsSjabloon), uit: p.bezig ? t.evenGeduld : undefined },
          { sleutel: 'kopie', label: t.kopieNaarLid, icoon: <UserPlus aria-hidden size={16} />, onKies: () => void naOpslaan(() => setKopieOpen(true)), uit: p.bezig ? t.evenGeduld : undefined },
        ]),
    { sleutel: 'weg', label: p.isSjabloon ? t.sjabloonVerwijderen : t.schemaVerwijderen, icoon: <Trash2 aria-hidden size={16} />, onKies: verwijder, gevaar: true },
  ]

  const opslagTekst = p.bezig ? t.opslaanBezig : p.gewijzigd ? t.nietOpgeslagen : t.allesOpgeslagen
  return (
    <div className="club-training-werkbalk">
      <div className="club-training-werkbalk-status">
        <span className={`club-chip ${p.isSjabloon ? 'club-chip--merk' : STATUS_CHIP[p.status]}`}>{p.isSjabloon ? t.sjabloon : l.schemaStatus[p.status]}</span>
        <span className="club-training-opslag" data-gewijzigd={p.gewijzigd || undefined} role="status">{opslagTekst}</span>
      </div>
      <div className="club-training-werkbalk-acties">
        <span className="club-training-undo" role="group" aria-label={t.ongedaan}>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={p.onOngedaan} disabled={!p.kanOngedaan} aria-label={t.ongedaan} title={t.ongedaanTitel}>
            <Undo2 aria-hidden size={16} />
          </button>
          <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={p.onOpnieuw} disabled={!p.kanOpnieuw} aria-label={t.opnieuw} title={t.opnieuwTitel}>
            <Redo2 aria-hidden size={16} />
          </button>
        </span>
        <button type="button" className="club-knop club-knop--stil" onClick={() => window.print()} aria-label={t.printen}>
          <Printer aria-hidden size={16} /> <span className="club-training-werkbalk-tekst">{t.printen}</span>
        </button>
        <EditorMeer
          items={meer}
          voet={<><kbd>Ctrl</kbd> <kbd>S</kbd> {t.sneltoetsOpslaan} · <kbd>Ctrl</kbd> <kbd>Z</kbd> {t.sneltoetsTerug} · <kbd>Alt</kbd> <kbd>N</kbd> {t.sneltoetsOefening} · <kbd>Alt</kbd> <kbd>↑↓</kbd> {t.sneltoetsVerplaatsen}</>}
        />
        {p.isSjabloon && <SjabloonToepassen sjabloonId={p.schemaId} sjabloonNaam={p.naam} vestiging={p.vestiging} lid={null} editorHref={p.editorHref} klein={false} />}
        {isConcept ? (
          <>
            {p.gewijzigd && (
              <button type="button" className="club-knop" onClick={p.onOpslaan} disabled={p.bezig} title={t.conceptTitel}>
                <Save aria-hidden size={16} /> <span className="club-training-werkbalk-tekst">{t.concept}</span> {t.opslaan}
              </button>
            )}
            <button type="button" className="club-knop club-knop--primair" onClick={p.onActiveren} disabled={p.bezig} title={t.activerenTitel}>
              <CheckCircle2 aria-hidden size={16} /> {t.activeren}
            </button>
          </>
        ) : (
          <button type="button" className="club-knop club-knop--primair" onClick={p.onOpslaan} disabled={p.bezig || !p.gewijzigd} title="Ctrl+S">
            <Save aria-hidden size={16} /> {p.bezig ? t.opslaanBezig : p.gewijzigd ? t.opslaanKnop : t.opgeslagen}
          </button>
        )}
      </div>
      {melding && (
        <p className={`club-training-werkmelding ${melding.fout ? 'club-fout' : 'club-hint'}`} role="status">
          {melding.tekst} {melding.href && <Link href={melding.href}>{t.bekijkSjabloon}</Link>}
        </p>
      )}
      {kopieOpen && <KopieNaarLid schemaId={p.schemaId} naam={p.naam} vestiging={p.vestiging} editorHref={p.editorHref} onSluit={sluitKopie} />}
    </div>
  )
}
