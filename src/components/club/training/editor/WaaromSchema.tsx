import { TriangleAlert } from 'lucide-react'
import { waaromUitNotitie } from '@/lib/club/training/voorstel-uitleg'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_EDITOR } from '@/lib/aiyourgym/taal/woorden/club/schema-editor'
import './vervang.css'

/**
 * "Waarom dit schema": de uitleg van het schemavoorstel, uit de notitie van
 * het schema. Past de trainer de notitie aan (zonder de kop), dan verdwijnt hij.
 */
export function WaaromSchema({ notitie }: { notitie: string }) {
  const uitleg = waaromUitNotitie(notitie)
  const t = useTekst(SCHEMA_EDITOR).waarom
  if (!uitleg) return null
  return (
    <section className="club-kaart club-training-waarom" aria-label={t.kop}>
      <h2>{t.kop}</h2>
      <ol>
        {uitleg.zinnen.map((z) => (
          <li key={z}>{z}</li>
        ))}
      </ol>
      {uitleg.letOp.map((w) => (
        <p key={w} className="club-training-waarom-letop">
          <TriangleAlert aria-hidden size={15} />
          <span>{w}</span>
        </p>
      ))}
      <p className="club-hint">{t.voet}</p>
    </section>
  )
}
