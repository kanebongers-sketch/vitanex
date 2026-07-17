import { describe, it, expect } from 'vitest'
import { beoordeelChatId, leerModusAntwoord, LEER_MODUS } from './toegang'

// De allowlist is het slot dat bewijst "dit komt van Kane". Het secret bewijst
// alleen "dit komt van Telegram". Deze tests bewaken vooral één ding: dat een
// ontbrekende allowlist NIET stilletjes alles doorlaat.

describe('beoordeelChatId — fail-closed', () => {
  it('weigert als er geen allowlist is (undefined)', () => {
    expect(beoordeelChatId(42, undefined)).toEqual({ soort: 'geweigerd' })
  })

  it('weigert bij een lege allowlist', () => {
    expect(beoordeelChatId(42, '')).toEqual({ soort: 'geweigerd' })
  })

  it('weigert bij een allowlist van alleen witruimte en komma\'s', () => {
    expect(beoordeelChatId(42, '  ,  , ')).toEqual({ soort: 'geweigerd' })
  })
})

describe('beoordeelChatId — allowlist', () => {
  it('laat de toegestane chat door', () => {
    expect(beoordeelChatId(42, '42')).toEqual({ soort: 'toegestaan' })
  })

  it('weigert een chat die er niet op staat', () => {
    expect(beoordeelChatId(43, '42')).toEqual({ soort: 'geweigerd' })
  })

  it('ondersteunt meerdere chats (komma-gescheiden, met witruimte)', () => {
    expect(beoordeelChatId(99, '42, 99 , 7')).toEqual({ soort: 'toegestaan' })
    expect(beoordeelChatId(7, '42, 99 , 7')).toEqual({ soort: 'toegestaan' })
    expect(beoordeelChatId(8, '42, 99 , 7')).toEqual({ soort: 'geweigerd' })
  })

  it('matcht op het hele id, niet op een prefix', () => {
    // 4 mag niet meeliften op 42 — anders opent één cijfer de deur.
    expect(beoordeelChatId(4, '42')).toEqual({ soort: 'geweigerd' })
    expect(beoordeelChatId(420, '42')).toEqual({ soort: 'geweigerd' })
  })

  it('behandelt een negatief chat-id (groepen) als een gewone waarde', () => {
    expect(beoordeelChatId(-100123, '-100123')).toEqual({ soort: 'toegestaan' })
    expect(beoordeelChatId(100123, '-100123')).toEqual({ soort: 'geweigerd' })
  })
})

describe('beoordeelChatId — leer-modus', () => {
  it('geeft leer_modus voor elke chat als de escape aan staat', () => {
    expect(beoordeelChatId(42, LEER_MODUS)).toEqual({ soort: 'leer_modus' })
    expect(beoordeelChatId(999, LEER_MODUS)).toEqual({ soort: 'leer_modus' })
  })

  it('is hoofdletterongevoelig', () => {
    expect(beoordeelChatId(42, 'Leer-Modus')).toEqual({ soort: 'leer_modus' })
  })

  it('laat een expliciet vermeld id wél normaal werken naast leer-modus', () => {
    // De migratieweg: je eigen id werkt al, de rest krijgt alleen zijn id terug.
    expect(beoordeelChatId(42, 'leer-modus,42')).toEqual({ soort: 'toegestaan' })
    expect(beoordeelChatId(99, 'leer-modus,42')).toEqual({ soort: 'leer_modus' })
  })
})

describe('leerModusAntwoord', () => {
  it('noemt het chat-id, zodat je het kunt overnemen', () => {
    expect(leerModusAntwoord(42)).toContain('42')
  })

  it('noemt de env-var die je moet zetten', () => {
    expect(leerModusAntwoord(42)).toContain('LIFEOS_TELEGRAM_ALLOWED_CHAT_ID')
  })
})
