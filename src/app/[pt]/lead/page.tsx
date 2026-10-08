import { ptGegevens, ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
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
  const s = await ptSessie(pt)
  if (s?.ingelogd && s.link.rol === 'eigenaar') return <EigenaarLeads code={s.link.code} pt={param(zoek, 'pt')} toon={param(zoek, 'toon')} />
  const g = await ptGegevens(pt)
  if (!g) return null
  if (!g.leads) return <Foutmelding bericht="Je leads konden niet geladen worden. Vernieuw de pagina." />
  const open = typeof zoek.open === 'string' ? zoek.open : null
  return (
    <LeadsBeheer
      code={g.link.code}
      vandaag={g.vandaag}
      begin={g.leads}
      standaardClub={meestGebruikteClub(g.leads, g.klanten ?? [])}
      gekoppeld={(g.klanten ?? []).flatMap((k) => (k.leadId ? [k.leadId] : []))}
      startNieuw={zoek.nieuw === '1'}
      startOpen={open && g.leads.some((l) => l.id === open) ? open : null}
    />
  )
}
