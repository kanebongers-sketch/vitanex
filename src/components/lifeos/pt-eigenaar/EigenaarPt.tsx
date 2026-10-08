import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { alsPt, eigenaarGegevens } from '@/lib/lifeos/pt-dashboard/sessie'
import { ptOverzicht } from '@/lib/lifeos/pt-dashboard/overzicht'
import { euro, isLopend } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { doelenWeergave } from '@/lib/lifeos/pt-dashboard/doelen'
import { bronAnalyse, funnel, weekReeks } from '@/lib/lifeos/pt-dashboard/analyse'
import { huidigeWeek } from '@/lib/lifeos/pt-dashboard/checkin'
import { haalCheckin } from '@/lib/lifeos/pt-dashboard/checkin-opslag'
import { isUuid } from '@/lib/lifeos/leads/toegang'
import { Tegel } from '@/components/lifeos/pt-dashboard/Tegel'
import { DoelLijst } from '@/components/lifeos/pt-dashboard/DoelVoortgang'
import { LeadKaart } from '@/components/lifeos/pt-dashboard/LeadKaart'
import { KlantKaart } from '@/components/lifeos/pt-dashboard/KlantKaart'
import { WeekTrend } from '@/components/lifeos/pt-dashboard/WeekTrend'
import { Funnel } from '@/components/lifeos/pt-dashboard/Funnel'
import { BronTabel } from '@/components/lifeos/pt-dashboard/BronTabel'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { CheckinKaart } from './CheckinKaart'
import { TEAM_FOUT } from './teksten'
import { DoelenBewerken } from '@/components/lifeos/pt-beheer/DoelenBewerken'

// /<eigenaar>/team/<id> — alles van één PT'er, zoals die het in zijn eigen app
// ziet: cijfers, doelen, opvolging, klanten, trend en de check-in van deze week.
// Alleen lezen. Volledige lijsten via Leads/Klanten met ?pt=<id>.

const MAX_LIJST = 8

export async function EigenaarPt({ code, id }: { code: string; id: string }) {
  const g = await eigenaarGegevens(code)
  if (!g) return null
  if (!g.team) return <Foutmelding bericht={TEAM_FOUT} />
  const pt = isUuid(id) ? g.team.team.find((p) => p.id === id) : undefined
  if (!pt) notFound()

  const leads = g.team.leads.get(pt.id) ?? []
  const klanten = g.team.klanten.get(pt.id) ?? []
  const o = ptOverzicht(leads, klanten, g.vandaag)
  const doelen = doelenWeergave(g.doelen.get(pt.id) ?? null, leads, klanten, g.vandaag)
  const checkin = await haalCheckin(g.admin, alsPt(g.link, pt.id), huidigeWeek(new Date()))
  const opvolgen = [...o.teLaat, ...o.vandaag]
  const lopend = klanten.filter((k) => isLopend(k, g.vandaag))

  return (
    <>
      <div>
        <Link href={`/${code}`} className="ptd-link ffdos-terug"><ChevronLeft size={16} aria-hidden /> Hele team</Link>
        <h1 className="ptd-titel">{pt.naam}</h1>
      </div>
      <div className="ptd-tegels">
        <Tegel getal={String(o.leads.dezeWeek)} label="Leads deze week" uitleg={`${o.leads.dezeMaand} deze maand · ${o.leads.totaal} totaal`} />
        <Tegel getal={String(o.leads.open)} label="Open leads" uitleg={`${o.teLaat.length} te laat · ${o.zonderPlan.length} zonder plan`} />
        <Tegel getal={String(o.leads.klant)} label="Klant geworden" uitleg={o.leads.conversie === null ? 'nog geen leads' : `${o.leads.conversie}% van alle leads`} accent />
        <Tegel getal={euro(o.klanten.maandwaarde)} label="Abonnementen p/m" uitleg={`${o.klanten.lopend} lopend · ${o.klanten.sessiesPerWeek} sessies p/w`} />
      </div>

      {g.link.rol === 'beheerder' ? (
        <DoelenBewerken persoonId={pt.id} naam={pt.naam} doelen={g.doelen.get(pt.id) ?? null} leads={leads} klanten={klanten} vandaag={g.vandaag} />
      ) : doelen ? (
        <section className="ptd-sectie" aria-labelledby="eig-doelen-kop">
          <div className="ptd-sectiekop"><h2 id="eig-doelen-kop">Doelen</h2><span>gezet door Kane</span></div>
          {doelen.notitie ? <p className="ptd-doel-notitie">{doelen.notitie}</p> : null}
          {doelen.items.length > 0 ? <DoelLijst items={doelen.items} /> : null}
        </section>
      ) : null}

      <section className="ptd-sectie" aria-labelledby="eig-opvolgen-kop">
        <div className="ptd-sectiekop"><h2 id="eig-opvolgen-kop">Opvolgen</h2><span>te laat en vandaag</span></div>
        {opvolgen.length === 0 ? (
          <p className="ptd-leeg">Niets te laat of voor vandaag.</p>
        ) : (
          <ul className="ptd-lijst">{opvolgen.slice(0, MAX_LIJST).map((l) => <LeadKaart key={l.id} lead={l} vandaag={g.vandaag} />)}</ul>
        )}
        <Link className="ptd-knop ptd-knop--klein" href={`/${code}/lead?pt=${pt.id}&toon=alle`}>Alle leads van {pt.naam} ({leads.length})</Link>
      </section>

      <section className="ptd-sectie" aria-labelledby="eig-klanten-kop">
        <div className="ptd-sectiekop"><h2 id="eig-klanten-kop">Lopende klanten</h2><span>{lopend.length}</span></div>
        {lopend.length === 0 ? (
          <p className="ptd-leeg">{pt.naam} heeft geen lopende PT-klanten ingevuld.</p>
        ) : (
          <ul className="ptd-lijst">
            {lopend.slice(0, MAX_LIJST).map((k) => <KlantKaart key={k.id} klant={k} vandaag={g.vandaag} toonPrijs dossierHref={`/${code}/klanten/${k.id}`} />)}
          </ul>
        )}
        <Link className="ptd-knop ptd-knop--klein" href={`/${code}/klanten?pt=${pt.id}&toon=alle`}>Alle klanten van {pt.naam} ({klanten.length})</Link>
      </section>

      <section className="ptd-sectie" aria-labelledby="eig-checkin-kop">
        <div className="ptd-sectiekop"><h2 id="eig-checkin-kop">Check-in deze week</h2><span>voorbereiding coachgesprek</span></div>
        {!checkin.ok ? (
          <Foutmelding bericht="De check-in kon niet geladen worden. Vernieuw de pagina." />
        ) : checkin.waarde ? (
          <div className="ptd-rij"><CheckinKaart checkin={checkin.waarde} /></div>
        ) : (
          <p className="ptd-leeg">{pt.naam} heeft de check-in van deze week nog niet ingevuld.</p>
        )}
      </section>

      {leads.length > 0 ? (
        <section className="ptd-sectie" aria-labelledby="eig-trend-kop">
          <div className="ptd-sectiekop"><h2 id="eig-trend-kop">Trend van {pt.naam}</h2><span>uit de eigen leads</span></div>
          <div className="ptd-an-raster">
            <WeekTrend weken={weekReeks(leads, g.vandaag)} />
            <Funnel stappen={funnel(leads)} />
            <div className="ptd-an-blok--breed"><BronTabel bronnen={bronAnalyse(leads)} /></div>
          </div>
        </section>
      ) : null}
    </>
  )
}
