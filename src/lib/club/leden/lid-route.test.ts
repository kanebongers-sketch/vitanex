// PATCH /api/club/leden/[id]: de status van een lid wijzigen vanaf de ledenkaart
// (een proeflid wordt lid). Tijdens een verzoek tot verwijderen (AVG) blijft de
// status vast, anders zou een wijziging het verzoek stil ongedaan maken.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const stand = vi.hoisted(() => ({
  updates: [] as unknown[], verzoek: null as unknown, t: null as unknown, opzeggingen: [] as unknown[], weg: [] as string[],
  log: [] as unknown[][], taal: 'nl' as 'nl' | 'en', lid: {} as Record<string, unknown>,
  dubbel: null as { id: string; vestiging: string } | null | undefined, inlog: null as string | null | undefined,
}))

vi.mock('@/lib/club/toegang', () => ({
  vereisClubToegang: async () => stand.t,
  clubFout: (fout: string, status: number) => NextResponse.json({ fout }, { status }),
  clubJson: (data: unknown, status = 200) => NextResponse.json(data, { status }),
  logActie: async (...args: unknown[]) => {
    stand.log.push(args.slice(1))
  },
}))
vi.mock('@/lib/aiyourgym/taal/server', () => ({ getTaal: async () => stand.taal }))
vi.mock('@/lib/club/nieuwe-leden/toevoegen-opslag', () => ({ zoekZelfdeAdres: async () => stand.dubbel }))
vi.mock('@/lib/club/behoud/opslag', () => ({
  bewaarOpzegging: async (_a: unknown, _u: string, o: unknown) => {
    stand.opzeggingen.push(o)
    return { soort: 'ok', id: 'opz-1' }
  },
  verwijderOpzegging: async (_a: unknown, _u: string, id: string) => {
    stand.weg.push(id)
  },
}))
vi.mock('@/lib/club/kern/vestiging-toegang', () => ({ eisVestigingVanRecord: async () => null }))
vi.mock('@/lib/club/kern/medewerker', () => ({ haalMedewerkers: async () => [] }))
vi.mock('@/lib/club/leden/avg/opslag', () => ({ haalVerwijderverzoek: async () => stand.verzoek }))
vi.mock('@/lib/club/lidmaatschappen/lezen', () => ({
  haalVormen: async () => [{ id: 'v1', naam: 'All-in', omschrijving: '', vestigingen: null, groepslessen: true, maxLessenPerWeek: null, dalVan: null, dalTot: null, dalWeekendVrij: false, kleur: 'amber', actief: true, demo: false }],
}))
vi.mock('@/lib/club/kern/lid', async (orig) => ({
  ...(await orig<typeof import('@/lib/club/kern/lid')>()),
  haalLid: async () => ({ id: LID, vestiging: 'centrum', voornaam: 'Sanne', achternaam: 'Jansen', status: 'proef', tags: [], coachId: null, ...stand.lid }),
}))

import { PATCH } from '@/app/(aiyourgym)/api/club/leden/[id]/route'

const LID = '22222222-2222-4222-8222-222222222222'

/** Een rij uit club_lid_toegang: een actief account met wachtwoord. */
const toegangRij = (email: string) => ({
  id: '44444444-4444-4444-8444-444444444444', user_id: '55555555-5555-4555-8555-555555555555', lid_id: LID, code: 'abcdefghijklmnopqrstuvwx',
  code_gemaakt_op: '2026-11-01T10:00:00Z', code_gebruikt_op: '2026-11-01T10:05:00Z', actief: true, email, wachtwoord_hash: 'scrypt$x', pin_hash: null,
})

function admin() {
  return {
    from: () => ({
      // Alleen het inlogadres van de ledenapp wordt hier gelezen (club_lid_toegang).
      select: () => {
        const q = {
          eq: () => q,
          maybeSingle: async () => (stand.inlog === undefined ? { data: null, error: { message: 'stuk' } } : { data: stand.inlog ? toegangRij(stand.inlog) : null, error: null }),
        }
        return q
      },
      update: (w: unknown) => {
        stand.updates.push(w)
        const q = { eq: () => q, then: (ok: (a: unknown) => unknown) => Promise.resolve({ error: null }).then(ok) }
        return q
      },
    }),
  }
}

const patch = (body: unknown) =>
  PATCH(new NextRequest(`https://x.aiyourgym.com/api/club/leden/${LID}`, { method: 'PATCH', body: JSON.stringify(body) }), { params: Promise.resolve({ id: LID }) })

