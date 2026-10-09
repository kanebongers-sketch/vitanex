import { meekijker, ptGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { meestGebruikteClub } from '@/lib/lifeos/pt-dashboard/overzicht'
import { LeadsBeheer } from '@/components/lifeos/pt-dashboard/LeadsBeheer'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { EigenaarLeads } from '@/components/lifeos/pt-eigenaar/EigenaarLeads'
import { param } from '@/components/lifeos/pt-eigenaar/FilterRij'

// /<naam>/lead — de lead tracker van de PT'er (eigenaar: alle leads van het team).

interface Props {
  params: Promise<{ pt: string }>
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>
}

export default async function LeadsPagina({ params, searchParams }: Props) {
  const [{ pt }, zoek] = await Promise.all([params, searchParams])
  const mee = await meekijker(pt)
  if (mee) return <><h1 className="sr-only">Leads van het team</h1><EigenaarLeads code={mee.code} pt={param(zoek, 'pt')} toon={param(zoek, 'toon')} /></>
  const g = await ptGegevens(pt)
  if (!g) return null
  // Zonder klanten weet de pagina niet welke leads al klant zijn: dan zou elke
  // klant-geworden lead weer 'abonnement vastleggen' tonen (kans op dubbele klanten).
  if (!g.leads || !g.klanten) return <Foutmelding bericht="Je leads konden niet geladen worden. Vernieuw de pagina." />
  const open = typeof zoek.open === 'string' ? zoek.open : null
  return (
    <>
    <h1 className="sr-only">Mijn leads</h1>
    <LeadsBeheer
      code={g.link.code}
      vandaag={g.vandaag}
      begin={g.leads}
      standaardClub={meestGebruikteClub(g.leads, g.klanten)}
      gekoppeld={g.klanten.flatMap((k) => (k.leadId ? [k.leadId] : []))}
      startNieuw={zoek.nieuw === '1'}
      startOpen={open && g.leads.some((l) => l.id === open) ? open : null}
    />
    </>
  )
}
