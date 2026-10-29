'use client'

import { Check } from 'lucide-react'
import { frequentieTekst, kortWie, type Taak, type Takenlijst } from '@/lib/club/taken/typen'
import { telGedaan, weekTeller, type WeekTeller } from '@/lib/club/taken/voortgang'
import { dagKort, dagLang, dagNummer, perGroep } from '@/lib/club/taken/weergave'
import { useAfvinken } from './AfvinkContext'
import { klok } from './vraag'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'

// Een lijst als raster: taken onder elkaar, de zeven dagen naast elkaar, zoals
// het tabblad in de Excel. Een tik op een vakje vinkt af (wie en hoe laat);
// nogmaals tikken haalt het weg. Toekomstige dagen zijn nog dicht.

interface RasterProps {
  lijst: Takenlijst
  taken: Taak[]
  dagen: string[]
}

export function Teller({ teller }: { teller: WeekTeller }) {
  const t = useTekst(TAKEN).raster
  if (teller.minimum === null) return null
  const soort = teller.status === 'gehaald' ? 'ok' : teller.status === 'achter' ? 'let-op' : 'uit'
  return (
    <span className={`club-chip club-chip--${soort} club-taken-teller`} title={t.tellerTitel(teller.gedaan, teller.minimum, t.status[teller.status])}>
      <span className="club-getal">
        {t.teller(teller.gedaan, teller.minimum)}
      </span>
      <span className="club-sr">, {t.status[teller.status]}</span>
    </span>
  )
}

function Vakje({ taak, datum }: { taak: Taak; datum: string }) {
  const { vak, wissel, isBezig, vandaag } = useAfvinken()
  const vinkje = vak(taak.id, datum)
  const taal = useTaal()
  const t = useTekst(TAKEN).raster
  const toekomst = datum > vandaag
  const bezig = isBezig(taak.id, datum)
  const status = vinkje ? t.afgevinkt(vinkje.wie, klok(vinkje.afgevinktOp)) : toekomst ? t.nietAanDeBeurt : t.open
  return (
    <td className="club-taken-cel" data-vandaag={datum === vandaag ? '' : undefined}>
      <button
        type="button"
        className="club-taken-vak"
        aria-pressed={vinkje !== null}
        aria-label={t.vakLabel(taak.naam, dagLang(datum, taal), status)}
        title={vinkje ? t.wieOm(vinkje.wie, klok(vinkje.afgevinktOp)) : undefined}
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
  const taal = useTaal()
  const t = useTekst(TAKEN).raster
  return (
    <tr className="club-taken-rij" data-status={teller.status}>
      <th scope="row" className="club-taken-naam">
        <span>{taak.naam}</span>
        {taak.frequentie !== 'dagelijks' && <span className="club-taken-freq">{frequentieTekst(taak, taal)}</span>}
      </th>
      {dagen.map((d) => (
        <Vakje key={d} taak={taak} datum={d} />
      ))}
      <td className="club-taken-week">{teller.minimum !== null ? <Teller teller={teller} /> : <span className="club-zacht club-getal">{t.keer(gedaan)}</span>}</td>
    </tr>
  )
}

export function TakenRaster({ lijst, taken, dagen }: RasterProps) {
  const { vandaag } = useAfvinken()
  const taal = useTaal()
  const t = useTekst(TAKEN).raster
  const kopId = `club-taken-lijst-${lijst.id}`
  return (
    <section className="club-taken-lijst" aria-labelledby={kopId}>
      <h2 id={kopId} className="club-taken-lijstnaam">
        {lijst.naam}
      </h2>
      <div className="club-taken-tabelwrap">
        <table className="club-taken-raster" data-een-dag={dagen.length === 1 || undefined}>
          <thead>
            <tr>
              <th scope="col" className="club-taken-naam">
                {t.taak}
              </th>
              {dagen.map((d) => (
                <th key={d} scope="col" className="club-taken-dagkop" data-vandaag={d === vandaag ? '' : undefined} aria-current={d === vandaag ? 'date' : undefined}>
                  <span>{dagKort(d, taal)}</span> <b>{dagNummer(d)}</b>
                </th>
              ))}
              <th scope="col" className="club-taken-week">
                {t.week}
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
