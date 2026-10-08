import { notFound } from 'next/navigation'
import { alsPt, eigenaarGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { haalIntake, haalMetingen } from '@/lib/lifeos/pt-dashboard/dossier-opslag'
import { isUuid } from '@/lib/lifeos/leads/toegang'
import { Dossier } from '@/components/lifeos/pt-dashboard/dossier/Dossier'
import type { DossierTab } from '@/components/lifeos/pt-dashboard/dossier/tabs'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { TEAM_FOUT } from './teksten'

// /<eigenaar>/klanten/<id> — het dossier van een klant van wie dan ook in het
// team, precies zoals de PT'er het ziet, maar alleen lezen. Onbekend → 404.

export async function EigenaarDossier({ code, id, startTab }: { code: string; id: string; startTab: DossierTab }) {
  const g = await eigenaarGegevens(code)
  if (!g) return null
  if (!g.team) return <Foutmelding bericht={TEAM_FOUT} />
  const gevonden = isUuid(id)
    ? g.team.team.flatMap((p) => (g.team?.klanten.get(p.id) ?? []).filter((k) => k.id === id).map((klant) => ({ klant, pt: p })))[0]
    : undefined
  if (!gevonden) notFound()

  const als = alsPt(g.link, gevonden.pt.id)
  const [intake, metingen] = await Promise.all([haalIntake(g.admin, als, id), haalMetingen(g.admin, als, id)])
  if (!intake.ok || !metingen.ok) return <Foutmelding bericht="Het dossier kon niet geladen worden. Vernieuw de pagina." />

  return (
    <>
      <p className="ptd-hint">Klant van {gevonden.pt.naam} · je kijkt mee, aanpassen doet {gevonden.pt.naam}.</p>
      <Dossier
        key={id}
        code={code}
        vandaag={g.vandaag}
        klant={gevonden.klant}
        intake={intake.waarde}
        metingen={metingen.waarde}
        startTab={startTab}
        alleenLezen
      />
    </>
  )
}