beforeEach(() => {
  stand.updates = []
  stand.verzoek = null
  stand.opzeggingen = []
  stand.weg = []
  stand.log = []
  stand.taal = 'nl'
  stand.lid = { email: 'sanne@oud.nl', telefoon: '0612345678', geboortedatum: '1990-05-17' }
  stand.dubbel = null
  stand.inlog = null
  stand.t = { admin: admin(), userId: 'org', vestigingen: [{ sleutel: 'centrum', naam: 'Centrum', standaard: true }], naam: 'Lisa' }
})

describe('status wijzigen op de ledenkaart', () => {
  it('zet een proeflid op actief', async () => {
    const r = await patch({ status: 'actief' })
    expect(r.status).toBe(200)
    expect(stand.updates).toEqual([expect.objectContaining({ status: 'actief' })])
  })

  it('weigert tijdens een verzoek tot verwijderen en schrijft niets', async () => {
    stand.verzoek = { aangevraagdOp: '2026-10-20T10:00:00Z', definitiefOp: '2026-11-19T10:00:00Z', aangevraagdDoor: 'Mark' }
    const r = await patch({ status: 'actief' })
    expect(r.status).toBe(409)
    expect(stand.updates).toEqual([])
  })

  it('geeft een fout als het verzoek niet te lezen is (liever niets dan stil terugdraaien)', async () => {
    stand.verzoek = undefined
    expect((await patch({ status: 'actief' })).status).toBe(500)
    expect(stand.updates).toEqual([])
  })
})

describe('lidmaatschap wijzigen op de ledenkaart', () => {
  it('zet een bestaande vorm en de datums', async () => {
    const r = await patch({ abonnement: 'all-in', lidSinds: '2026-01-05' })
    expect(r.status).toBe(200)
    expect(stand.updates).toEqual([expect.objectContaining({ abonnement: 'All-in', lid_sinds: '2026-01-05' })])
  })

  it('weigert een vorm die de sportschool niet heeft', async () => {
    expect((await patch({ abonnement: 'Verzonnen' })).status).toBe(400)
    expect(stand.updates).toEqual([])
  })

  it('bewaart de pauzedatums apart van de status', async () => {
    const r = await patch({ status: 'gepauzeerd', pauzeVan: '2026-11-01', pauzeTot: '2026-11-30' })
    expect(r.status).toBe(200)
    expect(stand.updates).toEqual([expect.objectContaining({ status: 'gepauzeerd' }), { pauze_van: '2026-11-01', pauze_tot: '2026-11-30' }])
    expect(await r.json()).toEqual({ ok: true, pauzeNietOpgeslagen: false, redenNietOpgeslagen: false })
  })
})

describe('opzeggen of stoppen vraagt een reden (migratie 482)', () => {
  it('weigert stoppen zonder reden en schrijft niets', async () => {
    // Arrange en Act
    const r = await patch({ status: 'gestopt', einddatum: '2026-10-31' })
    // Assert
    expect(r.status).toBe(400)
    expect(stand.updates).toEqual([])
    expect(stand.opzeggingen).toEqual([])
  })

  it('bewaart de reden en daarna de status', async () => {
    const r = await patch({ status: 'gestopt', einddatum: '2026-10-31', opzegReden: { reden: 'verhuizing', toelichting: 'Naar Utrecht' } })
    expect(r.status).toBe(200)
    expect(stand.opzeggingen).toEqual([expect.objectContaining({ reden: 'verhuizing', toelichting: 'Naar Utrecht', actie: 'stoppen', einddatum: '2026-10-31', lidId: LID, door: 'Lisa' })])
    expect(stand.updates).toEqual([expect.objectContaining({ status: 'gestopt' })])
  })

  it('bewaart bij gezondheid alleen de categorie', async () => {
    await patch({ status: 'gestopt', opzegReden: { reden: 'gezondheid', toelichting: 'Knie' } })
    expect(stand.opzeggingen).toEqual([expect.objectContaining({ reden: 'gezondheid', toelichting: null })])
  })
})

