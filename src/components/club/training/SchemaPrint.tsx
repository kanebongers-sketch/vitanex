import type { EditorRegel, EditorStaat } from '@/lib/club/training/editor'
import type { Oefening } from '@/lib/club/training/rijen'
import { dagLetter, DOEL_LABEL, type Doel } from '@/lib/club/training/typen'
import { BEELD_BRON } from '@/lib/club/training/beeld'
import { toonHerhalingen, toonRust } from '@/lib/club/training/weergave'
import { OefeningBeeldPrint } from './OefeningBeeld'

interface SchemaPrintProps {
  naam: string
  lidNaam: string | null
  doel: Doel | null
  weken: string
  trainer: string | null
  notitie: string
  staat: EditorStaat
  oefeningen: Map<string, Oefening>
}

/** Het schema op papier. Alleen zichtbaar bij afdrukken (zie training.css). */
export function SchemaPrint({ naam, lidNaam, doel, weken, trainer, notitie, staat, oefeningen }: SchemaPrintProps) {
  const metBeeld = staat.regels.some((r) => oefeningen.get(r.oefeningId)?.beeld)
  return (
    <article className="club-training-print" aria-hidden>
      <header>
        <p>Fit Factory</p>
        <h1>{naam}</h1>
        <p>{[lidNaam, doel ? DOEL_LABEL[doel] : null, weken ? `${weken} weken` : null, trainer ? `Trainer: ${trainer}` : null].filter(Boolean).join(' · ')}</p>
        {notitie && <p className="club-training-print-notitie">{notitie}</p>}
      </header>
      {staat.dagTitels.map((titel, i) => {
        const dag = i + 1
        const regels = staat.regels.filter((r) => r.dag === dag)
        return (
          <section key={dag}>
            <h2>Dag {dagLetter(dag)} · {titel}</h2>
            <table>
              <thead>
                <tr>{metBeeld && <th>Uitvoering</th>}<th>Oefening</th><th>Sets</th><th>Herhalingen</th><th>Kg</th><th>Rust</th><th>Notitie</th></tr>
              </thead>
              <tbody>
                {regels.map((r) => <PrintRegel key={r.sleutel} regel={r} oefening={oefeningen.get(r.oefeningId)} metBeeld={metBeeld} />)}
              </tbody>
            </table>
          </section>
        )
      })}
      {metBeeld && <footer>{BEELD_BRON.tekst} (github.com/everkinetic/data, creativecommons.org/licenses/by-sa/4.0)</footer>}
    </article>
  )
}

function PrintRegel({ regel: r, oefening, metBeeld }: { regel: EditorRegel; oefening: Oefening | undefined; metBeeld: boolean }) {
  const naam = oefening?.naam ?? 'Onbekend'
  return (
    <tr>
      {metBeeld && (
        <td className="club-training-print-beeld">
          <OefeningBeeldPrint naam={naam} beeld={oefening?.beeld ?? null} />
        </td>
      )}
      <td><span className="club-training-print-oefnaam">{naam}</span></td>
      <td>{r.sets}</td>
      <td>{toonHerhalingen(r.herhalingen)}</td>
      <td>{r.gewichtKg}</td>
      <td>{r.rustSec ? toonRust(Number(r.rustSec)) : ''}</td>
      <td>{r.notitie}</td>
    </tr>
  )
}
