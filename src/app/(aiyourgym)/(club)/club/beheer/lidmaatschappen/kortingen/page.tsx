import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eisOnderdeel } from '@/lib/club/toegang'
import { magBeheerdersBeheren } from '@/lib/club/beheerders/rechten'
import { betalenActief, lidgeldActief } from '@/lib/club/betalen/config'
import { haalLidgeldStand, lidgeldOpen, LIDGELD_ONDERDEEL } from '@/lib/club/betalen/plannen/toegang'
import { haalPlannen } from '@/lib/club/betalen/plannen/opslag'
import { haalGezinnen, haalKortingen } from '@/lib/club/betalen/plannen/korting-opslag'
import { haalVormen } from '@/lib/club/lidmaatschappen/lezen'
import { KortingenBeheer } from '@/components/club/betalen/plannen/KortingenBeheer'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import '@/components/club/lidmaatschappen/lidmaatschappen.css'
import '@/components/club/betalen/plannen/plannen.css'

export const metadata: Metadata = { title: 'Kortingen en acties' }
export const dynamic = 'force-dynamic'

// Kortingen en acties voor lidgeld, plus de gezinskorting. Bestaat alleen met
// CLUB_LIDGELD_ACTIEF aan (anders een 404) en het recht Lidmaatschappen. Staat
// lidgeld bij de sportschool zelf nog uit, dan zegt de pagina dat eerlijk en
// toont ze niets van de kortingen (Kane ziet ze wel, om te testen).

export default async function KortingenPagina() {
  if (!lidgeldActief()) notFound()
  const t = await eisOnderdeel(LIDGELD_ONDERDEEL)
  const open = await lidgeldOpen(t)
  const kop = (
    <header className="club-paginakop">
      <div>
        <p className="club-boventitel">{t.organisatie.naam}</p>
        <h1>Kortingen en acties</h1>
        <p>Kortingscodes, acties met een begin- en einddatum en de gezinskorting. Ze gelden voor de plannen met prijs en contract bij je lidmaatschappen.</p>
      </div>
    </header>
  )

  if (!open) {
    return (
      <div className="club-lidm">
        <InstelKruimel id="kortingen" />
        {kop}
        <p className="club-lidgeld-melding" role="status">
          <strong>Lidgeld staat uit</strong>
          <span>
            Zet eerst lidgeld aan voor je sportschool.{' '}
            {betalenActief() && magBeheerdersBeheren(t) ? <Link href="/club/beheer/betalen">Naar Betalen in de ledenapp</Link> : 'Vraag de eigenaar om het aan te zetten.'}
          </span>
        </p>
      </div>
    )
  }

  const [kortingen, gezinnen, plannen, vormen, stand] = await Promise.all([
    haalKortingen(t.admin, t.userId),
    haalGezinnen(t.admin, t.userId),
    haalPlannen(t.admin, t.userId),
    haalVormen(t.admin, t.userId),
    haalLidgeldStand(t.admin, t.userId),
  ])
  const vormNaam = new Map((vormen ?? []).map((v) => [v.id, v.naam]))
  const keuzes = (plannen ?? []).map((p) => ({ id: p.id, label: `${vormNaam.get(p.vormId) ?? 'Vorm'} · ${p.naam}` }))

  return (
    <div className="club-lidm">
      <InstelKruimel id="kortingen" />
      {kop}
      {kortingen && gezinnen && plannen && stand ? (
        <KortingenBeheer
          kortingen={kortingen}
          gezinnen={gezinnen}
          plannen={keuzes}
          stand={{ schaduw: stand.schaduw, incassoAan: stand.incassoAan, alleenKane: !stand.lidgeldAan }}
        />
      ) : (
        <p className="club-melding club-melding--fout" role="status">De kortingen konden niet worden gelezen. Probeer het later opnieuw.</p>
      )}
    </div>
  )
}
