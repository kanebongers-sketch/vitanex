import { describe, expect, it } from 'vitest'
import { besluitTelling, grensVan, huidigeHoeveelheid, telAbonnement, telAlles, type TelAbonnement, type TelDeps, type TelLog } from './staffel-telling'
import type { AbonnementRegel } from './pakket-wijziging'

const EIGEN = ['price_basis001', 'price_lessen01']
const A: TelAbonnement = { id: 'rij-1', organisatieId: 'org-1', vestiging: 'budel', abonnementId: 'sub_budel001' }

/** Een nepwereld: Stripe en de database in het geheugen, zodat we de cron twee keer kunnen draaien. */
function wereld(leden: number, start: number, status = 'active') {
  const stripe = {
    status,
    regels: [
      { id: 'si_basis', prijsId: 'price_basis001', aantal: start },
      { id: 'si_lessen', prijsId: 'price_lessen01', aantal: start },
      { id: 'si_vreemd', prijsId: 'price_vreemd1', aantal: 7 },
    ] as AbonnementRegel[],
  }
  const logs = new Map<string, TelLog>()
  const stripeAanroepen: { n: number; sleutel: string }[] = []
  const mails: { oud: number; nieuw: number }[] = []
  const meldingen: number[] = []
  const rij: Record<string, unknown> = {}
  const deps = (dag = '2026-10-31', extra: Partial<TelDeps> = {}): TelDeps => ({
    dag,
    eigen: EIGEN,
    alGeteld: async (id, d) => {
      const l = logs.get(`${id}|${d}`)
      return l !== undefined && l.uitkomst !== 'fout'
    },
    telLeden: async () => leden,
    haalRegels: async () => ({ status: stripe.status, regels: stripe.regels.map((r) => ({ ...r })) }),
    zetHoeveelheid: async (_id, regels, n, sleutel) => {
      stripeAanroepen.push({ n, sleutel })
      stripe.regels = stripe.regels.map((r) => (EIGEN.includes(r.prijsId) ? { ...r, aantal: n } : r))
      return regels.length > 0
    },
    schrijfLog: async (l) => {
      logs.set(`${l.abonnementId}|${l.dag}`, l)
      return true
    },
    werkRijBij: async (_id, v) => {
      Object.assign(rij, v)
    },
    meldOpMaat: async (_a, n) => {
      meldingen.push(n)
    },
    mailWissel: async (w) => {
      mails.push({ oud: w.oud, nieuw: w.nieuw })
      return true
    },
    ...extra,
  })
  return { stripe, logs, stripeAanroepen, mails, meldingen, rij, deps }
}

