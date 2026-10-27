import Link from 'next/link'
import type { ClubToegang } from '@/lib/club/toegang'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import type { Lid } from '@/lib/club/kern/lid'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { dagSleutelNl } from '@/lib/club/kern/datum'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { haalVormen } from '@/lib/club/lidmaatschappen/lezen'
import type { Lidmaatschapsvorm } from '@/lib/club/lidmaatschappen/model'
import { vormKeuzes, vormVanLid } from '@/lib/club/leden/hub/lidmaatschap'
import { haalPauze, haalPlannenVoorVorm, type PlanRegel } from '@/lib/club/leden/hub/lezen'
import type { KaartRechten } from '@/lib/club/leden/hub/rechten'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { tekst } from '@/lib/aiyourgym/taal/woordenboek'
import { formatEuroCenten } from '@/lib/aiyourgym/taal/formaat'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { LidmaatschapBeheer } from './LidmaatschapBeheer'

// Tabblad Lidmaatschap: vorm, start, pauze en stoppen (aan te passen), wat de
// vorm toelaat, en met de lidgeldschakelaars aan het blok "Lidmaatschap en
// betalen" uit het bouwplan (3.3): de prijsplannen bij de vorm, en eerlijk dat
// een contract koppelen er nog niet in zit (fase 7). Schakelaars uit: niets.

interface LidmaatschapTabProps {
  t: ClubToegang
  lid: Lid
  vestiging: Vestiging
  rechten: KaartRechten
  statusVast: boolean
  nu: Date
}

type W = (typeof LEDENKAART)['nl']

function Regels({ vorm, w, vestigingNaam }: { vorm: Lidmaatschapsvorm | null; w: W['lidmaatschap']; vestigingNaam: (slug: string) => string }) {
  if (!vorm) return <p className="club-hint">{w.geenRegels}</p>
  const regels = [
    vorm.vestigingen ? w.regelVestigingen(vorm.vestigingen.map(vestigingNaam).join(', ')) : w.regelAlleVestigingen,
    vorm.groepslessen ? (vorm.maxLessenPerWeek ? w.regelMaxLessen(vorm.maxLessenPerWeek) : w.regelLessen) : w.regelGeenLessen,
    vorm.dalVan && vorm.dalTot ? w.regelDal(vorm.dalVan, vorm.dalTot) : null,
    vorm.dalVan && vorm.dalWeekendVrij ? w.regelDalWeekend : null,
  ].filter((r): r is string => r !== null)
  return (
    <ul className="club-lidhub-regels">
      {regels.map((r) => <li key={r}>{r}</li>)}
    </ul>
  )
}

function PlanRij({ p, w, taal }: { p: PlanRegel; w: W['betalen']; taal: Taal }) {
  return (
    <li className="club-rij">
      <span className="club-rij-hoofd">
        <span className="club-rij-titel">{p.naam}</span>
        <span className="club-rij-sub">{p.contractMaanden ? w.contractMaanden(p.contractMaanden) : w.flex}{p.actief ? '' : ` · ${w.inactief}`}</span>
      </span>
      <span className="club-getal club-lidhub-prijs">{formatEuroCenten(p.prijs.bedragCent, taal)} <span className="club-zacht">{w.interval[p.interval]}</span></span>
    </li>
  )
}

async function BetalenBlok({ t, vorm, vestiging, nu, w, taal }: { t: ClubToegang; vorm: Lidmaatschapsvorm | null; vestiging: Vestiging; nu: Date; w: W['betalen']; taal: Taal }) {
  const plannen = vorm ? await haalPlannenVoorVorm(t.admin, t.userId, vorm.id, nu) : []
  return (
    <section className="club-kaart" aria-labelledby="betalen-kop">
      <div className="club-sectiekop">
        <h2 id="betalen-kop">{w.kop}</h2>
        <Link href={clubPad('/beheer/lidmaatschappen', vestiging)}>{w.plannenBeheren}</Link>
      </div>
      <h3 className="club-leden-subkop">{w.plannen}</h3>
      {!vorm ? <p className="club-hint">{w.geenVorm}</p>
        : plannen === null ? <p className="club-melding club-melding--fout" role="alert">{w.fout}</p>
          : plannen.length === 0 ? <p className="club-hint">{w.geenPlannen}</p>
            : <ul className="club-lijst">{plannen.map((p) => <PlanRij key={p.id} p={p} w={w} taal={taal} />)}</ul>}
      <div className="club-lidhub-blok">
        <h3 className="club-leden-subkop">{w.contract}</h3>
        <p className="club-hint">{w.contractNietBeschikbaar}</p>
        <div className="club-acties">
          <button type="button" className="club-knop" disabled aria-describedby="contract-nog-niet">{w.koppelen}</button>
          <span id="contract-nog-niet" className="club-chip club-chip--geen">{w.nogNiet}</span>
        </div>
      </div>
    </section>
  )
}

export async function LidmaatschapTab({ t, lid, vestiging, rechten, statusVast, nu }: LidmaatschapTabProps) {
  const taal = await getTaal()
  const w = tekst(LEDENKAART, taal)
  const [vormen, pauze] = await Promise.all([haalVormen(t.admin, t.userId), haalPauze(t.admin, t.userId, lid.id)])
  const vorm = vormVanLid(vormen ?? [], lid.abonnement)
  const magVormen = magOnderdeel(t.onderdelen, 'lidmaatschappen')
  return (
    <div className="club-lidhub-tab club-lidhub-twee">
      <section className="club-kaart" aria-labelledby="lidmaatschap-kop">
        <div className="club-sectiekop">
          <h2 id="lidmaatschap-kop">{w.lidmaatschap.kop}</h2>
          {magVormen && <Link href={clubPad('/beheer/lidmaatschappen', vestiging)}>{w.lidmaatschap.vormenBeheren}</Link>}
        </div>
        {vormen !== null && vormen.length === 0 ? <p className="club-hint">{w.lidmaatschap.geenVormen}</p> : null}
        <LidmaatschapBeheer
          lidId={lid.id}
          stand={{ status: lid.status, abonnement: lid.abonnement, lidSinds: lid.lidSinds, einddatum: lid.einddatum, pauze: pauze ?? { van: null, tot: null, bewaarbaar: true } }}
          vormen={vormKeuzes(vormen ?? [], lid.abonnement)}
          vandaag={dagSleutelNl(nu)}
          statusVast={statusVast}
        />
      </section>
      <div className="club-leden-kolom">
        <section className="club-kaart" aria-labelledby="regels-kop">
          <h2 id="regels-kop">{w.lidmaatschap.regels}</h2>
          <Regels vorm={vorm} w={w.lidmaatschap} vestigingNaam={(slug) => naamVan(t.vestigingen, slug)} />
        </section>
        {rechten.betalen && <BetalenBlok t={t} vorm={vorm} vestiging={vestiging} nu={nu} w={w.betalen} taal={taal} />}
      </div>
    </div>
  )
}
