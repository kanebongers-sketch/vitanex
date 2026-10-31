import { describe, expect, it, vi } from 'vitest'
import { nepSupabase, type Antwoord, type Vraag } from '@/lib/club/beheerders/nep-supabase'
import { verwerkEvent, verwerkSessie, type VerwerkDeps } from './verwerk'
import type { AfgerondeSessie } from './stripe-event'

const ID = '0b6f7c1e-2a3d-4e5f-8a9b-0c1d2e3f4a5b'
const ORG = '7e570000-0000-4000-8000-0000000000aa'
const NU = new Date('2026-10-17T12:00:00Z')

const rij = (extra: Record<string, unknown> = {}) => ({
  id: ID, pakket: 'club', sportschool_naam: 'Sterk', slug: 'sterk', aantal_vestigingen: 1, eigenaar_naam: 'Sanne', eigenaar_email: 's@b.nl', eigenaar_telefoon: '0612345678',
  status: 'wacht_op_betaling', stripe_session_id: 'cs_test_1', stripe_subscription_id: null, organisatie_id: null, aangemaakt_op: NU.toISOString(), bijgewerkt_op: NU.toISOString(), ...extra,
})

const sessie: AfgerondeSessie = { sessieId: 'cs_test_1', aanmeldingId: ID, status: 'complete', betaalStatus: 'no_payment_required', mode: 'subscription', klantId: 'cus_1', abonnementId: 'sub_1' }
const ok = (data: unknown): Antwoord => ({ data, error: null })

function deps(uitslag: { ok: true; organisatieId: string } | { ok: false; reden?: 'email_bezet' } = { ok: true, organisatieId: ORG }) {
  const d = {
    maakSportschool: vi.fn<VerwerkDeps['maakSportschool']>(async () => uitslag),
    ruimOp: vi.fn<VerwerkDeps['ruimOp']>(async () => undefined),
    welkom: vi.fn<VerwerkDeps['welkom']>(async () => undefined),
    nu: () => NU,
  }
  return d
}

/** Een nep-database: de aanmelding, en of de claim (update naar inrichten) wint. */
function db(aanmelding: unknown, claimWint = true, eventFout?: { code: string; message: string }) {
  return nepSupabase((v: Vraag) => {
    if (v.tabel === 'ayg_stripe_events' && v.actie === 'insert') return { data: null, error: eventFout ?? null }
    if (v.tabel === 'ayg_aanmeldingen' && v.actie === 'select') return ok(aanmelding)
    if (v.tabel === 'ayg_aanmeldingen' && v.actie === 'update' && (v.waarde as { status?: string }).status === 'inrichten') return ok(claimWint ? [{ id: ID }] : [])
    return ok([{ id: ID }])
  })
}