describe('dagelijkse telling per vestiging (besluit Kane 31-10-2026)', () => {
  it('pure regels: grens, huidige hoeveelheid en besluit', () => {
    expect(grensVan(84)).toBe(100)
    expect(grensVan(6000)).toBeNull()
    expect(grensVan(null)).toBeNull()
    expect(huidigeHoeveelheid([{ id: 'si_1', prijsId: 'price_basis001', aantal: 4 }, { id: 'si_2', prijsId: 'price_lessen01', aantal: 4 }], EIGEN)).toBe(4)
    expect(huidigeHoeveelheid([{ id: 'si_1', prijsId: 'price_basis001', aantal: 4 }, { id: 'si_2', prijsId: 'price_lessen01', aantal: 5 }], EIGEN)).toBeNull()
    expect(besluitTelling(84, 84)).toEqual({ soort: 'gelijk', n: 84 })
    expect(besluitTelling(0, 3)).toEqual({ soort: 'bijwerken', n: 1 })
    expect(besluitTelling(5001, 4000)).toEqual({ soort: 'op_maat' })
  })

  it('werkt de hoeveelheid bij zonder verrekening en mailt bij een andere staffel', async () => {
    const w = wereld(120, 84)
    expect(await telAbonnement(A, w.deps())).toBe('bijgewerkt')
    expect(w.stripeAanroepen).toEqual([{ n: 120, sleutel: 'ayg_staffel_sub_budel001_2026-10-31_120' }])
    // Een regel die niet van ons is, blijft zoals hij was.
    expect(w.stripe.regels.find((r) => r.id === 'si_vreemd')?.aantal).toBe(7)
    expect(w.mails).toEqual([{ oud: 84, nieuw: 120 }])
    expect(w.logs.get('sub_budel001|2026-10-31')).toMatchObject({ uitkomst: 'bijgewerkt', staffelOud: 100, staffelNieuw: 200, gemaild: true, actieveLeden: 120 })
    expect(w.rij).toMatchObject({ hoeveelheid: 120, actieveLeden: 120 })
  })

  it('idempotent: twee keer op dezelfde dag doet bij Stripe maar een keer iets', async () => {
    const w = wereld(120, 84)
    expect(await telAbonnement(A, w.deps())).toBe('bijgewerkt')
    expect(await telAbonnement(A, w.deps())).toBe('overgeslagen')
    expect(w.stripeAanroepen).toHaveLength(1)
    expect(w.mails).toHaveLength(1)
    // De volgende dag: alles staat al goed, dus niets naar Stripe.
    expect(await telAbonnement(A, w.deps('2026-11-01'))).toBe('gelijk')
    expect(w.stripeAanroepen).toHaveLength(1)
  })

  it('binnen dezelfde staffel: wel de hoeveelheid, geen mail', async () => {
    const w = wereld(90, 84)
    expect(await telAbonnement(A, w.deps())).toBe('bijgewerkt')
    expect(w.mails).toEqual([])
    expect(w.logs.get('sub_budel001|2026-10-31')?.gemaild).toBe(false)
  })

  it('omlaag gaat ook vanzelf, met een mail', async () => {
    const w = wereld(20, 84)
    expect(await telAbonnement(A, w.deps())).toBe('bijgewerkt')
    expect(w.mails).toEqual([{ oud: 84, nieuw: 20 }])
  })

  it('boven 5000 leden: niets automatisch, een melding voor Kane', async () => {
    const w = wereld(5001, 4000)
    expect(await telAbonnement(A, w.deps())).toBe('op_maat')
    expect(w.stripeAanroepen).toEqual([])
    expect(w.meldingen).toEqual([5001])
    expect(w.logs.get('sub_budel001|2026-10-31')?.uitkomst).toBe('op_maat')
  })

  it('een fout bij Stripe wordt gelogd en mag dezelfde dag opnieuw', async () => {
    const w = wereld(120, 84)
    expect(await telAbonnement(A, w.deps('2026-10-31', { zetHoeveelheid: async () => false }))).toBe('fout')
    expect(w.logs.get('sub_budel001|2026-10-31')?.uitkomst).toBe('fout')
    expect(w.mails).toEqual([])
    expect(await telAbonnement(A, w.deps())).toBe('bijgewerkt')
  })

  it('een opgezegd abonnement: niets bij Stripe, de rij gaat op opgezegd', async () => {
    const w = wereld(120, 84, 'canceled')
    expect(await telAbonnement(A, w.deps())).toBe('opgezegd')
    expect(w.stripeAanroepen).toEqual([])
    expect(w.rij).toMatchObject({ status: 'opgezegd' })
  })

  it('Stripe of de database niet bereikbaar: fout, niets veranderd', async () => {
    const w = wereld(120, 84)
    expect(await telAbonnement(A, w.deps('2026-10-31', { haalRegels: async () => null }))).toBe('fout')
    expect(await telAbonnement(A, w.deps('2026-10-31', { telLeden: async () => null }))).toBe('fout')
    expect(await telAbonnement(A, w.deps('2026-10-31', { alGeteld: async () => null }))).toBe('fout')
    expect(w.stripeAanroepen).toEqual([])
  })

  it('telAlles: een fout bij een abonnement stopt de rest niet', async () => {
    const w = wereld(120, 84)
    let keer = 0
    const verslag = await telAlles(
      [A, { ...A, id: 'rij-2', abonnementId: 'sub_eersel01' }],
      w.deps('2026-10-31', {
        telLeden: async () => {
          keer += 1
          if (keer === 1) throw new Error('kapot')
          return 120
        },
      }),
    )
    expect(verslag).toMatchObject({ fout: 1, bijgewerkt: 1 })
  })
})
