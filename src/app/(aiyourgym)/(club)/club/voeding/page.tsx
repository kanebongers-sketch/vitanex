import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { eisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { zoekLeden } from '@/lib/club/kern/lid'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalPlannenVanVestiging, haalSjablonen } from '@/lib/club/voeding/lezen'
import { PlannenLijst, SjablonenLijst } from '@/components/club/voeding/Lijsten'
import { LidZoek } from '@/components/club/voeding/LidZoek'
import { isLeiding } from '@/lib/club/rollen/wie'
import { RegelsSchakelaar } from '@/components/club/voeding/RegelsSchakelaar'
import { haalVoedingRegels } from '@/lib/club/voeding/eigen-opslag'
import { SjabloonDetail } from '@/components/club/voeding/SjabloonDetail'
import { SjabloonFormulier } from '@/components/club/voeding/SjabloonFormulier'
import '@/components/club/voeding/voeding.css'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(VOEDING)).pagina.titel }
}

// Voeding voor de coaching. Tabblad Plannen (standaard): de plannen van leden
// in deze vestiging en een zoekveld om een plan te maken. Tabblad Sjablonen:
// links de sjablonen, rechts het gekozen sjabloon (?s=<id>) of het formulier
// (?nieuw=1 of &wijzig=1).

function eerste(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

async function PlannenTab({ t, vestiging, term }: { t: ClubToegang; vestiging: string; term: string }) {
  const magRegels = isLeiding(t)
  const [regels, leden, voedingRegels] = await Promise.all([
    haalPlannenVanVestiging(t.admin, t.userId, vestiging),
    term.trim().length >= 2 ? zoekLeden(t.admin, t.userId, vestiging, term, 12) : Promise.resolve([]),
    magRegels ? haalVoedingRegels(t.admin, t.userId) : Promise.resolve(null),
  ])
  const metPlan = new Set((regels ?? []).map((r) => r.lid.id))
  const tv = await clubTekst(VOEDING)
  return (
    <div className="club-voeding-werkvlak">
      <section className="club-voeding-kolom" aria-labelledby="voeding-plannen-kop">
        <h2 id="voeding-plannen-kop" className="club-voeding-groepkop">
          {tv.pagina.plannen} <span>{regels?.length ?? 0}</span>
        </h2>
        {regels === null ? (
          <p className="club-melding club-melding--fout" role="status">{tv.pagina.plannenFout}</p>
        ) : (
          <PlannenLijst regels={regels} vestiging={vestiging} />
        )}
      </section>
      <div className="club-voeding-zij">
        <LidZoek vestiging={vestiging} term={term} leden={leden} metPlan={metPlan} />
        {voedingRegels && <RegelsSchakelaar ledenOverschrijven={voedingRegels.ledenOverschrijven} />}
        <p className="club-voeding-disclaimer">{tv.disclaimer}</p>
      </div>
    </div>
  )
}

async function SjablonenTab({ t, vestiging, zoek }: { t: ClubToegang; vestiging: string; zoek: Record<string, string | string[] | undefined> }) {
  const sjablonen = await haalSjablonen(t.admin, t.userId)
  const terug = clubPad('/voeding', vestiging, { tab: 'sjablonen' })
  const nieuw = eerste(zoek.nieuw) === '1'
  const tp = (await clubTekst(VOEDING)).pagina
  const gekozen = nieuw ? undefined : ((sjablonen ?? []).find((s) => s.id === eerste(zoek.s)) ?? sjablonen?.[0])
  const wijzig = gekozen && eerste(zoek.wijzig) === '1'
  return (
    <div className="club-voeding-werkvlak">
      <section className="club-voeding-kolom" aria-labelledby="voeding-sjablonen-kop">
        <h2 id="voeding-sjablonen-kop" className="club-voeding-groepkop">
          {tp.sjablonen} <span>{sjablonen?.length ?? 0}</span>
        </h2>
        {sjablonen === null ? (
          <p className="club-melding club-melding--fout" role="status">{tp.sjablonenFout}</p>
        ) : (
          <SjablonenLijst sjablonen={sjablonen} gekozen={gekozen?.id ?? null} vestiging={vestiging} />
        )}
      </section>
      <div className="club-voeding-zij">
        {nieuw ? (
          <SjabloonFormulier key="nieuw" terugHref={terug} />
        ) : wijzig && gekozen ? (
          <SjabloonFormulier key={gekozen.id} begin={gekozen} terugHref={terug} />
        ) : gekozen ? (
          <SjabloonDetail s={gekozen} wijzigHref={clubPad('/voeding', vestiging, { tab: 'sjablonen', s: gekozen.id, wijzig: '1' })} />
        ) : null}
      </div>
    </div>
  )
}

export default async function VoedingPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const tp = (await clubTekst(VOEDING)).pagina
  const tab = eerste(zoek.tab) === 'sjablonen' ? 'sjablonen' : 'plannen'

  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{tp.boventitel(naamVan(t.vestigingen, vestiging))}</p>
          <h1>{tp.titel}</h1>
          <p>{tp.intro}</p>
        </div>
        {tab === 'sjablonen' && (
          <div className="club-acties">
            <Link href={clubPad('/voeding', vestiging, { tab: 'sjablonen', nieuw: '1' })} scroll={false} className="club-knop club-knop--primair">
              <Plus size={16} aria-hidden /> {tp.nieuwSjabloon}
            </Link>
          </div>
        )}
      </section>
      <nav className="club-segment club-voeding-tabs" aria-label={tp.titel}>
        <Link href={clubPad('/voeding', vestiging)} aria-current={tab === 'plannen' ? 'page' : undefined}>
          {tp.plannen}
        </Link>
        <Link href={clubPad('/voeding', vestiging, { tab: 'sjablonen' })} aria-current={tab === 'sjablonen' ? 'page' : undefined}>
          {tp.sjablonen}
        </Link>
      </nav>
      {tab === 'plannen' ? <PlannenTab t={t} vestiging={vestiging} term={eerste(zoek.q) ?? ''} /> : <SjablonenTab t={t} vestiging={vestiging} zoek={zoek} />}
    </>
  )
}
