import { EyeOff, Trophy } from 'lucide-react'
import type { GroepScherm } from '@/lib/club/community/lezen'

// De ranglijst van een groep (presentational). Alleen leden die er zelf voor
// kozen, met de privacynaam. De eigen rij is gemarkeerd; staat het lid er
// niet op, dan ziet alleen het lid de eigen score onder de lijst.

type Ranglijst = NonNullable<GroepScherm['ranglijst']>

function scoreTekst(bron: Ranglijst['bron'], n: number): string {
  if (bron === 'bezoeken') return n === 1 ? '1 dag' : `${n} dagen`
  return String(n)
}

export function GroepRanglijst({ ranglijst }: { ranglijst: Ranglijst }) {
  const { rijen, eigenLos, verborgen, bron, titel } = ranglijst
  return (
    <section className="club-cm-rang" aria-labelledby="cm-rang-kop">
      <div className="club-cm-rang-kop">
        <span className="club-cm-rang-icoon" aria-hidden>
          <Trophy size={18} />
        </span>
        <div>
          <h3 id="cm-rang-kop">Ranglijst</h3>
          <p>{titel}</p>
        </div>
      </div>
      {rijen.length > 0 ? (
        <ol className="club-cm-rang-lijst">
          {rijen.map((r, i) => (
            <li key={i} className={r.ik ? 'is-ik' : undefined} aria-current={r.ik ? 'true' : undefined}>
              <span className="club-cm-rang-plek">{r.positie}</span>
              <span className="club-cm-rang-naam">
                {r.naam}
                {r.ik && <span className="club-cm-rang-jij"> (jij)</span>}
              </span>
              <span className="club-cm-rang-score">{scoreTekst(bron, r.score)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="club-cm-rang-leeg">Nog niemand in deze groep staat op de ranglijst.</p>
      )}
      {eigenLos && (
        <p className="club-cm-rang-los">
          <EyeOff size={15} aria-hidden /> Jouw score: <strong>{scoreTekst(bron, eigenLos.score)}</strong>. Alleen jij ziet dit.
        </p>
      )}
      {verborgen > 0 && <p className="club-cm-rang-noot">{verborgen === 1 ? '1 groepslid staat' : `${verborgen} groepsleden staan`} niet op de ranglijst.</p>}
    </section>
  )
}
