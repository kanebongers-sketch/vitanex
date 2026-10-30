'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { stuur } from '@/components/club/leden/stuur'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LID_SCHEMAS } from '@/lib/aiyourgym/taal/woorden/club/lid-schemas'

// Mag een lid het schema van de trainer zelf aanpassen? Standaard nee.
// Leden maken altijd wel een eigen schema naast dat van de trainer.

interface Props {
  begin: boolean
  /** Alleen Kane en de eigenaar passen dit aan. */
  magAanpassen: boolean
}

export function LidSchemaInstelling({ begin, magAanpassen }: Props) {
  const router = useRouter()
  const t = useTekst(LID_SCHEMAS).instelling
  const [aan, setAan] = useState(begin)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  async function wissel(nieuw: boolean) {
    setAan(nieuw)
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/training/lid-schemas', 'PATCH', { trainerAanpassen: nieuw })
    setBezig(false)
    if (!uit.ok) {
      setAan(!nieuw)
      return setMelding({ ok: false, tekst: uit.fout })
    }
    setMelding({ ok: true, tekst: t.opgeslagen })
    router.refresh()
  }

  return (
    <section className="club-beheer-formulier" aria-labelledby="lid-schemas-kop">
      <fieldset className="club-beheer-keuzes">
        <legend id="lid-schemas-kop" className="club-label">{t.kop}</legend>
        <p className="club-hint">{t.uitleg}</p>
        <label className="club-beheer-keuze">
          <input type="checkbox" checked={aan} disabled={bezig || !magAanpassen} onChange={(e) => void wissel(e.target.checked)} />
          <span>{t.trainerAanpassen}</span>
        </label>
        <small className="club-hint">{magAanpassen ? t.hint : t.alleenEigenaar}</small>
      </fieldset>
      <div role="status" aria-live="polite">
        {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
      </div>
    </section>
  )
}
