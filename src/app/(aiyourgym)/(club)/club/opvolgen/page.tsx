import type { Metadata } from 'next'
import Link from 'next/link'
import { Settings2 } from 'lucide-react'
import { eisOnderdeel } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { lidKaartPad } from '@/lib/club/leden/hub/tabs'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalAlleMedewerkers, haalOpenTaken, haalRecentAfgehandeld, haalRegels, maakTakenVoorVandaag } from '@/lib/club/automatisering/opslag'
import { groepeerPerRegel } from '@/lib/club/automatisering/taken'
import { naarGroepen, naarItem, type Context } from '@/lib/club/automatisering/weergave'
import { Opvolglijst } from '@/components/club/automatisering/Opvolglijst'
import { Afgehandeld } from '@/components/club/automatisering/Afgehandeld'
import '@/components/club/automatisering/automatisering.css'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { OPVOLGEN } from '@/lib/aiyourgym/taal/woorden/club/opvolgen'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(OPVOLGEN)).pagina.titel }
}

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
  const taal = await getTaal()
  const tp = OPVOLGEN[taal].pagina
  const ctx: Context = { vestigingNaam, regels: regels ?? [], medewerkers: new Map((medewerkers ?? []).map((m) => [m.id, m.naam])) }
  const groepen = naarGroepen(groepeerPerRegel(open ?? []), ctx, taal)
  const afgehandeld = (recent ?? []).map((taak) => naarItem(taak, ctx, taal))
  const ledenkaarten = Object.fromEntries([...(open ?? []), ...(recent ?? [])].map((taak) => [taak.lidId, lidKaartPad(taak.lidId, vestiging, 'contact')]))
  const totaal = groepen.reduce((s, g) => s + g.items.length, 0)
  const allesUit = regels !== null && regels.every((r) => !r.aan)
  const magInstellen = magOnderdeel(t.onderdelen, 'beheer')

  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{vestigingNaam}</p>
          <h1>{tp.titel}</h1>
          <p>{tp.uitleg}</p>
        </div>
        {magInstellen && (
          <div className="club-acties">
            <Link href="/club/beheer/automatiseringen" className="club-knop">
              <Settings2 size={16} aria-hidden /> {tp.regels}
            </Link>
          </div>
        )}
      </header>

      {ronde === null && <p className="club-melding club-melding--fout" role="status">{tp.rondeFout}</p>}
      {open === null && <p className="club-melding club-melding--fout" role="status">{tp.fout}</p>}
      {allesUit && <p className="club-melding" role="status">{tp.allesUit}{magInstellen ? tp.zetAan : ''}</p>}

      {open !== null && (
        <nav className="club-opvolg-index" aria-label={tp.perRegel}>
          <p className="club-opvolg-totaal">
            <strong>{totaal}</strong>
            <span>{tp.open(totaal)}</span>
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
          <h2 id="opvolg-recent">{tp.recent}</h2>
          <span>{tp.zevenDagen}</span>
        </header>
        {recent === null ? <p className="club-melding club-melding--fout">{tp.recentFout}</p> : <Afgehandeld items={afgehandeld} ledenkaarten={ledenkaarten} />}
      </section>
    </>
  )
}