describe('contactgegevens wijzigen op de ledenkaart', () => {
  it('schrijft telefoon, e-mail en geboortedatum netjes weg', async () => {
    // Arrange en Act
    const r = await patch({ email: ' Sanne@Nieuw.NL ', telefoon: '06 87654321', geboortedatum: '1991-01-02' })
    // Assert
    expect(r.status).toBe(200)
    expect(stand.updates).toEqual([expect.objectContaining({ email: 'sanne@nieuw.nl', telefoon: '06 87654321', geboortedatum: '1991-01-02' })])
    expect(await r.json()).toEqual({ ok: true, pauzeNietOpgeslagen: false, redenNietOpgeslagen: false })
  })

  it('maakt een veld leeg met een lege waarde', async () => {
    expect((await patch({ telefoon: '', geboortedatum: null })).status).toBe(200)
    expect(stand.updates).toEqual([expect.objectContaining({ telefoon: null, geboortedatum: null })])
  })

  it('geeft een fout per veld in het Nederlands en schrijft niets', async () => {
    const r = await patch({ email: 'geen-adres', telefoon: 'bel mij' })
    expect(r.status).toBe(400)
    expect(await r.json()).toEqual({
      fout: 'Controleer de velden met een melding.',
      velden: { email: 'Dit e-mailadres klopt niet.', telefoon: 'Gebruik 6 tot 15 cijfers. Spaties, +, haakjes en streepjes mogen.' },
    })
    expect(stand.updates).toEqual([])
  })

  it('geeft de fout in het Engels als de medewerker Engels heeft gekozen', async () => {
    stand.taal = 'en'
    const r = await patch({ geboortedatum: '2999-01-01' })
    expect(await r.json()).toEqual({ fout: 'Check the fields with a message.', velden: { geboortedatum: 'A date of birth cannot be in the future.' } })
  })

  it('weigert een e-mailadres dat al bij een ander lid van de sportschool hoort', async () => {
    stand.dubbel = { id: '33333333-3333-4333-8333-333333333333', vestiging: 'centrum' }
    const r = await patch({ email: 'ander@lid.nl' })
    expect(r.status).toBe(409)
    expect(await r.json()).toEqual({ fout: 'Controleer de velden met een melding.', velden: { email: 'Dit e-mailadres hoort al bij een ander lid.' } })
    expect(stand.updates).toEqual([])
  })

  it('zoekt niet op dubbel als het adres hetzelfde blijft', async () => {
    stand.dubbel = { id: '33333333-3333-4333-8333-333333333333', vestiging: 'centrum' }
    expect((await patch({ email: 'SANNE@oud.nl', telefoon: '0611111111' })).status).toBe(200)
  })

  it('meldt dat het inlogadres van de ledenapp niet mee verandert', async () => {
    stand.inlog = 'sanne@oud.nl'
    const r = await patch({ email: 'sanne@nieuw.nl' })
    expect(r.status).toBe(200)
    expect(await r.json()).toMatchObject({ ok: true, loginBlijft: true })
    // Alleen club_leden wordt geschreven: het inlogadres blijft van het lid.
    expect(stand.updates).toHaveLength(1)
  })

  it('meldt niets als het lid al met het nieuwe adres inlogt of geen account heeft', async () => {
    stand.inlog = 'sanne@nieuw.nl'
    expect(await (await patch({ email: 'sanne@nieuw.nl' })).json()).not.toHaveProperty('loginBlijft')
    stand.inlog = null
    expect(await (await patch({ email: 'sanne@nieuw.nl' })).json()).not.toHaveProperty('loginBlijft')
  })

  it('schrijft niets als het inlogadres of de dubbelcontrole niet te lezen is', async () => {
    stand.inlog = undefined
    expect((await patch({ email: 'sanne@nieuw.nl' })).status).toBe(500)
    stand.inlog = null
    stand.dubbel = undefined
    expect((await patch({ email: 'sanne@nieuw.nl' })).status).toBe(500)
    expect(stand.updates).toEqual([])
  })

  it('logt welke velden zijn gewijzigd, zonder oude of nieuwe waarden (AVG)', async () => {
    await patch({ email: 'sanne@nieuw.nl', telefoon: '06 87654321', geboortedatum: '1991-01-02', achternaam: 'de Vries' })
    expect(stand.log).toEqual([['Lid bijgewerkt', 'Sanne de Vries: gegevens gewijzigd (achternaam, e-mail, telefoon, geboortedatum)', 'centrum']])
    const regel = JSON.stringify(stand.log)
    for (const waarde of ['sanne@nieuw.nl', 'sanne@oud.nl', '87654321', '12345678', '1991', '1990', 'Jansen']) expect(regel).not.toContain(waarde)
  })

  it('wijzigt contact en status in een verzoek', async () => {
    expect((await patch({ status: 'actief', telefoon: '0611111111' })).status).toBe(200)
    expect(stand.updates).toEqual([expect.objectContaining({ status: 'actief', telefoon: '0611111111' })])
  })
})
