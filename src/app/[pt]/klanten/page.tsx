import { meekijker, ptGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { meestGebruikteClub } from '@/lib/lifeos/pt-dashboard/overzicht'
import { KlantenBeheer } from '@/components/lifeos/pt-dashboard/KlantenBeheer'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { EigenaarKlanten } from '@/components/lifeos/pt-eigenaar/EigenaarKlanten'
import { param } from '@/components/lifeos/pt-eigenaar/FilterRij'

// /<naam>/klanten — de PT-klanten met hun abonnement (eigenaar: van het hele team).

interface Props {
  params: Promise<{ pt: string }>
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>
}

export default async function KlantenPagina({ params, searchParams }: Props) {
  const [{ pt }, zoek] = await Promise.all([params, searchParams])
  const mee = await meekijker(pt)
  if (mee) return <EigenaarKlanten code={mee.code} pt={param(zoek, 'pt')} toon={param(zoek, 'toon')} />
  const g = await ptGegevens(pt)
  if (!g) return null
  if (!g.klanten) return <Foutmelding bericht="Je klanten konden niet geladen worden. Vernieuw de pagina." />
  const lead = typeof zoek.vanLead === 'string' ? (g.leads ?? []).find((l) => l.id === zoek.vanLead) : undefined
  const alGekoppeld = lead ? g.klanten.some((k) => k.leadId === lead.id) : false
  return (
    <KlantenBeheer
      code={g.link.code}
      vandaag={g.vandaag}
      begin={g.klanten}
      standaardClub={meestGebruikteClub(g.leads ?? [], g.klanten)}
      vanLead={lead && !alGekoppeld ? { id: lead.id, naam: lead.naam, contact: lead.contact, club: lead.club } : null}
      startNieuw={zoek.nieuw === '1'}
    />
  )
}
