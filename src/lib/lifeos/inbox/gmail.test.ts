import { describe, expect, test } from 'vitest'
import { statusNaarFout } from './gmail'

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
