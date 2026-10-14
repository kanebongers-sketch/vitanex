import { describe, expect, it } from 'vitest'
import { isUuid, leesTrainingInvoer } from './invoer'

const ID = '3f2b8c1e-1d2a-4c5b-9e8f-0a1b2c3d4e5f'

describe('invoer training afvinken', () => {
  it('accepteert een geldige body', () => {
    expect(leesTrainingInvoer({ lidId: ID, schemaId: ID, dag: 2 })).toEqual({ lidId: ID, schemaId: ID, dag: 2 })
  })

  it('weigert rommel met een Nederlandse melding', () => {
    expect(leesTrainingInvoer(null)).toBe('Ongeldig verzoek.')
    expect(leesTrainingInvoer({ lidId: 'x', schemaId: ID, dag: 1 })).toBe('Onbekend lid.')
    expect(leesTrainingInvoer({ lidId: ID, schemaId: ID, dag: 9 })).toBe('Onbekende trainingsdag.')
    expect(leesTrainingInvoer({ lidId: ID, schemaId: ID, dag: '1' })).toBe('Onbekende trainingsdag.')
  })

  it('herkent uuids', () => {
    expect(isUuid(ID)).toBe(true)
    expect(isUuid(`${ID}x`)).toBe(false)
  })
})
