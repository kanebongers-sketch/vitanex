// ─── Club, ledenlogin: hulp voor de inlogroutes en -pagina's (SERVER-ONLY) ──
// Een link is alleen bruikbaar als alles klopt: de toegang is actief, het lid
// hoort nog bij de sportschool en mag trainen, de ledenapp staat aan en (met
// subdomeinen) de host is die van de sportschool. Anders precies hetzelfde
// antwoord als bij een onbekende link: niets verraadt dat de link bestond.

import type { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { moduleAan, type Organisatie } from '@/lib/club/kern/organisatie'
import { haalLid, type Lid } from '@/lib/club/kern/lid'
import { vestigingenUitRijen } from '@/lib/club/kern/vestigingen'
import { APPARAAT_DAGEN, lidApparaatCookie, lidCookie, linkStaat, type LidToegangRij } from './regels'
import { vindLidToegang, type Sessie } from './opslag'
import { lidMagApp } from './toegang'

/** Het ene antwoord voor elke link die niet (meer) werkt. */
export const LINK_WERKT_NIET = 'Deze link werkt niet (meer). Vraag de sportschool om een nieuwe.'

export interface BruikbareLink {
  toegang: LidToegangRij
  lid: Lid
  organisatie: Organisatie
}

/** De toegang achter een code, alleen als die nu bruikbaar is; anders null. */
export async function bruikbareLink(admin: SupabaseClient, code: string | null | undefined, nu: Date): Promise<BruikbareLink | null> {
  if (!code) return null
  const toegang = await vindLidToegang(admin, code)
  if (!toegang || linkStaat(toegang, nu) === 'ongeldig') return null
  const [{ organisatie }, lid, vestigingen] = await Promise.all([
    haalEigenOrganisatie(admin, toegang.userId),
    haalLid(admin, toegang.userId, toegang.lidId),
    admin.from('club_vestigingen').select('vestiging, naam, volgorde, standaard').eq('user_id', toegang.userId),
  ])
  if (!organisatie || organisatie.id !== toegang.userId || !moduleAan(organisatie, 'app')) return null
  if (!lidMagApp(lid, vestigingenUitRijen(vestigingen.data ?? [])) || lid.id !== toegang.lidId) return null
  if (!(await hostPastBij(organisatie))) return null
  return { toegang, lid, organisatie }
}

const BASIS = { httpOnly: true, sameSite: 'lax' as const, path: '/' }

function veilig(): boolean {
  return process.env.NODE_ENV === 'production'
}

/** Na inloggen: de sessie, en de link onthouden voor /mijn/inloggen. */
export function zetLidCookies(res: NextResponse, sessie: Sessie, code: string, nu: Date): void {
  res.cookies.set(lidCookie(), sessie.token, { ...BASIS, secure: veilig(), expires: sessie.verlooptOp })
  res.cookies.set(lidApparaatCookie(), code, { ...BASIS, secure: veilig(), expires: new Date(nu.getTime() + APPARAAT_DAGEN * 86_400_000) })
}

/** Uitloggen: de sessiecookie weg; met `ookLink` ook de onthouden link. */
export function wisLidCookies(res: NextResponse, ookLink: boolean): void {
  res.cookies.set(lidCookie(), '', { ...BASIS, secure: veilig(), maxAge: 0 })
  if (ookLink) res.cookies.set(lidApparaatCookie(), '', { ...BASIS, secure: veilig(), maxAge: 0 })
}

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })

export function blokkadeTekst(totOp: string): string {
  return `Te vaak een foute pincode. Probeer het na ${TIJD.format(new Date(totOp))} opnieuw.`
}
