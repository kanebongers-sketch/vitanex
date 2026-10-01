'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { haalJson, isObject, tekstOfNull } from '@/lib/lifeos/api/http'

// "Nu mee bezig": één tik zet een blok vanaf nu in je persoonlijke agenda (zie
// POST /api/lifeos/taken/[id]/nu). Daarna staat er tot wanneer.

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

function leesBlok(ruw: unknown): { eindOp: string } | null {
  if (!isObject(ruw)) return null
  const eindOp = tekstOfNull(ruw.eindOp)
  return eindOp ? { eindOp } : null
}

export function NuBezigKnop({ taakId, titel }: { taakId: string; titel: string }) {
  const [staat, setStaat] = useState<{ fase: 'rust' | 'bezig' } | { fase: 'klaar'; tot: string } | { fase: 'fout'; bericht: string }>({ fase: 'rust' })

  async function start() {
    setStaat({ fase: 'bezig' })
    const uit = await haalJson(`/api/lifeos/taken/${encodeURIComponent(taakId)}/nu`, leesBlok, { method: 'POST' })
    setStaat(uit.ok ? { fase: 'klaar', tot: TIJD.format(new Date(uit.waarde.eindOp)) } : { fase: 'fout', bericht: uit.fout })
  }

  if (staat.fase === 'klaar') {
    return <span role="status" style={{ flexShrink: 0, fontSize: 12, color: 'var(--brand)', paddingTop: 8 }}>In agenda tot {staat.tot}</span>
  }
  return (
    <button
      type="button"
      onClick={() => void start()}
      disabled={staat.fase === 'bezig'}
      aria-label={`Nu mee bezig: zet "${titel}" vanaf nu in je agenda`}
      title={staat.fase === 'fout' ? staat.bericht : 'Nu mee bezig — zet een blok in je agenda'}
      className="lifeos-nu-knop"
      style={{
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, marginTop: 3, borderRadius: 8, cursor: 'pointer',
        border: `1px solid ${staat.fase === 'fout' ? 'var(--brand)' : 'var(--line)'}`,
        background: 'transparent', color: staat.fase === 'fout' ? 'var(--brand)' : 'var(--text-3)',
        opacity: staat.fase === 'bezig' ? 0.5 : 1,
        transition: 'color 150ms, border-color 150ms',
      }}
    >
      <Play size={13} aria-hidden />
    </button>
  )
}
