// ─── LifeOS — Telegram-webhookbeheer (registreren + status lezen) ───────────
// SERVER-ONLY. De bot-token zit in élke URL naar api.telegram.org en wordt NOOIT
// gelogd of teruggegeven. De webhook-URL en Telegram's foutteksten bevatten de
// token niet (die staat alleen in het pad dat wíj aanroepen), dus die mogen wél
// terug — ze helpen Kane zien dat de koppeling staat.
//
// Waarom een apart endpoint en geen setWebhook-bij-deploy? Omdat de registratie
// het gedeelde secret bevat en precies één keer hoeft: 'm blind bij elke start
// aanroepen zou de token onnodig vaak over de lijn sturen. De founder-gate op de
// route (zie setup/route.ts) is de sleutel; deze module doet alleen het werk.
//
// De narrowing (`narrowWebhookStatus`) is puur en los getest: Telegram mag morgen
// een veld hernoemen, dan tonen we "onbekend" i.p.v. een crash.

const API_BASIS = 'https://api.telegram.org'

/** Wat setWebhook oplevert. De `url` bevat geen token — veilig om te tonen. */
export type ZetUitkomst =
  | { staat: 'ok'; url: string }
  /** Een env-var ontbreekt; `ontbreekt` benoemt welke, zodat Kane weet wat te zetten. */
  | { staat: 'niet_ingericht'; ontbreekt: string }
  | { staat: 'fout'; reden: string }

/** De huidige webhook-stand volgens Telegram. Genoeg om te zien of het werkt. */
export interface WebhookStatus {
  /** De geregistreerde URL, of `''` als er (nog) geen webhook staat. */
  url: string
  /** Hoeveel updates nog in de wachtrij staan (hoog = webhook faalt of staat uit). */
  wachtrij: number
  /** Telegram's laatste push-fout, of null. Hier zie je een secret-mismatch (401) meteen. */
  laatsteFout: string | null
}

export type StatusUitkomst =
  | { staat: 'ok'; status: WebhookStatus }
  | { staat: 'niet_ingericht'; ontbreekt: string }
  | { staat: 'fout'; reden: string }

/**
 * De publieke URL waar Telegram naartoe pusht. Dezelfde `APP_URL`-afspraak als
 * `gmailConfig()`: `APP_URL` of anders `NEXT_PUBLIC_APP_URL`, en null als geen van
 * beide staat — dan is er niets zinnigs te registreren.
 */
export function webhookUrl(): string | null {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return null
  return `${appUrl.replace(/\/+$/, '')}/api/lifeos/telegram/webhook`
}

/** Houdt de foutdetail kort en op één regel — diagnostiek, geen roman. */
function schoon(detail: string): string {
  return detail.replace(/\s+/g, ' ').trim().slice(0, 200)
}

/**
 * Registreert de webhook bij Telegram met het gedeelde secret.
 *
 * `allowed_updates: ['message']` — we verwerken alleen berichten (tekst + spraak);
 * edited_message, callback's e.d. hoeven we niet en zouden alleen ruis pushen.
 * `drop_pending_updates: true` — een stapel oude berichten bij de eerste
 * registratie is niets om alsnog af te werken.
 */
export async function zetWebhook(): Promise<ZetUitkomst> {
  const token = process.env.LIFEOS_TELEGRAM_BOT_TOKEN
  const secret = process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET
  if (!token) return { staat: 'niet_ingericht', ontbreekt: 'LIFEOS_TELEGRAM_BOT_TOKEN' }
  if (!secret) return { staat: 'niet_ingericht', ontbreekt: 'LIFEOS_TELEGRAM_WEBHOOK_SECRET' }
  const url = webhookUrl()
  if (!url) return { staat: 'niet_ingericht', ontbreekt: 'APP_URL' }

  let antwoord: Response
  try {
    antwoord = await fetch(`${API_BASIS}/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        secret_token: secret,
        allowed_updates: ['message'],
        drop_pending_updates: true,
      }),
    })
  } catch {
    return { staat: 'fout', reden: 'netwerk' }
  }

  if (!antwoord.ok) {
    // Telegram's foutbody bevat de token niet (die staat alleen in het pad). De
    // `description` is diagnostiek — bv. "bad webhook: HTTPS url must be provided".
    const detail = await antwoord.text().catch(() => '')
    return { staat: 'fout', reden: `http_${antwoord.status}: ${schoon(detail)}` }
  }

  return { staat: 'ok', url }
}

/** PUUR: het getWebhookInfo-antwoord → `WebhookStatus`, of null bij een onbegrijpelijke body. */
export function narrowWebhookStatus(body: unknown): WebhookStatus | null {
  if (typeof body !== 'object' || body === null) return null
  const resultaat = (body as { result?: unknown }).result
  if (typeof resultaat !== 'object' || resultaat === null) return null
  const r = resultaat as Record<string, unknown>

  const url = typeof r.url === 'string' ? r.url : ''
  const wachtrij =
    typeof r.pending_update_count === 'number' && Number.isFinite(r.pending_update_count)
      ? r.pending_update_count
      : 0
  const laatsteFout =
    typeof r.last_error_message === 'string' && r.last_error_message.trim().length > 0
      ? r.last_error_message
      : null

  return { url, wachtrij, laatsteFout }
}

/** Leest de huidige webhook-stand bij Telegram. Alleen lezen; verandert niets. */
export async function leesWebhookStatus(): Promise<StatusUitkomst> {
  const token = process.env.LIFEOS_TELEGRAM_BOT_TOKEN
  if (!token) return { staat: 'niet_ingericht', ontbreekt: 'LIFEOS_TELEGRAM_BOT_TOKEN' }

  let antwoord: Response
  try {
    antwoord = await fetch(`${API_BASIS}/bot${token}/getWebhookInfo`)
  } catch {
    return { staat: 'fout', reden: 'netwerk' }
  }

  if (!antwoord.ok) {
    const detail = await antwoord.text().catch(() => '')
    return { staat: 'fout', reden: `http_${antwoord.status}: ${schoon(detail)}` }
  }

  const body: unknown = await antwoord.json().catch(() => null)
  const status = narrowWebhookStatus(body)
  if (!status) return { staat: 'fout', reden: 'onbegrijpelijk_antwoord' }

  return { staat: 'ok', status }
}
