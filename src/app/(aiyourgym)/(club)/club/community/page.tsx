import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, ShieldAlert } from 'lucide-react'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { isUuid } from '@/lib/club/kern/organisatie'
import { haalChallenges } from '@/lib/club/challenges/lezen'
import { haalCommunityBeheer, haalGroepDetail, zoekLeden } from '@/lib/club/community/beheer'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { GroepFormulier, type Keuze } from '@/components/club/community/beheer/GroepFormulier'
import { Beoordelen } from '@/components/club/community/beheer/Beoordelen'
import { GroepDetail } from '@/components/club/community/beheer/GroepDetail'
import '@/components/club/community/community.css'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { COMMUNITY } from '@/lib/aiyourgym/taal/woorden/club/community'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(COMMUNITY)).beheer.titel }
}

// Community van de ledenapp: links "Te beoordelen" en de groepen, rechts de
// lijst met gemelde en vastgehouden berichten (standaard), een groep (?g=<id>)
// of het formulier (?nieuw=1 of ?g=<id>&wijzig=1). Leden zoeken met ?zoek=.

function eerste(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

async function haalLestypen(t: Awaited<ReturnType<typeof eisClubToegang>>): Promise<Keuze[]> {
  const { data, error } = await t.admin.from('club_lestypen').select('id, naam').eq('user_id', t.userId).order('naam').limit(300)
  if (error) console.error('[club/community] lestypen lezen mislukt', error.message)
  return ((data ?? []) as { id: unknown; naam: unknown }[]).flatMap((r) => (typeof r.id === 'string' && typeof r.naam === 'string' ? [{ id: r.id, naam: r.naam }] : []))
}

export default async function CommunityBeheerPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const terug = clubPad('/community', vestiging)
  const nieuw = eerste(zoek.nieuw) === '1'
  const gekozenId = eerste(zoek.g)
  const gekozen = isUuid(gekozenId) ? gekozenId : null
  const wijzig = gekozen !== null && eerste(zoek.wijzig) === '1'
  const zoekTekst = (eerste(zoek.zoek) ?? '').slice(0, 40)

  const [beheer, detail] = await Promise.all([haalCommunityBeheer(t), gekozen ? haalGroepDetail(t, gekozen) : Promise.resolve(null)])
  const formulier = nieuw || wijzig
  const [challenges, lestypen] = formulier || detail ? await Promise.all([haalChallenges(t.admin, t.userId), haalLestypen(t)]) : [null, [] as Keuze[]]
  const challengeKeuzes: Keuze[] = (challenges ?? []).filter((c) => !c.gestoptOp).map((c) => ({ id: c.id, naam: c.titel }))
  const resultaten = detail && zoekTekst.length >= 2 ? await zoekLeden(t, zoekTekst, detail.groep.vestiging) : []
  const vestigingen = t.vestigingen.map((v) => ({ sleutel: v.sleutel, naam: v.naam }))
  const actief = (beheer?.groepen ?? []).filter((g) => !g.gearchiveerdOp)
  const archief = (beheer?.groepen ?? []).filter((g) => g.gearchiveerdOp)
  const aantalBeoordelen = beheer?.beoordelen.length ?? 0
  const tc = await clubTekst(COMMUNITY)
  const tb = tc.beheer

  function koppeling(): string | null {
    if (!detail) return null
    const delen = [
      detail.groep.challengeId ? tb.challenge(challengeKeuzes.find((c) => c.id === detail.groep.challengeId)?.naam ?? (challenges ?? []).find((c) => c.id === detail.groep.challengeId)?.titel ?? tb.onbekend) : null,
      detail.groep.lestypeId ? tb.les(lestypen.find((l) => l.id === detail.groep.lestypeId)?.naam ?? tb.onbekend) : null,
    ].filter(Boolean)
    return delen.length ? delen.join(' · ') : null
  }

  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{tb.titel}</h1>
          <p>{tb.intro}</p>
        </div>
        <div className="club-acties">
          <Link href={clubPad('/community', vestiging, { nieuw: '1' })} scroll={false} className="club-knop club-knop--primair">
            <Plus size={16} aria-hidden /> {tb.nieuweGroep}
          </Link>
        </div>
      </section>

      {beheer === null && (
        <p className="club-melding club-melding--fout" role="status">
          {tb.laadFout}
        </p>
      )}

      <div className="club-cmb-werkvlak">
        <nav aria-label={tb.titel} className="club-cmb-kolom">
          <ul className="club-cmb-lijst">
            <li>
              <Link href={terug} scroll={false} aria-current={!gekozen && !nieuw ? 'page' : undefined}>
                <strong>
                  <ShieldAlert size={15} aria-hidden /> {tb.teBeoordelen}
                </strong>
                <span className={aantalBeoordelen > 0 ? 'club-cmb-status club-cmb-status--vastgehouden' : 'club-cmb-status'}>{aantalBeoordelen}</span>
              </Link>
            </li>
          </ul>
          <h2 className="club-label">{tb.groepen}</h2>
          {actief.length > 0 ? (
            <ul className="club-cmb-lijst">
              {actief.map((g) => (
                <li key={g.id}>
                  <Link href={clubPad('/community', vestiging, { g: g.id })} scroll={false} aria-current={gekozen === g.id ? 'page' : undefined}>
                    <strong>{g.naam}</strong>
                    <span>{g.leden}</span>
                    <small>
                      {tc.toegang[g.toegang].label} · {g.vestiging ? naamVan(t.vestigingen, g.vestiging) : tb.alleVestigingen}
                      {g.demo ? ` · ${tb.demo}` : ''}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="club-cmb-item-meta">{tb.geenGroepen}</p>
          )}
          {archief.length > 0 && (
            <details>
              <summary>{tb.archief(archief.length)}</summary>
              <ul className="club-cmb-lijst">
                {archief.map((g) => (
                  <li key={g.id} className="is-archief">
                    <Link href={clubPad('/community', vestiging, { g: g.id })} scroll={false} aria-current={gekozen === g.id ? 'page' : undefined}>
                      <strong>{g.naam}</strong>
                      <span>{g.leden}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </nav>

        <div className="club-cmb-kolom">
          {nieuw ? (
            <GroepFormulier key="nieuw" vestigingen={vestigingen} challenges={challengeKeuzes} lestypen={lestypen} terugHref={terug} />
          ) : wijzig && detail ? (
            <GroepFormulier key={detail.groep.id} begin={detail.groep} vestigingen={vestigingen} challenges={challengeKeuzes} lestypen={lestypen} terugHref={terug} />
          ) : gekozen && detail ? (
            <GroepDetail
              detail={detail}
              wijzigHref={clubPad('/community', vestiging, { g: detail.groep.id, wijzig: '1' })}
              zoek={{ v: vestiging, g: detail.groep.id, tekst: zoekTekst, resultaten }}
              vestigingNaam={detail.groep.vestiging ? naamVan(t.vestigingen, detail.groep.vestiging) : null}
              koppeling={koppeling()}
            />
          ) : gekozen ? (
            <p className="club-melding club-melding--fout" role="status">
              {detail === undefined ? tb.groepLaadFout : tb.groepBestaatNiet}
            </p>
          ) : (
            beheer && <Beoordelen items={beheer.beoordelen} />
          )}
        </div>
      </div>
    </>
  )
}
