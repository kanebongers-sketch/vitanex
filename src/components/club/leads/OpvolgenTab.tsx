import type { ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { kanBewerken } from '@/lib/club/rollen/wie'
import { lidKaartPad } from '@/lib/club/leden/hub/tabs'
import { haalAlleMedewerkers, haalOpenTaken, haalRecentAfgehandeld, haalRegels, maakTakenVoorVandaag } from '@/lib/club/automatisering/opslag'
import { groepeerPerRegel } from '@/lib/club/automatisering/taken'
import { naarGroepen, naarItem, type Context } from '@/lib/club/automatisering/weergave'
import { Opvolglijst } from '@/components/club/automatisering/Opvolglijst'
import { Afgehandeld } from '@/components/club/automatisering/Afgehandeld'
import '@/components/club/automatisering/automatisering.css'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { OPVOLGEN } from '@/lib/aiyourgym/taal/woorden/club/opvolgen'

// Leden · Leads, tabblad Opvolgen (ontwerp 03-11-2026): de volledige
// opvolglijst, wie het team vandaag even aanspreekt, belt of een berichtje
// stuurt. Bij het openen zet Club de taken van vandaag klaar (geen cron nodig);
// dubbele taken kunnen niet. Club verstuurt zelf niets. De werklijst van
// vandaag staat daarnaast als sectie op Vandaag.

export async function OpvolgenTab({ t, vestiging }: { t: ClubToegang; vestiging: Vestiging }) {
  const nu = new Date()
  const ronde = await maakTakenVoorVandaag(t.admin, t.userId, vestiging, nu)
  const [open, recent, regels, medewerkers] = await Promise.all([
    haalOpenTaken(t.admin, t.userId, vestiging),
    haalRecentAfgehandeld(t.admin, t.userId, vestiging, nu),
    haalRegels(t.admin, t.userId),
    haalAlleMedewerkers(t.admin, t.userId),
  ])
  const taal = await getTaal()
  const tp = OPVOLGEN[taal].pagina
  const ctx: Context = { vestigingNaam: naamVan(t.vestigingen, vestiging), regels: regels ?? [], medewerkers: new Map((medewerkers ?? []).map((m) => [m.id, m.naam])) }
  const groepen = naarGroepen(groepeerPerRegel(open ?? []), ctx, taal)
  const afgehandeld = (recent ?? []).map((taak) => naarItem(taak, ctx, taal))
  const ledenkaarten = Object.fromEntries([...(open ?? []), ...(recent ?? [])].map((taak) => [taak.lidId, lidKaartPad(taak.lidId, vestiging, 'contact')]))
  const totaal = groepen.reduce((s, g) => s + g.items.length, 0)
  const allesUit = regels !== null && regels.every((r) => !r.aan)
  const magInstellen = magOnderdeel(t.onderdelen, 'beheer')
  const bewerken = kanBewerken(t, 'opvolgen')

  return (
    <>
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

      {open !== null && <Opvolglijst groepen={groepen} ledenkaarten={ledenkaarten} bewerken={bewerken} />}

      <section className="club-opvolg-recent" aria-labelledby="opvolg-recent">
        <header className="club-sectiekop">
          <h2 id="opvolg-recent">{tp.recent}</h2>
          <span>{tp.zevenDagen}</span>
        </header>
        {recent === null ? <p className="club-melding club-melding--fout">{tp.recentFout}</p> : <Afgehandeld items={afgehandeld} ledenkaarten={ledenkaarten} bewerken={bewerken} />}
      </section>
    </>
  )
}
