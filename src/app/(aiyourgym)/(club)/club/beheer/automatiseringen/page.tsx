import type { Metadata } from 'next'
import Link from 'next/link'
import { ListChecks } from 'lucide-react'
import { eisOnderdeel } from '@/lib/club/toegang'
import { clubPad } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { haalAlleMedewerkers, haalRegels } from '@/lib/club/automatisering/opslag'
import { RegelsBeheer } from '@/components/club/automatisering/RegelsBeheer'
import '@/components/club/automatisering/automatisering.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { OPVOLGREGELS } from '@/lib/aiyourgym/taal/woorden/club/opvolgregels'

export async function generateMetadata(): Promise<Metadata> {
  return { title: OPVOLGREGELS[await getTaal()].pagina.titel }
}

// Opvolgregels (in de database: automatiseringen) voor ledenbehoud: welke regels de opvolglijst vullen, met
// welke drempel, wie het oppakt en welke voorbeeldtekst het team krijgt.
// De regels gelden voor alle vestigingen van de sportschool.

export default async function AutomatiseringenPagina() {
  const t = await eisOnderdeel('beheer')
  const w = OPVOLGREGELS[await getTaal()].pagina
  const [regels, medewerkers] = await Promise.all([haalRegels(t.admin, t.userId), haalAlleMedewerkers(t.admin, t.userId)])
  const v = kiesUit(t.vestigingen, null)
  const vestigingNaam = v ? naamVan(t.vestigingen, v) : t.organisatie.naam

  return (
    <>
      <InstelKruimel id="opvolgregels" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{w.titel}</h1>
          <p>{w.intro}</p>
        </div>
        {v && (
          <div className="club-acties">
            <Link href={clubPad('/opvolgen', v)} className="club-knop">
              <ListChecks size={16} aria-hidden /> {w.naarLijst}
            </Link>
          </div>
        )}
      </header>

      <aside className="club-auto-uitleg" aria-label={w.zoWerktHet}>
        <ol>
          {[w.stap1, w.stap2, w.stap3].map((s) => (
            <li key={s.kop}>
              <strong>{s.kop}</strong>
              {s.tekst}
            </li>
          ))}
        </ol>
      </aside>

      {!regels && <p className="club-melding club-melding--fout" role="status">{w.regelsFout}</p>}
      {medewerkers === null && <p className="club-melding" role="status">{w.medewerkersFout}</p>}
      {regels && <RegelsBeheer regels={regels} medewerkers={medewerkers ?? []} vestigingNaam={vestigingNaam} />}
    </>
  )
}
