import { TriangleAlert } from 'lucide-react'
import { WAAROM_KOP, waaromUitNotitie } from '@/lib/club/training/voorstel-uitleg'
import './vervang.css'

/**
 * "Waarom dit schema": de uitleg van het schemavoorstel, uit de notitie van
 * het schema. Past de trainer de notitie aan (zonder de kop), dan verdwijnt hij.
 */
export function WaaromSchema({ notitie }: { notitie: string }) {
  const uitleg = waaromUitNotitie(notitie)
  if (!uitleg) return null
  return (
    <section className="club-kaart club-training-waarom" aria-label={WAAROM_KOP}>
      <h2>{WAAROM_KOP}</h2>
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
      <p className="club-hint">Vaste regels voor een startschema. Pas aan wat bij het lid past.</p>
    </section>
  )
}
