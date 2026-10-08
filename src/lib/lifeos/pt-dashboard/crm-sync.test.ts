import { describe, expect, test } from 'vitest'
import { crmVelden } from './crm-sync'

// De vertaling PT-app-klant → CRM-klant (Kane's inplanning). Wat telt: een
// lopende klant is "actieve_klant", een gestopte "inactief"; de cadans volgt
// het abonnement; een locatie buiten Kane's drie clubs blijft leeg.

const k = { abonnement: '1x', club: 'bergeijk', status: 'actief', startdatum: '2026-05-28', opgezegdOp: null } as const

describe('crmVelden', () => {
  test('lopende klant: actief met cadans en locatie', () => {
    expect(crmVelden(k, '2026-10-08')).toEqual({ status: 'actieve_klant', locatie: 'bergeijk', abonnement: 'wekelijks_1', duo: false })
  })
  test('abonnementen vertalen naar de inplan-cadans; duo blijft duo', () => {
    expect(crmVelden({ ...k, abonnement: '2x' }, '2026-10-08').abonnement).toBe('wekelijks_2')
    expect(crmVelden({ ...k, abonnement: '1x_2w' }, '2026-10-08').abonnement).toBe('tweewekelijks_1')
    expect(crmVelden({ ...k, abonnement: 'duo_1x' }, '2026-10-08')).toMatchObject({ abonnement: 'wekelijks_1', duo: true })
    expect(crmVelden({ ...k, abonnement: 'coaching' }, '2026-10-08').abonnement).toBeNull()
  })
  test('gestopt of opzegtermijn voorbij → inactief', () => {
    expect(crmVelden({ ...k, status: 'gestopt', opgezegdOp: '2026-09-01' }, '2026-10-08').status).toBe('inactief')
    expect(crmVelden({ ...k, status: 'opgezegd', opgezegdOp: '2026-06-01' }, '2026-10-08').status).toBe('inactief')
  })
  test('club buiten Budel/Bergeijk/Someren → geen CRM-locatie', () => {
    expect(crmVelden({ ...k, club: 'bladel' }, '2026-10-08').locatie).toBeNull()
  })
})
