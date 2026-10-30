'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LID_SCHEMAS } from '@/lib/aiyourgym/taal/woorden/club/lid-schemas'
import './lid-schema.css'

// Een schema dat het lid zelf maakte, overnemen als schema van de trainer.
// Eerst een korte bevestiging: daarna past het lid het niet meer zelf aan
// (tenzij de sportschool dat toestaat).

export function LidSchemaOvernemen({ schemaId }: { schemaId: string }) {
  const router = useRouter()
  const t = useTekst(LID_SCHEMAS)
  const [vraag, setVraag] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  async function neemOver() {
    setBezig(true)
    setMelding(null)
    const uit = await stuur(`/api/club/training/schemas/${encodeURIComponent(schemaId)}/overnemen`, 'POST')
    setBezig(false)
    setVraag(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: t.overgenomen })
    router.refresh()
  }

  return (
    <div className="club-lidschema-overnemen">
      {vraag ? (
        <div className="club-lidschema-vraag" role="group" aria-label={t.overnemen}>
          <p>{t.overnemenVraag}</p>
          <div className="club-acties">
            <button type="button" className="club-knop club-knop--primair" onClick={() => void neemOver()} disabled={bezig} aria-busy={bezig || undefined}>
              {bezig ? t.overnemenBezig : t.jaOvernemen}
            </button>
            <button type="button" className="club-knop" onClick={() => setVraag(false)} disabled={bezig}>{t.annuleren}</button>
          </div>
        </div>
      ) : (
        <button type="button" className="club-knop" onClick={() => setVraag(true)}>
          <UserCheck aria-hidden size={16} /> {t.overnemen}
        </button>
      )}
      <div role="status" aria-live="polite">
        {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
      </div>
    </div>
  )
}
