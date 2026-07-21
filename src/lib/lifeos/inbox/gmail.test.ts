import { describe, expect, test } from 'vitest'
import { duid403, statusNaarFout } from './gmail'

// De statusvertaling is de kern van de "koppel opnieuw"-fix: een 403 van Gmail
// (te weinig scope — een leesrecht-only koppeling van vóór de schrijf-uitbreiding)
// moet een eigen `scope_ontbreekt`-sein worden en niet platgeslagen op `fout`.
// Anders wordt het verderop een kale 502 "Kon je inbox niet lezen" i.p.v. een
// nette re-couple-melding. Puur, dus zonder netwerk te testen.

describe('statusNaarFout', () => {
  test('401 → verlopen (het token, niet de rechten)', () => {
    // Verlopen krijgt elders één verse refresh; het is iets anders dan te weinig
    // scope. Daarom een aparte tak.
    expect(statusNaarFout(401)).toEqual({ staat: 'verlopen' })
  })

  test('403 → scope_ontbreekt (koppel opnieuw)', () => {
    // De hele reden van deze fix: 403 is een instructie (koppel opnieuw), geen
    // storing. Het mag niet als `fout` eindigen, anders toont de kaart een kale
    // 502 zonder knop om het op te lossen.
    expect(statusNaarFout(403)).toEqual({ staat: 'scope_ontbreekt' })
  })

  test.each([500, 502, 503, 429, 400, 404])('%i → fout met http-reden', (status) => {
    // Alles wat geen 401/403 is, is een echte storing en houdt zijn status in de
    // reden — dat is diagnostiek, geen gebruikerstekst.
    expect(statusNaarFout(status)).toEqual({ staat: 'fout', reden: `http_${status}` })
  })
})

// De 403-verfijning: dezelfde status, twee totaal verschillende oplossingen. Een
// uitgeschakelde Gmail-API mag NOOIT als "koppel opnieuw" eindigen, want dan loopt
// Kane in een cirkel — elke her-koppeling stuit weer op precies deze 403.
describe('duid403', () => {
  test('accessNotConfigured (API uit) → api_uit', () => {
    // De echte body die Gmail geeft als de API uitstaat: reason in `errors[]`.
    const body = {
      error: {
        code: 403,
        message:
          'Gmail API has not been used in project 123456 before or it is disabled. Enable it by visiting …',
        errors: [{ message: 'Gmail API …', domain: 'usageLimits', reason: 'accessNotConfigured' }],
        status: 'PERMISSION_DENIED',
      },
    }
    expect(duid403(body)).toEqual({ staat: 'api_uit' })
  })

  test('SERVICE_DISABLED in details[] → api_uit', () => {
    // Google zet dezelfde oorzaak soms als ErrorInfo in `details[]`.
    const body = {
      error: {
        code: 403,
        message: 'Permission denied.',
        details: [
          {
            '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
            reason: 'SERVICE_DISABLED',
            domain: 'googleapis.com',
            metadata: { service: 'gmail.googleapis.com' },
          },
        ],
      },
    }
    expect(duid403(body)).toEqual({ staat: 'api_uit' })
  })

  test('alleen de boodschap (geen reason-veld) → api_uit via tekstherkenning', () => {
    const body = { error: { code: 403, message: 'Gmail API … before or it is disabled.' } }
    expect(duid403(body)).toEqual({ staat: 'api_uit' })
  })

  test('insufficientPermissions (te weinig scope) → scope_ontbreekt', () => {
    const body = {
      error: {
        code: 403,
        message: 'Request had insufficient authentication scopes.',
        errors: [{ message: 'Insufficient Permission', domain: 'global', reason: 'insufficientPermissions' }],
        status: 'PERMISSION_DENIED',
      },
    }
    expect(duid403(body)).toEqual({ staat: 'scope_ontbreekt' })
  })

  test.each([null, undefined, {}, { error: 'kapot' }, { error: {} }, 'tekst'])(
    'onbegrijpelijke/lege body (%s) → scope_ontbreekt (veilige gok)',
    (body) => {
      // Bij twijfel opnieuw koppelen: dat doet geen kwaad, terwijl "zet de API aan"
      // bij een echte scope-fout een doodlopend spoor zou zijn.
      expect(duid403(body)).toEqual({ staat: 'scope_ontbreekt' })
    },
  )
})
