import { describe, expect, it } from 'vitest'
import { BEHEER_ROUTES, ledenRoutes } from '@/components/club/app/api-routes'

const LID = '11111111-1111-4111-8111-111111111111'

describe('ledenapp-routes', () => {
  it('de leden-API stuurt nooit een lid mee, in body of vraag', () => {
    const r = ledenRoutes()
    const alles = JSON.stringify([
      r.lesBoeken('les', LID), r.trainingAfvinken(LID, 'schema', 2), r.afspraken(LID), r.sloten(LID, { type: 't', datum: '2026-10-20', medewerker: '' }),
      r.afspraakBoeken(LID, { typeId: 't', medewerkerId: null, datum: '2026-10-20', tijd: '10:00' }), r.afspraakAnnuleren('a', LID), r.challenge('c', LID), r.checkinCode(LID),
    ])
    expect(alles).not.toContain(LID)
    expect(r.lesBoeken('les', LID)).toEqual({ url: '/api/club/lid/reserveringen', body: { lesId: 'les' } })
    expect(r.coaching(new URLSearchParams({ naam: 'Back squat' }))).toBe('/api/club/lid/coaching?naam=Back+squat')
    expect(r.checkinCode(LID)).toBe('/api/club/lid/checkin-code')
  })
  it('in de voorvertoning van Kane krijgt elke URL ?voor=', () => {
    const r = ledenRoutes(LID)
    expect(r.afspraken(LID)).toBe(`/api/club/lid/afspraken?voor=${LID}`)
    expect(r.checkinCode(LID)).toBe(`/api/club/lid/checkin-code?voor=${LID}`)
    expect(r.sloten(LID, { type: 't', datum: 'd', medewerker: '' })).toBe(`/api/club/lid/afspraken/sloten?type=t&datum=d&medewerker=&voor=${LID}`)
  })
  it('de voorvertoning in Club houdt de beheerder-routes', () => {
    expect(BEHEER_ROUTES.lesBoeken('les', LID)).toEqual({ url: '/api/club/rooster/reserveringen', body: { lesId: 'les', lidId: LID, bron: 'app' } })
    expect(BEHEER_ROUTES.lesAnnuleren('r')).toBe('/api/club/rooster/reserveringen/r/annuleren')
    expect(BEHEER_ROUTES.challenge('c', LID)).toEqual({ url: '/api/club/challenges/c/deelnemers', body: { lidId: LID } })
    expect(BEHEER_ROUTES.coaching(new URLSearchParams({ naam: 'x' }))).toBe('/api/club/training/coaching?naam=x')
  })
})
