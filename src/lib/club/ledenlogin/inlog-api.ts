// ─── Club, ledenlogin: hulp voor de inlogroutes en -pagina's (SERVER-ONLY) ──
// Een account (of uitnodiging) is alleen bruikbaar als alles klopt: de toegang
// is actief, het lid hoort nog bij de sportschool en mag trainen, de ledenapp
// staat aan en (met subdomeinen) de host is die van de sportschool. Anders
// precies hetzelfde antwoord als bij een onbekend adres of een onbekende link:
// niets verraadt dat er een account of link bestond.

import type { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { moduleAan, type Organisatie } from '@/lib/club/kern/organisatie'
import { haalLid, type Lid } from '@/lib/club/kern/lid'
import { vestigingenUitRijen } from '@/lib/club/kern/vestigingen'
import { hashWachtwoord, wachtwoordKlopt } from '@/lib/club/kern/wachtwoord'
import { lidApparaatCookie, lidCookie, linkBruikbaar, type LidToegangRij } from './regels'
import { vindLidToegang, type Sessie } from './opslag'
import { lidMagApp } from './toegang'

/** Het ene antwoord voor elke uitnodiging die niet (meer) werkt. */
export const LINK_WERKT_NIET = 'Deze link werkt niet (meer). Heb je al een wachtwoord? Log dan in met je e-mailadres. Anders: vraag een nieuwe link aan.'
/** Het ene antwoord voor een onbekend adres of een fout wachtwoord. */
export const INLOG_FOUT = 'E-mailadres of wachtwoord klopt niet.'

export interface BruikbaarAccount {
  toegang: LidToegangRij
  lid: Lid
  organisatie: Organisatie
}

/** Mag dit account nu de ledenapp in (los van wachtwoord of uitnodiging)? Anders null. */
export async function bruikbaarAccount(admin: SupabaseClient, toegang: LidToegangRij): Promise<BruikbaarAccount | null> {
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

/** De toegang achter een uitnodigingscode, alleen als er nu een wachtwoord mee gekozen kan worden; anders null. */
export async function bruikbareLink(admin: SupabaseClient, code: string | null | undefined, nu: Date): Promise<BruikbaarAccount | null> {
  if (!code) return null
  const toegang = await vindLidToegang(admin, code)
  if (!toegang || !linkBruikbaar(toegang, nu)) return null
  return bruikbaarAccount(admin, toegang)
}

/** Voor een onbekend adres: evenveel rekenwerk als een echte controle (een keer gemaakt, bij het eerste gebruik). */
let schijn: string | null = null
export function schijnControle(wachtwoord: string): void {
  schijn ??= hashWachtwoord('schijn-wachtwoord-voor-gelijke-tijd')
  wachtwoordKlopt(wachtwoord, schijn)
}

const BASIS = { httpOnly: true, sameSite: 'lax' as const, path: '/' }

function veilig(): boolean {
  return process.env.NODE_ENV === 'production'
}

/** Na inloggen: de sessie, en een oude onthouden link (van de pincode-tijd) weg. */
export function zetLidCookies(res: NextResponse, sessie: Sessie): void {
  res.cookies.set(lidCookie(), sessie.token, { ...BASIS, secure: veilig(), expires: sessie.verlooptOp })
  res.cookies.set(lidApparaatCookie(), '', { ...BASIS, secure: veilig(), maxAge: 0 })
}

/** Uitloggen: de sessiecookie weg, en een oude onthouden link ook. */
export function wisLidCookies(res: NextResponse): void {
  res.cookies.set(lidCookie(), '', { ...BASIS, secure: veilig(), maxAge: 0 })
  res.cookies.set(lidApparaatCookie(), '', { ...BASIS, secure: veilig(), maxAge: 0 })
}

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })

export function blokkadeTekst(totOp: string): string {
  return `Te vaak een fout wachtwoord. Probeer het na ${TIJD.format(new Date(totOp))} opnieuw.`
}

export const EMAIL_BEZET = 'Dit e-mailadres hoort al bij een ander lid van deze sportschool. Gebruik je eigen e-mailadres.'

export const DICHT_TEKST ='Te vaak een fout wachtwoord: je account is dicht. Vraag een nieuwe link aan om een nieuw wachtwoord te kiezen, of vraag het aan de balie.'
