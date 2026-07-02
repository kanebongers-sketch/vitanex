import { describe, expect, test } from 'vitest'
import { escapeHtml } from './email-template'

describe('escapeHtml', () => {
  test('escapet alle HTML-betekenisvolle tekens', () => {
    expect(escapeHtml(`<script>alert("x") & 'y'</script>`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;',
    )
  })

  test('laat gewone tekst ongemoeid', () => {
    expect(escapeHtml('Hallo, ik wil graag een demo — groet, Kane')).toBe(
      'Hallo, ik wil graag een demo — groet, Kane',
    )
  })

  test('escapet & vóór de andere entiteiten (geen dubbele escaping)', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })
})
