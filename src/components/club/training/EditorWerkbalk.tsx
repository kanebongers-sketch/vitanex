'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookmarkPlus, Printer, Save, Trash2 } from 'lucide-react'
import { idUit, stuur } from './api'
import { SjabloonToepassen } from './SchemaActies'

interface EditorWerkbalkProps {
  schemaId: string
  naam: string
  isSjabloon: boolean
  vestiging: string
  gewijzigd: boolean
  bezig: boolean
  onOpslaan: () => void
  editorHref: string
  terugHref: string
}

/** Opslaan, printen, sjabloon maken of toepassen en verwijderen. */
export function EditorWerkbalk(p: EditorWerkbalkProps) {
  const router = useRouter()
  const [melding, setMelding] = useState<{ tekst: string; href?: string; fout?: boolean } | null>(null)

  async function alsSjabloon() {
    if (p.gewijzigd) return setMelding({ tekst: 'Sla eerst je wijzigingen op.', fout: true })
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

  return (
    <div className="club-training-werkbalk">
      <button type="button" className="club-knop club-knop--primair" onClick={p.onOpslaan} disabled={p.bezig || !p.gewijzigd} title="Ctrl+S">
        <Save aria-hidden size={16} /> {p.bezig ? 'Opslaan...' : p.gewijzigd ? 'Opslaan' : 'Opgeslagen'}
      </button>
      <button type="button" className="club-knop" onClick={() => window.print()}>
        <Printer aria-hidden size={16} /> Printen
      </button>
      {p.isSjabloon ? (
        <SjabloonToepassen sjabloonId={p.schemaId} sjabloonNaam={p.naam} vestiging={p.vestiging} lid={null} editorHref={p.editorHref} />
      ) : (
        <button type="button" className="club-knop" onClick={alsSjabloon}>
          <BookmarkPlus aria-hidden size={16} /> Opslaan als sjabloon
        </button>
      )}
      <button type="button" className="club-knop club-knop--gevaar club-knop--klein" onClick={verwijder} aria-label={`${p.naam} verwijderen`}>
        <Trash2 aria-hidden size={15} />
      </button>
      {melding && (
        <p className={`club-training-werkmelding ${melding.fout ? 'club-fout' : 'club-hint'}`} role="status">
          {melding.tekst} {melding.href && <Link href={melding.href}>Bekijk het sjabloon</Link>}
        </p>
      )}
    </div>
  )
}
