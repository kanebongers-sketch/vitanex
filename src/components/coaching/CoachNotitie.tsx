'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Lock, Check } from 'lucide-react'

interface CoachNotitieProps {
  klantId: string
  initieleNotitie: string | null
}

/**
 * Privé-notitie van de coach over een klant. Nooit zichtbaar voor de klant
 * (kolom coach_klanten.notitie, alleen leesbaar via de coach-eigen RLS/route).
 */
export function CoachNotitie({ klantId, initieleNotitie }: CoachNotitieProps) {
  const [notitie, setNotitie] = useState(initieleNotitie ?? '')
  const [opgeslagen, setOpgeslagen] = useState(initieleNotitie ?? '')
  const [bezig, setBezig] = useState(false)
  const [klaar, setKlaar] = useState(false)

  const gewijzigd = notitie.trim() !== opgeslagen.trim()

  async function bewaar() {
    if (bezig || !gewijzigd) return
    setBezig(true)
    setKlaar(false)
    const res = await authFetch(`/api/coaching/klant/${klantId}`, {
      method: 'PATCH',
      body: JSON.stringify({ notitie: notitie.trim() }),
    })
    if (res.ok) {
      setOpgeslagen(notitie.trim())
      setKlaar(true)
      setTimeout(() => setKlaar(false), 2500)
    }
    setBezig(false)
  }

  return (
    <Card style={{ padding: 20, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <Lock size={14} aria-hidden style={{ color: 'var(--text-3)' }} />
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Privé-notitie</h2>
        <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 'auto' }}>Alleen voor jou zichtbaar</span>
      </div>
      <Textarea
        value={notitie}
        onChange={e => setNotitie(e.target.value)}
        placeholder="Observaties, aandachtspunten of doelen voor deze klant…"
        rows={4}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <Button onClick={bewaar} loading={bezig} disabled={!gewijzigd} size="sm">
          Opslaan
        </Button>
        {klaar && (
          <span role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--mf-green)', fontWeight: 600 }}>
            <Check size={13} strokeWidth={3} aria-hidden /> Opgeslagen
          </span>
        )}
      </div>
    </Card>
  )
}
