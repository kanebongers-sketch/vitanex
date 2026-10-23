import { meekijker, ptGegevens, ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { haalDossierStand } from '@/lib/lifeos/pt-dashboard/dossier-opslag'
import { dossierTaken } from '@/lib/lifeos/pt-dashboard/dossier-agenda'
import { DossiersDezeWeek } from '@/components/lifeos/pt-dashboard/DossiersDezeWeek'
import { meestGebruikteClub, ptOverzicht } from '@/lib/lifeos/pt-dashboard/overzicht'
import { CLUB_LABEL } from '@/lib/lifeos/pt-dashboard/clubs'
import { FfHero } from '@/components/lifeos/pt-dashboard/FfHero'
import { doelenWeergave } from '@/lib/lifeos/pt-dashboard/doelen'
import { Overzicht } from '@/components/lifeos/pt-dashboard/Overzicht'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { BeginschermHint } from '@/components/lifeos/pt-dashboard/BeginschermHint'
import { EigenaarTeam } from '@/components/lifeos/pt-eigenaar/EigenaarTeam'
import { zietGroeiplan } from '@/lib/lifeos/leads/links'
import { haalGroeiplan } from '@/lib/lifeos/pt-dashboard/groeiplan-opslag'
import { GroeiplanKaart } from '@/components/lifeos/pt-groei/GroeiplanKaart'
import { haalBelangrijkVoorPt } from '@/lib/lifeos/pt-dashboard/belangrijk-opslag'
import { Belangrijk } from '@/components/lifeos/pt-dashboard/Belangrijk'

// /<naam> — het overzicht van de PT'er (of, voor een eigenaar, van het hele team).
// Bovenaan bij een PT'er: "Belangrijk" (de algemene punten van Kane en, zolang
// ze ontbreken, de kledingmaten).

export default async function PtOverzichtPagina({ params }: { params: Promise<{ pt: string }> }) {
  const { pt } = await params
  const mee = await meekijker(pt)
  if (mee) return <EigenaarTeam code={mee.code} />
  const g = await ptGegevens(pt)
  if (!g) return null
  if (!g.leads || !g.klanten) return <Foutmelding bericht="Je gegevens konden niet geladen worden. Vernieuw de pagina." />
  const club = meestGebruikteClub(g.leads, g.klanten)
  const s = await ptSessie(pt)
  const [stand, groeiplan, belangrijk] = s
    ? await Promise.all([
        haalDossierStand(s.admin, g.link, g.klanten.map((k) => k.id)),
        zietGroeiplan(g.link.rol) ? haalGroeiplan(s.admin, g.link.userId) : null,
        // "Belangrijk" is een extra laag: niet leesbaar → het startscherm zonder dat blok.
        haalBelangrijkVoorPt(s.admin, g.link.userId, g.link.persoonId),
      ])
    : [new Map(), null, null]
  const taken = dossierTaken(g.klanten, stand, g.vandaag)
  return (
    <>
      <FfHero boventitel={club ? `Personal Trainer · ${CLUB_LABEL[club]}` : 'Personal Trainer'} titel={`Hoi ${g.link.naam}`} />
      {belangrijk ? <Belangrijk code={g.link.code} b={belangrijk.b} maten={belangrijk.maten} /> : null}
      <BeginschermHint />
      <Overzicht
        code={g.link.code}
        vandaag={g.vandaag}
        o={ptOverzicht(g.leads, g.klanten, g.vandaag)}
        doelen={doelenWeergave(g.doelen, g.leads, g.klanten, g.vandaag)}
        leads={g.leads}
      />
      <DossiersDezeWeek code={g.link.code} taken={taken} />
      {groeiplan ? <GroeiplanKaart code={g.link.code} focus={groeiplan.plan.focus} /> : null}
    </>
  )
}