describe('verwerkSessie', () => {
  it('richt precies een keer in en rondt af op actief', async () => {
    const { admin, vragen } = db(rij())
    const d = deps()
    expect(await verwerkSessie(admin, sessie, d)).toBe('ingericht')
    expect(d.maakSportschool).toHaveBeenCalledTimes(1)
    expect(d.welkom).toHaveBeenCalledTimes(1)
    const af = vragen.find((v) => v.actie === 'update' && (v.waarde as { status?: string }).status === 'actief')
    expect(af?.waarde).toMatchObject({ stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_1' })
  })
  it('verliest de claim (al bezig of klaar): niets aanmaken', async () => {
    const { admin } = db(rij(), false)
    const d = deps()
    expect(await verwerkSessie(admin, sessie, d)).toBe('klaar')
    expect(d.maakSportschool).not.toHaveBeenCalled()
  })
  it('een aanmelding die al actief is, wordt niet opnieuw ingericht', async () => {
    const { admin, vragen } = db(rij({ status: 'actief', organisatie_id: ORG }))
    const d = deps()
    expect(await verwerkSessie(admin, sessie, d)).toBe('klaar')
    expect(d.maakSportschool).not.toHaveBeenCalled()
    expect(vragen.some((v) => v.actie === 'update')).toBe(false)
  })
  it('een andere sessie dan die bij de aanmelding hoort, telt niet', async () => {
    const { admin } = db(rij({ stripe_session_id: 'cs_test_ander' }))
    const d = deps()
    expect(await verwerkSessie(admin, sessie, d)).toBe('klaar')
    expect(d.maakSportschool).not.toHaveBeenCalled()
  })
  it('een open sessie doet niets', async () => {
    const { admin, vragen } = db(rij())
    expect(await verwerkSessie(admin, { ...sessie, status: 'open' }, deps())).toBe('klaar')
    expect(vragen).toHaveLength(0)
  })
  it('mislukt het aanmaken, dan terug naar wachten zodat Stripe het opnieuw doet', async () => {
    const { admin, vragen } = db(rij())
    const d = deps({ ok: false })
    expect(await verwerkSessie(admin, sessie, d)).toBe('fout')
    expect(vragen.some((v) => v.actie === 'update' && (v.waarde as { status?: string }).status === 'wacht_op_betaling')).toBe(true)
    expect(d.welkom).not.toHaveBeenCalled()
  })
  it('een adres dat al een account heeft: geen tweede sportschool, een aanvraag voor Kane, geen herhaling van Stripe', async () => {
    const { admin, vragen } = db(rij())
    const meld = vi.fn(async () => undefined)
    const d = { ...deps({ ok: false, reden: 'email_bezet' }), meld }
    expect(await verwerkSessie(admin, sessie, d)).toBe('nakijken')
    const naar = vragen.find((v) => v.actie === 'update' && (v.waarde as { status?: string }).status === 'aanvraag')
    expect(naar?.waarde).toMatchObject({ organisatie_id: null, eigenaar_wachtwoord_hash: null })
    expect(naar?.filters).toContainEqual(['eq', 'status', 'inrichten'])
    expect(vragen.some((v) => v.actie === 'update' && (v.waarde as { status?: string }).status === 'wacht_op_betaling')).toBe(false)
    expect(vragen.some((v) => v.actie === 'update' && (v.waarde as { status?: string }).status === 'actief')).toBe(false)
    expect(d.welkom).not.toHaveBeenCalled()
    expect(meld).toHaveBeenCalledTimes(1)
    expect(String((meld.mock.calls[0] as unknown[])[0])).not.toContain('s@b.nl')
  })
  it('het webhook-event van zo een aanmelding telt als verwerkt (idempotent, geen eindeloze herhaling)', async () => {
    const { admin, vragen } = db(rij())
    expect(await verwerkEvent(admin, { soort: 'sessie_afgerond', id: 'evt_9', sessie }, deps({ ok: false, reden: 'email_bezet' }))).toBe('ok')
    expect(vragen.some((v) => v.tabel === 'ayg_stripe_events' && v.actie === 'delete')).toBe(false)
  })
  it('een vastgelopen inrichting ruimt eerst de halve sportschool op', async () => {
    const oud = new Date(NU.getTime() - 60 * 60_000).toISOString()
    const { admin } = db(rij({ status: 'inrichten', organisatie_id: ORG, bijgewerkt_op: oud }))
    const d = deps()
    expect(await verwerkSessie(admin, sessie, d)).toBe('ingericht')
    expect(d.ruimOp).toHaveBeenCalledWith(admin, ORG)
  })
  it('een inrichting die net bezig is, laten we met rust', async () => {
    const { admin } = db(rij({ status: 'inrichten', organisatie_id: ORG }))
    const d = deps()
    expect(await verwerkSessie(admin, sessie, d)).toBe('klaar')
    expect(d.ruimOp).not.toHaveBeenCalled()
  })
})

describe('verwerkEvent', () => {
  const event = { soort: 'sessie_afgerond' as const, id: 'evt_1', sessie }
  it('een dubbel event wordt overgeslagen', async () => {
    const { admin, vragen } = db(rij(), true, { code: '23505', message: 'dubbel' })
    const d = deps()
    expect(await verwerkEvent(admin, event, d)).toBe('dubbel')
    expect(d.maakSportschool).not.toHaveBeenCalled()
    expect(vragen).toHaveLength(1)
  })
  it('bij een fout wordt de claim vrijgegeven', async () => {
    const { admin, vragen } = db(rij())
    expect(await verwerkEvent(admin, event, deps({ ok: false }))).toBe('fout')
    expect(vragen.some((v) => v.tabel === 'ayg_stripe_events' && v.actie === 'delete')).toBe(true)
  })
  it('een statuswijziging past alleen een lopend abonnement aan', async () => {
    const { admin, vragen } = db(rij({ status: 'actief', stripe_subscription_id: 'sub_1' }))
    expect(await verwerkEvent(admin, { soort: 'betaling_mislukt', id: 'evt_2', abonnementId: 'sub_1' }, deps())).toBe('ok')
    const update = vragen.find((v) => v.actie === 'update')
    expect(update?.waarde).toMatchObject({ status: 'betaling_mislukt' })
    expect(update?.filters).toContainEqual(['eq', 'status', 'actief'])
  })
  it('het testaccount verandert nooit door Stripe', async () => {
    const { admin, vragen } = db(rij({ status: 'test', stripe_subscription_id: 'sub_1' }))
    expect(await verwerkEvent(admin, { soort: 'abonnement_weg', id: 'evt_3', abonnementId: 'sub_1' }, deps())).toBe('ok')
    expect(vragen.some((v) => v.actie === 'update')).toBe(false)
  })
})

describe('pakketten via Stripe (losse pakketten, besluit Kane 29-10-2026)', () => {
  const env = { AIYOURGYM_STRIPE_PRIJS_LESSEN: 'price_lessen01', AIYOURGYM_STRIPE_PRIJS_GROEI: 'price_groei001' }
  function metEnv<T>(f: () => Promise<T>): Promise<T> {
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
    return f().finally(() => vi.unstubAllEnvs())
  }
  const lopend = () => db(rij({ status: 'actief', stripe_subscription_id: 'sub_1', organisatie_id: ORG }))

  it('een wijziging van het abonnement zet precies de afgenomen pakketten', async () => {
    const { admin, vragen } = lopend()
    const uit = await metEnv(() => verwerkEvent(admin, { soort: 'abonnement', id: 'evt_7', abonnementId: 'sub_1', stripeStatus: 'active', prijzen: ['price_groei001', 'price_lessen01'] }, deps()))
    expect(uit).toBe('ok')
    const org = vragen.find((v) => v.tabel === 'club_organisaties' && v.actie === 'update')
    // De basis staat er altijd in (besluit Kane 31-10-2026), ook als Stripe alleen add-ons noemt.
    expect(org?.waarde).toMatchObject({ pakketten: ['administratie', 'lessen', 'groei'] })
    expect(org?.filters).toContainEqual(['eq', 'id', ORG])
    expect(vragen.some((v) => v.tabel === 'ayg_aanmeldingen' && v.actie === 'update' && JSON.stringify((v.waarde as { pakketten?: unknown }).pakketten) === '["administratie","lessen","groei"]')).toBe(true)
  })
  it('twee keer hetzelfde event: dezelfde vaste lijst (idempotent, nooit optellen)', async () => {
    const een = lopend()
    const twee = lopend()
    const e = { soort: 'abonnement' as const, id: 'evt_8', abonnementId: 'sub_1', stripeStatus: 'active', prijzen: ['price_lessen01'] }
    await metEnv(() => verwerkEvent(een.admin, e, deps()))
    await metEnv(() => verwerkEvent(twee.admin, e, deps()))
    const lijst = (v: Vraag[]) => v.filter((x) => x.tabel === 'club_organisaties').map((x) => (x.waarde as { pakketten?: unknown }).pakketten)
    expect(lijst(een.vragen)).toEqual([['administratie', 'lessen']])
    expect(lijst(twee.vragen)).toEqual([['administratie', 'lessen']])
  })
  it('een onbekende prijs verandert niets aan de pakketten', async () => {
    const { admin, vragen } = lopend()
    await metEnv(() => verwerkEvent(admin, { soort: 'abonnement', id: 'evt_9', abonnementId: 'sub_1', stripeStatus: 'active', prijzen: ['price_lessen01', 'price_vreemd99'] }, deps()))
    expect(vragen.some((v) => v.tabel === 'club_organisaties')).toBe(false)
  })
  it('een oude bundelprijs (AIYOURGYM_STRIPE_PRIJS_ALLES) is onbekend: niets veranderen, ook met env (geen bundel meer)', async () => {
    vi.stubEnv('AIYOURGYM_STRIPE_PRIJS_ALLES', 'price_alles001')
    const { admin, vragen } = lopend()
    await metEnv(() => verwerkEvent(admin, { soort: 'abonnement', id: 'evt_12', abonnementId: 'sub_1', stripeStatus: 'active', prijzen: ['price_alles001'] }, deps()))
    expect(vragen.some((v) => v.tabel === 'club_organisaties')).toBe(false)
  })
  it('vijf losse regels: precies die vijf', async () => {
    const vijf = { AIYOURGYM_STRIPE_PRIJS_ADMINISTRATIE: 'price_admin001', AIYOURGYM_STRIPE_PRIJS_TRAINING: 'price_train001', AIYOURGYM_STRIPE_PRIJS_AFSPRAKEN: 'price_afspr001', AIYOURGYM_STRIPE_PRIJS_TEAM: 'price_team0001' }
    for (const [k, v] of Object.entries(vijf)) vi.stubEnv(k, v)
    const { admin, vragen } = lopend()
    await metEnv(() => verwerkEvent(admin, { soort: 'abonnement', id: 'evt_13', abonnementId: 'sub_1', stripeStatus: 'active', prijzen: ['price_admin001', 'price_lessen01', 'price_train001', 'price_afspr001', 'price_team0001'] }, deps()))
    const org = vragen.find((v) => v.tabel === 'club_organisaties' && v.actie === 'update')
    expect(org?.waarde).toMatchObject({ pakketten: ['administratie', 'lessen', 'training', 'afspraken', 'team'] })
  })
  it('zonder regels (oud event) blijven de pakketten zoals ze zijn', async () => {
    const { admin, vragen } = lopend()
    await metEnv(() => verwerkEvent(admin, { soort: 'abonnement', id: 'evt_10', abonnementId: 'sub_1', stripeStatus: 'active', prijzen: [] }, deps()))
    expect(vragen.some((v) => v.tabel === 'club_organisaties')).toBe(false)
  })
})

describe('claimInrichten bij een bezet adres', () => {
  it('een unieke-index-fout zet de aanmelding op aanvraag en richt niets in', async () => {
    const { vragen, admin } = nepSupabase((v: Vraag) => {
      if (v.tabel === 'ayg_aanmeldingen' && v.actie === 'select') return ok(rij())
      if (v.tabel === 'ayg_aanmeldingen' && v.actie === 'update' && (v.waarde as { status?: string }).status === 'inrichten') return { data: null, error: { code: '23505', message: 'dubbel' } }
      return ok([{ id: ID }])
    })
    const d = deps()
    expect(await verwerkSessie(admin, sessie, d)).toBe('klaar')
    expect(d.maakSportschool).not.toHaveBeenCalled()
    expect(vragen.some((v) => v.actie === 'update' && (v.waarde as { status?: string }).status === 'aanvraag')).toBe(true)
  })
})
