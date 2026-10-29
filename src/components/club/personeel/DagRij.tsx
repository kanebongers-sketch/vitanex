import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Plus, MessageSquare } from 'lucide-react'
import { minutenNaarTijd, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import type { Openingstijd } from '@/lib/club/rooster/openingstijden'
import { personeelHref, zonderPaneel, type PersoneelStaat } from '@/lib/club/personeel/url'
import { dekking } from '@/lib/club/personeel/regels'
import { urenKlok } from '@/lib/club/personeel/uren'
import type { Dienst, PersoneelLid, RoosterNotitie } from '@/lib/club/personeel/typen'
import { DienstBlok } from './DienstBlok'
import { dagMaand, plekStijl, weekdagKort, type Bereik } from './weergave'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

type DagTekst = (typeof PERSONEEL)['nl']['dag']

// Een dag als tijdbalk: bovenin de bezetting (gat = koraal, klik = plannen),
// dan mededelingen, dan een baan per medewerker en een baan voor open diensten.
// Een lege plek in een baan aanklikken plant een dienst op dat uur.

interface Props {
  datum: string
  isVandaag: boolean
  bemand: Openingstijd | null
  bereik: Bereik
  diensten: readonly Dienst[]
  notities: readonly RoosterNotitie[]
  team: readonly PersoneelLid[]
  soortNamen: ReadonlyMap<string, string>
  staat: PersoneelStaat
  nuMin: number | null
}

function Bezetting({ datum, bemand, bereik, diensten, staat, tk, tot }: Pick<Props, 'datum' | 'bemand' | 'bereik' | 'diensten' | 'staat'> & { tk: DagTekst; tot: (van: string, tot: string) => string }) {
  if (!bemand) return <div className="club-personeel-spoor club-personeel-onbemand"><span className="club-personeel-spoortekst">{tk.onbemand}</span></div>
  const stukken = dekking(diensten, tijdNaarMinuten(bemand.van), tijdNaarMinuten(bemand.tot))
  const basis = zonderPaneel(staat)
  return (
    <div className="club-personeel-spoor">
      <span className="club-personeel-bemand" style={plekStijl(bemand.van, bemand.tot, bereik)} aria-hidden />
      {stukken.map((s) => {
        const tijd = tot(minutenNaarTijd(s.van), minutenNaarTijd(s.tot))
        if (s.aantal > 0)
          return <span key={s.van} className="club-personeel-dekking" data-aantal={Math.min(s.aantal, 3)} style={plekStijl(s.van, s.tot, bereik)} title={tk.aanHetWerk(tijd, s.aantal)} />
        return (
          <Link key={s.van} className="club-personeel-gat" style={plekStijl(s.van, s.tot, bereik)} href={personeelHref(basis, { nieuw: datum, van: minutenNaarTijd(s.van), tot: minutenNaarTijd(s.tot) })} scroll={false} aria-label={tk.gatPlannen(tijd)}>
            <span>{tk.gat}</span>
          </Link>
        )
      })}
    </div>
  )
}

/** Klikbare uurvakken onder de blokken (muis en touch; met het toetsenbord gebruik je "Dienst"). */
function Uurvakken({ datum, bereik, mw, staat }: { datum: string; bereik: Bereik; mw: string | null; staat: PersoneelStaat }) {
  const basis = zonderPaneel(staat)
  const uren = Array.from({ length: Math.max(0, (bereik.tot - bereik.van) / 60) }, (_, i) => bereik.van + i * 60)
  return (
    <>
      {uren.map((u) => (
        <Link
          key={u}
          className="club-personeel-uurvak"
          style={plekStijl(u, u + 60, bereik)}
          href={personeelHref(basis, { nieuw: datum, van: minutenNaarTijd(u), tot: minutenNaarTijd(Math.min(u + 240, bereik.tot)), mw })}
          scroll={false}
          tabIndex={-1}
          aria-hidden
        />
      ))}
    </>
  )
}

function Baan({ label, kleur, children }: { label: string; kleur?: string; children: React.ReactNode }) {
  return (
    <div className="club-personeel-baan" data-kleur={kleur}>
      <span className="club-personeel-baanlabel">
        {kleur && <span className="club-personeel-stip" aria-hidden />}
        <span>{label}</span>
      </span>
      <div className="club-personeel-spoor">{children}</div>
    </div>
  )
}

export async function DagRij({ datum, isVandaag, bemand, bereik, diensten, notities, team, soortNamen, staat, nuMin }: Props) {
  const taal = await getTaal()
  const alles = await clubTekst(PERSONEEL)
  const tk = alles.dag
  const basis = zonderPaneel(staat)
  const mensen = team.filter((l) => diensten.some((d) => d.medewerkerId === l.id))
  const open = diensten.filter((d) => d.medewerkerId === null)
  const gatMin = bemand ? dekking(diensten, tijdNaarMinuten(bemand.van), tijdNaarMinuten(bemand.tot)).filter((s) => s.aantal === 0).reduce((n, s) => n + s.tot - s.van, 0) : 0
  const inBaan = (n: RoosterNotitie) => n.soort === 'geen_afspraken' && n.van !== null && mensen.some((l) => l.id === n.medewerkerId)
  const mededelingen = notities.filter((n) => !inBaan(n))
  const titelId = `club-personeel-dag-${datum}`
  const nuStijl = nuMin !== null && nuMin >= bereik.van && nuMin <= bereik.tot ? ({ ...plekStijl(nuMin, nuMin, bereik) } as CSSProperties) : null
  const blok = (d: Dienst) => <DienstBlok key={d.id} dienst={d} bereik={bereik} soortNaam={d.soortId ? (soortNamen.get(d.soortId) ?? null) : null} lid={team.find((l) => l.id === d.medewerkerId) ?? null} href={personeelHref(basis, { dienst: d.id })} isGeopend={staat.dienst === d.id} />

  return (
    <section className="club-personeel-dag" data-vandaag={isVandaag || undefined} aria-labelledby={titelId}>
      <header className="club-personeel-dagkop">
        <h2 id={titelId}>
          <span className="club-personeel-dagnaam">{weekdagKort(datum, taal)}</span> <span className="club-personeel-dagnr">{dagMaand(datum, taal)}</span>
        </h2>
        <span className="club-zacht">{bemand ? tk.bemand(bemand.van, bemand.tot) : tk.onbemand}</span>
        {gatMin > 0 && <span className="club-chip club-chip--let-op">{tk.gatUur(urenKlok(gatMin))}</span>}
        {bemand && gatMin === 0 && diensten.length > 0 && <span className="club-chip club-chip--ok">{tk.gedekt}</span>}
        {open.length > 0 && <span className="club-chip club-chip--let-op">{tk.aantalOpen(open.length)}</span>}
        <span className="club-personeel-dagacties">
          <Link className="club-knop club-knop--klein club-knop--stil" href={personeelHref(basis, { paneel: 'notitie', nieuw: datum })} scroll={false}>
            <MessageSquare aria-hidden size={14} /> {tk.mededeling}
          </Link>
          <Link className="club-knop club-knop--klein" href={personeelHref(basis, { nieuw: datum, van: bemand?.van ?? null, tot: null })} scroll={false}>
            <Plus aria-hidden size={14} /> {tk.dienst}
          </Link>
        </span>
      </header>
      <div className="club-personeel-banen">
        {nuStijl && (
          <span className="club-personeel-nulaag" aria-hidden>
            <span className="club-personeel-nu" style={nuStijl} />
          </span>
        )}
        <div className="club-personeel-baan club-personeel-baan--bezetting">
          <span className="club-personeel-baanlabel">{tk.bezetting}</span>
          <Bezetting datum={datum} bemand={bemand} bereik={bereik} diensten={diensten} staat={staat} tk={tk} tot={alles.algemeen.vanTot} />
        </div>
        {mededelingen.length > 0 && (
          <Baan label={tk.mededeling}>
            {mededelingen.map((n) => (
              <Link key={n.id} className="club-personeel-notitie" data-soort={n.soort} style={n.van ? plekStijl(n.van, n.tot ?? minutenNaarTijd(tijdNaarMinuten(n.van) + 30), bereik) : plekStijl(bereik.van, bereik.tot, bereik)} href={personeelHref(basis, { paneel: 'notitie', nieuw: datum })} scroll={false}>
                {n.van && <span className="club-getal">{n.van}</span>} {n.tekst}
              </Link>
            ))}
          </Baan>
        )}
        {mensen.map((l) => (
          <Baan key={l.id} label={l.naam} kleur={l.kleur}>
            <Uurvakken datum={datum} bereik={bereik} mw={l.id} staat={staat} />
            {diensten.filter((d) => d.medewerkerId === l.id).map(blok)}
            {notities
              .filter((n) => inBaan(n) && n.medewerkerId === l.id)
              .map((n) => (
                <Link key={n.id} className="club-personeel-geenafspraken" style={plekStijl(n.van ?? '00:00', n.tot ?? minutenNaarTijd(tijdNaarMinuten(n.van ?? '00:00') + 60), bereik)} href={personeelHref(basis, { paneel: 'notitie', nieuw: datum })} scroll={false} title={n.tekst}>
                  {n.tekst}
                </Link>
              ))}
          </Baan>
        ))}
        {open.length > 0 && <Baan label={alles.algemeen.openDienst}>{open.map(blok)}</Baan>}
        <Baan label={tk.inplannen}>
          <Uurvakken datum={datum} bereik={bereik} mw={null} staat={staat} />
          <span className="club-personeel-spoortekst club-personeel-hint" aria-hidden>
            {tk.klikUur}
          </span>
        </Baan>
      </div>
    </section>
  )
}
