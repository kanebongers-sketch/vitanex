'use client'

import { Check } from 'lucide-react'
import { frequentieTekst, kortWie, type Taak, type Takenlijst } from '@/lib/club/taken/typen'
import { telGedaan, weekTeller, type WeekTeller } from '@/lib/club/taken/voortgang'
import { dagKort, dagLang, dagNummer, perGroep } from '@/lib/club/taken/weergave'
import { useAfvinken } from './AfvinkContext'
import { klok } from './vraag'

// Een lijst als raster: taken onder elkaar, de zeven dagen naast elkaar, zoals
// het tabblad in de Excel. Een tik op een vakje vinkt af (wie en hoe laat);
// nogmaals tikken haalt het weg. Toekomstige dagen zijn nog dicht.

interface RasterProps {
  lijst: Takenlijst
  taken: Taak[]
  dagen: string[]
}

const TELLER_TEKST: Record<WeekTeller['status'], string> = {
  gehaald: 'gehaald',
  bezig: 'nog te doen',
  achter: 'loopt achter',
  vrij: '',
}

export function Teller({ teller }: { teller: WeekTeller }) {
  if (teller.minimum === null) return null
  const soort = teller.status === 'gehaald' ? 'ok' : teller.status === 'achter' ? 'let-op' : 'uit'
  return (
    <span className={`club-chip club-chip--${soort} club-taken-teller`} title={`${teller.gedaan} van ${teller.minimum} deze week, ${TELLER_TEKST[teller.status]}`}>
      <span className="club-getal">
        {teller.gedaan} van {teller.minimum}
      </span>
      <span className="club-sr">, {TELLER_TEKST[teller.status]}</span>
    </span>
  )
}

function Vakje({ taak, datum }: { taak: Taak; datum: string }) {
  const { vak, wissel, isBezig, vandaag } = useAfvinken()
  const vinkje = vak(taak.id, datum)
  const toekomst = datum > vandaag
  const bezig = isBezig(taak.id, datum)
  const status = vinkje ? `afgevinkt door ${vinkje.wie} om ${klok(vinkje.afgevinktOp)}` : toekomst ? 'nog niet aan de beurt' : 'open'
  return (
    <td className="club-taken-cel" data-vandaag={datum === vandaag ? '' : undefined}>
      <button
        type="button"
        className="club-taken-vak"
        aria-pressed={vinkje !== null}
        aria-label={`${taak.naam}, ${dagLang(datum)}: ${status}`}
        title={vinkje ? `${vinkje.wie} om ${klok(vinkje.afgevinktOp)}` : undefined}
        disabled={toekomst}
        aria-busy={bezig || undefined}
        onClick={() => wissel(taak.id, datum, taak.naam)}
      >
        {vinkje ? (
          <>
            <span className="club-taken-vak-wie">{kortWie(vinkje.wie)}</span>
            <span className="club-taken-vak-tijd">{klok(vinkje.afgevinktOp)}</span>
          </>
        ) : (
          !toekomst && <Check className="club-taken-vak-hint" size={16} aria-hidden />
        )}
      </button>
    </td>
  )
}

function Rij({ taak, dagen }: { taak: Taak; dagen: string[] }) {
  const { afvinkingen, vandaag } = useAfvinken()
  const teller = weekTeller(taak, afvinkingen, dagen, vandaag)
  const gedaan = telGedaan(taak.id, afvinkingen, dagen)
  return (
    <tr className="club-taken-rij" data-status={teller.status}>
      <th scope="row" className="club-taken-naam">
        <span>{taak.naam}</span>
        {taak.frequentie !== 'dagelijks' && <span className="club-taken-freq">{frequentieTekst(taak)}</span>}
      </th>
      {dagen.map((d) => (
        <Vakje key={d} taak={taak} datum={d} />
      ))}
      <td className="club-taken-week">{teller.minimum !== null ? <Teller teller={teller} /> : <span className="club-zacht club-getal">{gedaan}x</span>}</td>
    </tr>
  )
}

export function TakenRaster({ lijst, taken, dagen }: RasterProps) {
  const { vandaag } = useAfvinken()
  const kopId = `club-taken-lijst-${lijst.id}`
  return (
    <section className="club-taken-lijst" aria-labelledby={kopId}>
      <h2 id={kopId} className="club-taken-lijstnaam">
        {lijst.naam}
      </h2>
      <div className="club-taken-tabelwrap">
        <table className="club-taken-raster">
          <thead>
            <tr>
              <th scope="col" className="club-taken-naam">
                Taak
              </th>
              {dagen.map((d) => (
                <th key={d} scope="col" className="club-taken-dagkop" data-vandaag={d === vandaag ? '' : undefined} aria-current={d === vandaag ? 'date' : undefined}>
                  <span>{dagKort(d)}</span> <b>{dagNummer(d)}</b>
                </th>
              ))}
              <th scope="col" className="club-taken-week">
                Week
              </th>
            </tr>
          </thead>
          {perGroep(taken).map((g, i) => (
            <tbody key={`${g.groep ?? 'zonder'}-${i}`}>
              {g.groep && (
                <tr className="club-taken-groep">
                  <th scope="colgroup" colSpan={dagen.length + 2}>
                    {g.groep}
                  </th>
                </tr>
              )}
              {g.taken.map((t) => (
                <Rij key={t.id} taak={t} dagen={dagen} />
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  )
}
