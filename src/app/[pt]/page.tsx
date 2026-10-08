import { ptGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { ptOverzicht } from '@/lib/lifeos/pt-dashboard/overzicht'
import { doelenWeergave } from '@/lib/lifeos/pt-dashboard/doelen'
import { Overzicht } from '@/components/lifeos/pt-dashboard/Overzicht'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'

// /<naam> — het overzicht van de PT'er.

export default async function PtOverzichtPagina({ params }: { params: Promise<{ pt: string }> }) {
  const { pt } = await params
  const g = await ptGegevens(pt)
  if (!g) return null
  if (!g.leads || !g.klanten) return <Foutmelding bericht="Je gegevens konden niet geladen worden. Vernieuw de pagina." />
  return (
    <Overzicht
      code={g.link.code}
      vandaag={g.vandaag}
      o={ptOverzicht(g.leads, g.klanten, g.vandaag)}
      doelen={doelenWeergave(g.doelen, g.leads, g.klanten, g.vandaag)}
    />
  )
}
