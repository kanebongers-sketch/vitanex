import { describe, expect, it } from 'vitest'
import { GEEN_AI, STANDAARD_MODEL, aiFuncties, aiModel } from './schakelaar'

// De betaalde AI staat standaard UIT (besluit Kane 29-10-2026: eerst akkoord over de kosten).

describe('schakelaar voedings-AI', () => {
  it('staat uit zonder CLUB_VOEDING_AI_ACTIEF, ook met een sleutel', () => {
    expect(aiFuncties({})).toEqual(GEEN_AI)
    expect(aiFuncties({ ANTHROPIC_API_KEY: 'sleutel' })).toEqual(GEEN_AI)
    expect(aiFuncties({ CLUB_VOEDING_AI_ACTIEF: 'true', ANTHROPIC_API_KEY: 'sleutel' })).toEqual(GEEN_AI)
  })

  it('staat uit met de schakelaar maar zonder Anthropic-sleutel', () => {
    expect(aiFuncties({ CLUB_VOEDING_AI_ACTIEF: '1' })).toEqual(GEEN_AI)
  })

  it('foto en schatten met de schakelaar en een Anthropic-sleutel', () => {
    expect(aiFuncties({ CLUB_VOEDING_AI_ACTIEF: '1', ANTHROPIC_API_KEY: 's' })).toEqual({ foto: true, schatten: true })
  })

  it('kent geen inspreken meer (besluit Kane 29-10-2026)', () => {
    expect(Object.keys(aiFuncties({ CLUB_VOEDING_AI_ACTIEF: '1', ANTHROPIC_API_KEY: 's' })).sort()).toEqual(['foto', 'schatten'])
  })

  it('neemt alleen een geldig model over', () => {
    expect(STANDAARD_MODEL).toBe('claude-haiku-5-5')
    expect(aiModel({})).toBe(STANDAARD_MODEL)
    expect(aiModel({ CLUB_VOEDING_AI_MODEL: 'claude-sonnet-5-5' })).toBe('claude-sonnet-5-5')
    expect(aiModel({ CLUB_VOEDING_AI_MODEL: 'gpt-4o' })).toBe(STANDAARD_MODEL)
  })
})
