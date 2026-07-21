import { describe, it, expect } from 'vitest'
import { bouwTwimlAntwoord, bouwLeegTwiml } from './twiml'

describe('bouwTwimlAntwoord', () => {
  it('pakt een gewone tekst correct in als TwiML', () => {
    // Arrange
    const bericht = 'Hallo, hoe gaat het?'
    // Act
    const xml = bouwTwimlAntwoord(bericht)
    // Assert
    expect(xml).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Hallo, hoe gaat het?</Message></Response>',
    )
  })

  it('escapet alle vijf XML-tekens in de juiste vorm', () => {
    // Arrange — bevat &, <, >, " en '
    const bericht = `Tom & Jerry <3 "quotes" 'apos' >`
    // Act
    const xml = bouwTwimlAntwoord(bericht)
    // Assert
    const inhoud = xml.slice(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>'.length,
      xml.indexOf('</Message>'),
    )
    expect(inhoud).toBe('Tom &amp; Jerry &lt;3 &quot;quotes&quot; &apos;apos&apos; &gt;')
  })

  it('escapet & als eerste, zodat entiteiten niet dubbel-escapen', () => {
    // Arrange — een kale `<` mag niet als `&amp;lt;` eindigen.
    const bericht = '5 < 10'
    // Act
    const xml = bouwTwimlAntwoord(bericht)
    // Assert
    expect(xml).toContain('5 &lt; 10')
    expect(xml).not.toContain('&amp;lt;')
  })

  it('laat geen kale < of & achter buiten de vaste XML-structuur', () => {
    // Arrange — de payload zit vol met breekbare tekens.
    const bericht = `<script>alert("x" & 'y')</script>`
    // Act
    const xml = bouwTwimlAntwoord(bericht)
    // Assert — pel de vaste omhulsel-tags eraf en inspecteer alleen de inhoud.
    const inhoud = xml.slice(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>'.length,
      xml.indexOf('</Message>'),
    )
    // In de ge-escapete inhoud hoort geen enkele kale < of > meer te staan...
    expect(inhoud).not.toMatch(/[<>]/)
    // ...en elke & is het begin van een entiteit (&amp; / &lt; / &quot; / &apos;).
    expect(inhoud).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/)
  })

  it('bouwt een leeg TwiML-antwoord zonder Message', () => {
    // Arrange & Act
    const xml = bouwLeegTwiml()
    // Assert
    expect(xml).toBe('<?xml version="1.0" encoding="UTF-8"?><Response></Response>')
  })
})
