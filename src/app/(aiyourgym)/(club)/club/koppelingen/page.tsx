import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, BellRing, CreditCard, FileDown, FileUp, LayoutTemplate, Smartphone } from 'lucide-react'
import { eisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { instelKijker } from '@/lib/club/instel-toegang'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { qrCheckinAan } from '@/lib/club/kern/org-instellingen'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import {
  altijdStand, betaalStand, koppelingHref, koppelingInTaal, ledenappStand, meldingenStand, onbekendeStand, standLabel, widgetStand, zichtbareKoppelingen,
  type KoppelStand, type KoppelStatus, type KoppelingId,
} from '@/lib/club/kern/koppelingen'
import { betalenActief, clubStripeSleutel } from '@/lib/club/betalen/config'
import { haalBetaalAccount } from '@/lib/club/betalen/opslag'
import { haalWidgetInstellingen } from '@/lib/club/widget/opslag'
import { widgetActief } from '@/lib/club/widget/schakelaar'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { mailKlaar } from '@/lib/club/app-uitnodigen/regels'
import { leesVapidSleutels, pushActief } from '@/lib/club/push/sleutels'
import '@/components/club/shell/koppelingen.css'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { KOPPEL_TEKST } from '@/lib/aiyourgym/taal/woorden/club/koppelingen'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(KOPPEL_TEKST)).pagina.titel }
}
export const dynamic = 'force-dynamic'

// Koppelingen (hulpbalk onderaan, idee Kane 23-10-2026): alleen wat echt in
// Club zit, met de stand zoals die nu is, en een link naar de pagina waar je
// het instelt. Wie de instel-pagina niet mag zien, ziet de koppeling niet
// (regels en standen in src/lib/club/kern/koppelingen.ts).

const ICOON: Record<KoppelingId, LucideIcon> = {
  betalen: CreditCard,
  widget: LayoutTemplate,
  ledenapp: Smartphone,
  meldingen: BellRing,
  importeren: FileUp,
  exports: FileDown,
}

const CHIP: Record<KoppelStand, string> = {
  aan: 'club-chip club-chip--ok',
  bezig: 'club-chip club-chip--info',
  uit: 'club-chip club-chip--uit',
  dicht: 'club-chip club-chip--uit',
  onbekend: 'club-chip club-chip--let-op',
}

async function betaalStatus(t: ClubToegang, taal: Taal): Promise<KoppelStatus> {
  const actief = betalenActief()
  const sleutelGezet = clubStripeSleutel() !== null
  const account = actief && sleutelGezet ? await haalBetaalAccount(t.admin, t.userId) : null
  return betaalStand({ actief, sleutelGezet, account }, taal)
}

async function widgetStatus(t: ClubToegang, taal: Taal): Promise<KoppelStatus> {
  const instellingen = await Promise.all(t.vestigingen.map((v) => haalWidgetInstellingen(t.admin, t.userId, v.sleutel)))
  const aanOp = instellingen.some((i) => i === null) ? null : instellingen.filter((i) => i?.aan).length
  return widgetStand({ actief: widgetActief(), adres: Boolean(t.organisatie.slug), aanOp, vestigingen: t.vestigingen.length }, taal)
}

function vasteStatus(t: ClubToegang, id: KoppelingId, taal: Taal): KoppelStatus | null {
  const org = t.organisatie
  if (id === 'ledenapp') return ledenappStand({ open: CLUB_LEDEN_LOGIN && moduleAan(org, 'app'), qr: org.instellingen.ledenapp.qr && qrCheckinAan(org.instellingen.checkin) }, taal)
  if (id === 'meldingen') return meldingenStand({ mail: mailKlaar(process.env), push: pushActief(process.env) && leesVapidSleutels(process.env) !== null }, taal)
  if (id === 'importeren' || id === 'exports') return altijdStand(id, taal)
  return null
}

/** De stand van elke koppeling die deze persoon ziet; alleen wat nodig is wordt gelezen. */
async function standen(t: ClubToegang, ids: readonly KoppelingId[], taal: Taal): Promise<Map<KoppelingId, KoppelStatus>> {
  const lees = async (id: KoppelingId): Promise<[KoppelingId, KoppelStatus]> => {
    if (id === 'betalen') return [id, await betaalStatus(t, taal)]
    if (id === 'widget') return [id, await widgetStatus(t, taal)]
    return [id, vasteStatus(t, id, taal) ?? onbekendeStand(taal)]
  }
  return new Map(await Promise.all(ids.map(lees)))
}

export default async function KoppelingenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const kijker = instelKijker(t)
  const taal = await getTaal()
  const tekst = KOPPEL_TEKST[taal].pagina
  const lijst = zichtbareKoppelingen(kijker).map((k) => koppelingInTaal(k, taal))
  if (lijst.length === 0) notFound()
  const vestiging = kiesUit(t.vestigingen, (await searchParams).v)
  const stand = await standen(t, lijst.map((k) => k.id), taal)
  const werkt = lijst.filter((k) => stand.get(k.id)?.stand === 'aan').length

  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{tekst.titel}</h1>
          <p>{tekst.intro(werkt, lijst.length)}</p>
        </div>
      </header>

      <ul className="club-koppelingen" role="list">
        {lijst.map((k) => {
          const Icoon = ICOON[k.id]
          const s = stand.get(k.id)
          const href = koppelingHref(k, kijker, vestiging)
          return (
            <li key={k.id} className="club-koppeling" data-stand={s?.stand}>
              <div className="club-koppeling-kop">
                <span className="club-koppeling-icoon" aria-hidden><Icoon size={20} strokeWidth={1.75} /></span>
                <h2>{k.titel}</h2>
                {s && <span className={CHIP[s.stand]}>{standLabel(s.stand, taal)}</span>}
              </div>
              <p className="club-koppeling-uitleg">{k.uitleg}</p>
              {s && <p className="club-koppeling-stand">{s.tekst}</p>}
              {href ? (
                <Link href={href} className="club-knop club-knop--klein club-koppeling-knop">
                  {k.knop} <ArrowRight size={15} aria-hidden />
                </Link>
              ) : (
                <span className="club-koppeling-knop club-hint">{tekst.nietInTeStellen}</span>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
