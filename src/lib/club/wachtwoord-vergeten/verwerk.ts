// ─── Club: wachtwoord vergeten, de afhandeling (SERVER-ONLY) ────────────────
// Draait NA het antwoord van de route (after), zodat ook de rekentijd niets
// verraadt over een adres. Alles wat de buitenwereld raakt (database, mail,
// rem, melden) komt binnen als `deps`; de route geeft de echte functies mee,
// de test eigen versies. Er gaat nooit een adres, naam of link naar een log.

import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { REM_EMAIL, kiesOntvanger, vergetenMailTekst, type Kandidaat } from './regels'

export type VergetenUitkomst = 'verstuurd' | 'geen_account' | 'geremd' | 'niet_ingesteld' | 'mislukt' | 'db'

export type MailUitkomst = 'verstuurd' | 'niet_ingesteld' | 'mislukt'

/** Een verse eenmalige link (een uur geldig, RESET_MS): het pad. */
export interface NieuweLink {
  pad: string
}

export interface VergetenDeps<B extends Kandidaat, M extends Kandidaat> {
  /** Is er een afzender voor mail (AIYOURGYM_RESEND_FROM plus RESEND_API_KEY)? */
  mailKlaar: () => boolean
  /** De rem per e-mailadres; de sleutel is een HMAC, nooit het adres zelf. */
  isGeremd: (rem: typeof REM_EMAIL, email: string) => Promise<boolean>
  isPlatform: (email: string) => Promise<boolean>
  vindBeheerder: (email: string) => Promise<B | null>
  vindMedewerker: (email: string) => Promise<M | null>
  /** Naam en adres van de sportschool, of null als die niet (meer) bestaat. */
  sportschool: (organisatieId: string) => Promise<{ naam: string; slug: string | null } | null>
  /** Een verse code met dezelfde functies als de uitnodiging; het wachtwoord en de toestellen blijven. */
  linkBeheerder: (b: B) => Promise<NieuweLink | null>
  linkMedewerker: (m: M) => Promise<NieuweLink | null>
  /** Het volledige adres van een pad bij deze sportschool (sportschoolUrl), nooit een geplakt domein. */
  url: (slug: string | null, pad: string) => string
  stuurMail: (naar: string, onderwerp: string, tekst: string) => Promise<MailUitkomst>
  /** Een melding voor de platform-eigenaar, zonder persoonsgegevens. */
  meld: (reden: string) => Promise<void>
}

export const MELDING_GEEN_MAIL = 'Wachtwoord vergeten: mail is niet ingesteld (AIYOURGYM_RESEND_FROM of RESEND_API_KEY ontbreekt). Er gaan geen mails met een nieuwe link uit.'
export const MELDING_MAIL_MISLUKT = 'Wachtwoord vergeten: de mail met de nieuwe link versturen mislukte.'
export const MELDING_OPSLAAN_MISLUKT = 'Wachtwoord vergeten: de nieuwe link opslaan mislukte.'

/**
 * Zoekt het account bij dit adres en mailt een verse link. Zonder afzender
 * gebeurt er niets (geen code, geen zoekwerk), alleen een melding voor de
 * platform-eigenaar. De uitkomst is alleen voor tests en het logboek van
 * fouten; de bezoeker krijgt hem nooit te zien.
 */
export async function verwerkVergeten<B extends Kandidaat, M extends Kandidaat>(email: string, taal: Taal, deps: VergetenDeps<B, M>): Promise<VergetenUitkomst> {
  if (!deps.mailKlaar()) {
    await deps.meld(MELDING_GEEN_MAIL)
    return 'niet_ingesteld'
  }
  if (await deps.isGeremd(REM_EMAIL, email)) return 'geremd'

  const platform = await deps.isPlatform(email)
  const beheerder = platform ? null : await deps.vindBeheerder(email)
  const medewerker = platform || beheerder ? null : await deps.vindMedewerker(email)
  const ontvanger = kiesOntvanger(email, { platform, beheerder, medewerker })
  if (ontvanger.soort === 'geen') return 'geen_account'

  const org = await deps.sportschool(ontvanger.account.organisatieId)
  if (!org) return 'geen_account'
  const link = ontvanger.soort === 'beheerder' ? await deps.linkBeheerder(ontvanger.account) : await deps.linkMedewerker(ontvanger.account)
  if (!link) {
    await deps.meld(MELDING_OPSLAAN_MISLUKT)
    return 'db'
  }

  const { onderwerp, tekst } = vergetenMailTekst({ naam: ontvanger.account.naam, sportschool: org.naam, link: deps.url(org.slug, link.pad) }, taal)
  const uit = await deps.stuurMail(email, onderwerp, tekst)
  if (uit !== 'verstuurd') await deps.meld(uit === 'niet_ingesteld' ? MELDING_GEEN_MAIL : MELDING_MAIL_MISLUKT)
  return uit
}
