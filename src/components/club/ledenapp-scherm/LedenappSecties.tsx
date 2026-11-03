import Link from 'next/link'
import { ArrowRight, Megaphone, Plus, Trophy, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ClubToegang } from '@/lib/club/toegang'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { onderdeelAfgenomen } from '@/lib/club/kern/pakketten'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { kanBewerken } from '@/lib/club/rollen/wie'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { APP_PAGINA } from '@/lib/aiyourgym/taal/woorden/club/app-pagina'
import './ledenapp-scherm.css'

// Leden · Ledenapp (ontwerp "Club in 10 minuten", 03-11-2026): wat de sportschool
// in de app zet, als drie rustige blokken boven Bekijk als lid. Berichten staat
// er altijd (met recht); Community verschijnt pas zodra er een groep is;
// Challenges toont tot de eerste er is alleen de knop Challenge starten. De
// volledige schermen (/club/berichten, /club/community, /club/challenges)
// blijven bestaan; dit zijn de ingangen. Alleen echte aantallen.

/** Aantal rijen van deze sportschool in een tabel; null = lezen mislukt. */
async function tel(t: ClubToegang, tabel: string, filter?: [string, string]): Promise<number | null> {
  let q = t.admin.from(tabel).select('id', { count: 'exact', head: true }).eq('user_id', t.userId)
  if (filter) q = q.eq(filter[0], filter[1])
  const { count, error } = await q
  return error ? null : (count ?? 0)
}

interface BlokProps {
  icoon: ReactNode
  titel: string
  regel: string
  href: string
  linkTekst: string
  actie?: { href: string; tekst: string }
}

function Blok({ icoon, titel, regel, href, linkTekst, actie }: BlokProps) {
  return (
    <li className="club-las-blok">
      <span className="club-las-icoon" aria-hidden>{icoon}</span>
      <div className="club-las-tekst">
        <h3>{titel}</h3>
        <p>{regel}</p>
      </div>
      <div className="club-las-acties">
        {actie ? (
          <Link href={actie.href} className="club-knop club-knop--klein"><Plus size={15} aria-hidden /> {actie.tekst}</Link>
        ) : (
          <Link href={href} className="club-las-link">{linkTekst} <ArrowRight size={15} aria-hidden /></Link>
        )}
      </div>
    </li>
  )
}

export async function LedenappSecties({ t, vestiging }: { t: ClubToegang; vestiging: Vestiging }) {
  const ziet = (s: string) => magOnderdeel(t.onderdelen, s) && onderdeelAfgenomen(t.organisatie.afgenomen, s)
  const berichtenZien = ziet('berichten')
  const communityZien = ziet('community') && moduleAan(t.organisatie, 'app')
  const challengesZien = ziet('challenges')
  if (!berichtenZien && !communityZien && !challengesZien) return null

  const [berichten, groepen, beoordelen, challenges] = await Promise.all([
    berichtenZien ? tel(t, 'club_berichten') : null,
    communityZien ? tel(t, 'club_community_groepen') : null,
    communityZien ? tel(t, 'club_community_meldingen', ['status', 'open']) : null,
    challengesZien ? tel(t, 'club_challenges') : null,
  ])
  const w = (await clubTekst(APP_PAGINA)).secties
  const s = (n: number | null, tekst: (n: number) => string) => (n === null ? w.fout : tekst(n))

  const blokken: ReactNode[] = []
  if (berichtenZien) {
    blokken.push(<Blok key="b" icoon={<Megaphone size={18} />} titel={w.berichten.titel} regel={berichten === 0 ? w.berichten.leeg : s(berichten, w.berichten.aantal)} href={clubPad('/berichten', vestiging)} linkTekst={w.berichten.openen} />)
  }
  // Verbergen tot gebruikt: Community pas als er een groep is.
  if (communityZien && (groepen ?? 0) > 0) {
    const extra = beoordelen ? ` · ${w.community.beoordelen(beoordelen)}` : ''
    blokken.push(<Blok key="c" icoon={<UsersRound size={18} />} titel={w.community.titel} regel={`${s(groepen, w.community.aantal)}${extra}`} href={clubPad('/community', vestiging)} linkTekst={w.community.openen} />)
  }
  if (challengesZien) {
    const starten = challenges === 0 && kanBewerken(t, 'challenges') ? { href: clubPad('/challenges', vestiging, { nieuw: '1' }), tekst: w.challenges.starten } : undefined
    blokken.push(<Blok key="ch" icoon={<Trophy size={18} />} titel={w.challenges.titel} regel={challenges === 0 ? '' : s(challenges, w.challenges.aantal)} href={clubPad('/challenges', vestiging)} linkTekst={w.challenges.openen} actie={starten} />)
  }

  const kop = (await clubTekst(APP_PAGINA)).inDeApp
  return (
    <section className="club-las" aria-labelledby="ledenapp-in-de-app">
      <h2 id="ledenapp-in-de-app" className="club-las-kop">{kop}</h2>
      <ul className="club-las-lijst">{blokken}</ul>
    </section>
  )
}
