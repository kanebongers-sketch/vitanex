import type { Metadata } from 'next'
import Link from 'next/link'
import { Settings2 } from 'lucide-react'
import { eisOnderdeel } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalAlleMedewerkers, haalOpenTaken, haalRecentAfgehandeld, haalRegels, maakTakenVoorVandaag } from '@/lib/club/automatisering/opslag'
import { groepeerPerRegel } from '@/lib/club/automatisering/taken'
import { naarGroepen, naarItem, type Context } from '@/lib/club/automatisering/weergave'
import { Opvolglijst } from '@/components/club/automatisering/Opvolglijst'
import { Afgehandeld } from '@/components/club/automatisering/Afgehandeld'
import '@/components/club/automatisering/automatisering.css'

export const metadata: Metadata = { title: 'Opvolgen' }

// De opvolglijst: wie het team vandaag even aanspreekt, belt of een berichtje
// stuurt. Bij het openen zet Club de taken van vandaag klaar (geen cron nodig);
// dubbele taken kunnen niet. Club verstuurt zelf niets.

export default async function OpvolgenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisOnderdeel('opvolgen')
  const vestiging = kiesUit(t.vestigingen, (await searchParams).v)
  if (!vestiging) return <GeenVestigingen />
  const nu = new Date()
  const ronde = await maakTakenVoorVandaag(t.admin, t.userId, vestiging, nu)
  const [open, recent, regels, medewerkers] = await Promise.all([
    haalOpenTaken(t.admin, t.userId, vestiging),
    haalRecentAfgehandeld(t.admin, t.userId, vestiging, nu),
    haalRegels(t.admin, t.userId),
    haalAlleMedewerkers(t.admin, t.userId),
  ])
  const vestigingNaam = naamVan(t.vestigingen, vestiging)
  const ctx: Context = { vestigingNaam, regels: regels ?? [], medewerkers: new Map((medewerkers ?? []).map((m) => [m.id, m.naam])) }
  const groepen = naarGroepen(groepeerPerRegel(open ?? []), ctx)
  const afgehandeld = (recent ?? []).map((taak) => naarItem(taak, ctx))
  const ledenkaarten = Object.fromEntries([...(open ?? []), ...(recent ?? [])].map((taak) => [taak.lidId, clubPad(`/leden/${taak.lidId}`, vestiging)]))
  const totaal = groepen.reduce((s, g) => s + g.items.length, 0)
  const allesUit = regels !== null && regels.every((r) => !r.aan)
  const magInstellen = magOnderdeel(t.onderdelen, 'beheer')

  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{vestigingNaam}</p>
          <h1>Opvolgen</h1>
          <p>Wie je vandaag even aanspreekt, belt of een berichtje stuurt. Club zet ze klaar met een voorbeeldtekst; bellen of het bericht sturen doe je zelf. Automatisch versturen per mail of app komt later.</p>
        </div>
        {magInstellen && (
          <div className="club-acties">
            <Link href="/club/beheer/automatiseringen" className="club-knop">
              <Settings2 size={16} aria-hidden /> Opvolgregels
            </Link>
          </div>
        )}
      </header>

      {ronde === null && <p className="club-melding club-melding--fout" role="status">De taken van vandaag konden niet allemaal worden klaargezet. Je ziet wat er al stond; ververs de pagina later opnieuw.</p>}
      {open === null && <p className="club-melding club-melding--fout" role="status">De opvolglijst kon niet worden geladen. Ververs de pagina of probeer het later opnieuw.</p>}
      {allesUit && <p className="club-melding" role="status">Alle regels staan uit, dus Club zet niemand klaar.{magInstellen ? ' Zet ze aan bij Opvolgregels.' : ''}</p>}

      {open !== null && (
        <nav className="club-opvolg-index" aria-label="Opvolgen per regel">
          <p className="club-opvolg-totaal">
            <strong>{totaal}</strong>
            <span>{totaal === 1 ? 'lid open' : 'leden open'}</span>
          </p>
          {groepen.length > 0 && (
            <ul>
              {groepen.map((g) => (
                <li key={g.regel}>
                  <a href={`#regel-${g.regel}`}>
                    <span>{g.titel}</span>
                    <strong>{g.items.length}</strong>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>
      )}

      {open !== null && <Opvolglijst groepen={groepen} ledenkaarten={ledenkaarten} />}

      <section className="club-opvolg-recent" aria-labelledby="opvolg-recent">
        <header className="club-sectiekop">
          <h2 id="opvolg-recent">Recent afgehandeld</h2>
          <span>Laatste 7 dagen</span>
        </header>
        {recent === null ? <p className="club-melding club-melding--fout">De afgehandelde taken konden niet worden geladen.</p> : <Afgehandeld items={afgehandeld} ledenkaarten={ledenkaarten} />}
      </section>
    </>
  )
}
