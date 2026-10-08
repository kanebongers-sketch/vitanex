import { ptGegevens, ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { meestGebruikteClub, ptOverzicht } from '@/lib/lifeos/pt-dashboard/overzicht'
import { CLUB_LABEL } from '@/lib/lifeos/pt-dashboard/clubs'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { doelenWeergave } from '@/lib/lifeos/pt-dashboard/doelen'
import { Overzicht } from '@/components/lifeos/pt-dashboard/Overzicht'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { BeginschermHint } from '@/components/lifeos/pt-dashboard/BeginschermHint'
import { EigenaarTeam } from '@/components/lifeos/pt-eigenaar/EigenaarTeam'

// /<naam> — het overzicht van de PT'er (of, voor een eigenaar, van het hele team).

export default async function PtOverzichtPagina({ params }: { params: Promise<{ pt: string }> }) {
  const { pt } = await params
  const s = await ptSessie(pt)
  if (s?.ingelogd && s.link.rol === 'eigenaar') return <EigenaarTeam code={s.link.code} />
  const g = await ptGegevens(pt)
  if (!g) return null
  if (!g.leads || !g.klanten) return <Foutmelding bericht="Je gegevens konden niet geladen worden. Vernieuw de pagina." />
  const club = meestGebruikteClub(g.leads, g.klanten)
  return (
    <>
      <FfHero boventitel={club ? `Personal Trainer · ${CLUB_LABEL[club]}` : 'Personal Trainer'} titel={`Hoi ${g.link.naam}`} />
      <BeginschermHint />
      <Overzicht
        code={g.link.code}
        vandaag={g.vandaag}
        o={ptOverzicht(g.leads, g.klanten, g.vandaag)}
        doelen={doelenWeergave(g.doelen, g.leads, g.klanten, g.vandaag)}
        leads={g.leads}
      />
    </>
  )
}
