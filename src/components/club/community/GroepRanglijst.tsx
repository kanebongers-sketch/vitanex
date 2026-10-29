import { EyeOff, Trophy } from 'lucide-react'
import type { GroepScherm } from '@/lib/club/community/lezen'
import { LOCALE, type Taal } from '@/lib/aiyourgym/taal/taal'
import type { CommunityTekst } from '@/lib/aiyourgym/taal/woorden/club/community'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { COMMUNITY } from '@/lib/aiyourgym/taal/woorden/club/community'

// De ranglijst van een groep (presentational). Alleen leden die er zelf voor
// kozen, met de privacynaam. De eigen rij is gemarkeerd; staat het lid er
// niet op, dan ziet alleen het lid de eigen score onder de lijst.

type Ranglijst = NonNullable<GroepScherm['ranglijst']>

function scoreTekst(bron: Ranglijst['bron'], n: number, t: CommunityTekst['ranglijst']): string {
  if (bron === 'bezoeken') return t.dagen(n)
  return String(n)
}

function titelIn(r: Ranglijst, t: CommunityTekst['ranglijst'], taal: Taal): string {
  if (r.bron !== 'bezoeken' || !r.maand) return r.titel
  const naam = new Intl.DateTimeFormat(LOCALE[taal], { month: 'long', timeZone: 'UTC' }).format(new Date(`${r.maand}-15T12:00:00Z`))
  return t.bezoekdagen(naam)
}

export async function GroepRanglijst({ ranglijst }: { ranglijst: Ranglijst }) {
  const { rijen, eigenLos, verborgen, bron } = ranglijst
  const taal = await getTaal()
  const t = COMMUNITY[taal].ranglijst
  const titel = titelIn(ranglijst, t, taal)
  return (
    <section className="club-cm-rang" aria-labelledby="cm-rang-kop">
      <div className="club-cm-rang-kop">
        <span className="club-cm-rang-icoon" aria-hidden>
          <Trophy size={18} />
        </span>
        <div>
          <h3 id="cm-rang-kop">{t.titel}</h3>
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
                {r.ik && <span className="club-cm-rang-jij">{t.jij}</span>}
              </span>
              <span className="club-cm-rang-score">{scoreTekst(bron, r.score, t)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="club-cm-rang-leeg">{t.leeg}</p>
      )}
      {eigenLos && (
        <p className="club-cm-rang-los">
          <EyeOff size={15} aria-hidden /> {t.jouwScore} <strong>{scoreTekst(bron, eigenLos.score, t)}</strong>{t.alleenJij}
        </p>
      )}
      {verborgen > 0 && <p className="club-cm-rang-noot">{t.verborgen(verborgen)}</p>}
    </section>
  )
}
