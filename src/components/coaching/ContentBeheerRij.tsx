'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Pencil, Eye, EyeOff, Trash2 } from 'lucide-react'
import {
  PIJLER_LABELS,
  PIJLER_STIJL,
  CONTENT_TYPE_LABELS,
  doelgroepOmschrijving,
  type CoachingContent,
} from '@/lib/coaching/content'
import { CONTENT_TYPE_ICOON } from '@/components/coaching/content-iconen'

export interface ContentBeheerRijProps {
  content: CoachingContent
  bezig: boolean
  bevestigVerwijder: boolean
  onBewerk: () => void
  onTogglePublicatie: () => void
  onVraagVerwijder: () => void
  onVerwijder: () => void
  onAnnuleerVerwijder: () => void
}

/** Coach-facing beheerrij: toont content-metadata en de acties bewerken/publiceren/verwijderen. */
export function ContentBeheerRij({
  content, bezig, bevestigVerwijder,
  onBewerk, onTogglePublicatie, onVraagVerwijder, onVerwijder, onAnnuleerVerwijder,
}: ContentBeheerRijProps) {
  const stijl = PIJLER_STIJL[content.pijler]
  const Icoon = CONTENT_TYPE_ICOON[content.type]

  return (
    <Card className="mf-lift" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: content.gepubliceerd ? 1 : 0.72 }}>
      <span aria-hidden style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: stijl.bg, color: stijl.color,
        border: `1px solid color-mix(in srgb, ${stijl.color} 22%, transparent)`,
      }}>
        <Icoon size={18} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {content.titel}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: stijl.color }}>{PIJLER_LABELS[content.pijler]}</span>
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{CONTENT_TYPE_LABELS[content.type]}</span>
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{doelgroepOmschrijving(content)}</span>
          {!content.gepubliceerd && <Badge variant="warning" style={{ fontSize: 10, padding: '2px 8px' }}>Concept</Badge>}
        </div>
      </div>

      {bevestigVerwijder ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Button variant="danger" size="sm" loading={bezig} onClick={onVerwijder}>Verwijder</Button>
          <Button variant="ghost" size="sm" onClick={onAnnuleerVerwijder}>Annuleer</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <Button
            variant="ghost" size="sm"
            onClick={onBewerk}
            leftIcon={<Pencil size={14} aria-hidden />}
            aria-label={`${content.titel} bewerken`}
          >
            Bewerk
          </Button>
          <Button
            variant="ghost" size="sm"
            loading={bezig}
            onClick={onTogglePublicatie}
            leftIcon={content.gepubliceerd ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
            aria-label={content.gepubliceerd ? `${content.titel} verbergen` : `${content.titel} publiceren`}
          >
            {content.gepubliceerd ? 'Verberg' : 'Publiceer'}
          </Button>
          <Button
            variant="ghost" size="sm"
            onClick={onVraagVerwijder}
            leftIcon={<Trash2 size={14} aria-hidden />}
            aria-label={`${content.titel} verwijderen`}
            style={{ color: 'var(--mf-red)' }}
          >
            Verwijder
          </Button>
        </div>
      )}
    </Card>
  )
}
