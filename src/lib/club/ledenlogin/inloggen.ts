// ─── Club, ledenlogin: inloggen met e-mailadres en wachtwoord (SERVER-ONLY) ──
// Een account hoort bij een lid van een sportschool. Hetzelfde e-mailadres kan
// lid zijn bij meer sportscholen (met een eigen wachtwoord per sportschool).
// Welke sportschool:
//   1. Met subdomeinen aan: alleen die van het subdomein (bruikbaarAccount
//      controleert de host); op <slug>.aiyourgym.com is er dus hooguit een.
//   2. Op de gewone inlogpagina met ?s=<sportschool> of na een keuze: die.
//   3. Anders: elk account met dit adres waarvan het wachtwoord klopt. Klopt het
//      bij meer dan een sportschool, dan kiest het lid (pas NA een goed
//      wachtwoord, zodat niemand zo kan uitzoeken waar iemand lid is).
// Onbekend adres, account dat de app niet mag gebruiken en fout wachtwoord
// geven hetzelfde antwoord met ongeveer dezelfde rekentijd.

import type { SupabaseClient } from '@supabase/supabase-js'
import { controleerWachtwoord, maakSessie, vindInlogKandidaten, type Sessie } from './opslag'
import { bruikbaarAccount, schijnControle, type BruikbaarAccount } from './inlog-api'

export interface SportschoolKeuze {
  id: string
  naam: string
}

export type LidInlogUitkomst =
  | { staat: 'ok'; sessie: Sessie }
  | { staat: 'kies'; sportscholen: SportschoolKeuze[] }
  | { staat: 'fout' }
  | { staat: 'geblokkeerd'; totOp: string }
  | { staat: 'dicht' }
  | { staat: 'db' }

async function bruikbareKandidaten(admin: SupabaseClient, email: unknown, sportschool: string | null): Promise<BruikbaarAccount[]> {
  const kandidaten = await vindInlogKandidaten(admin, email, sportschool)
  const accounts = await Promise.all(kandidaten.map((t) => bruikbaarAccount(admin, t)))
  return accounts.filter((a): a is BruikbaarAccount => a !== null)
}

/** Inloggen; `sportschool` (een club_organisaties.id) beperkt tot die sportschool. */
export async function logInMetEmail(admin: SupabaseClient, email: unknown, wachtwoord: string, sportschool: string | null, nu: Date): Promise<LidInlogUitkomst> {
  const accounts = await bruikbareKandidaten(admin, email, sportschool)
  if (accounts.length === 0) {
    schijnControle(wachtwoord)
    return { staat: 'fout' }
  }
  const goed: BruikbaarAccount[] = []
  const anders: Array<Exclude<Awaited<ReturnType<typeof controleerWachtwoord>>, { staat: 'goed' }>> = []
  // Na elkaar: elke controle reserveert een poging op dat account.
  for (const a of accounts) {
    const uit = await controleerWachtwoord(admin, a.toegang, wachtwoord, nu)
    if (uit.staat === 'goed') goed.push(a)
    else anders.push(uit)
  }
  if (goed.length === 1) {
    const sessie = await maakSessie(admin, goed[0].toegang, nu)
    return sessie ? { staat: 'ok', sessie } : { staat: 'db' }
  }
  if (goed.length > 1) return { staat: 'kies', sportscholen: goed.map((a) => ({ id: a.organisatie.id, naam: a.organisatie.naam })) }
  if (anders.some((u) => u.staat === 'db')) return { staat: 'db' }
  // Een blokkade of een dicht account alleen noemen als er precies een account is
  // (dan weet het lid over welk account het gaat); anders het gewone antwoord.
  const enige = accounts.length === 1 ? anders[0] : null
  if (enige?.staat === 'geblokkeerd' || enige?.staat === 'dicht') return enige
  return { staat: 'fout' }
}
