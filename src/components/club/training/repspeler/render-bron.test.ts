import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { OEFENRENDERS } from '@/components/aiyourgym/inhoud/oefenrenders'
import { planVoor } from '@/lib/club/training/repspeler/plan'
import { standOp } from '@/lib/club/training/repspeler/tijdlijn'
import { frameSrc, inclusief, kiesMaat, leesRepRender, repRenderVoor } from './render-bron'

const MATEN = [{ breedte: 480 }, { breedte: 720 }, { breedte: 1080 }]

describe('inclusief', () => {
  it('halfopen naar inclusief', () => {
    expect(inclusief([6, 32], 72)).toEqual([6, 31])
    expect(inclusief([68, 72], 72)).toEqual([68, 71])
  })

  it('een lege fase houdt het beeld ervoor vast', () => {
    expect(inclusief([32, 32], 72)).toEqual([31, 31])
    expect(inclusief([0, 0], 72)).toEqual([0, 0])
  })

  it('altijd binnen de render', () => {
    fc.assert(
      fc.property(fc.integer({ min: -50, max: 400 }), fc.integer({ min: -50, max: 400 }), fc.integer({ min: 1, max: 300 }), (a, b, n) => {
        const [x, y] = inclusief([a, b], n)
        return x >= 0 && y >= x && y <= n - 1
      }),
    )
  })
})

describe('kiesMaat', () => {
  it('kiest de kleinste scherpe maat voor breedte maal pixeldichtheid', () => {
    expect(kiesMaat(MATEN, 360, 1)?.breedte).toBe(480)
    expect(kiesMaat(MATEN, 360, 2)?.breedte).toBe(720)
    expect(kiesMaat(MATEN, 390, 3)?.breedte).toBe(1080)
    expect(kiesMaat(MATEN, 700, 2)?.breedte).toBe(1080)
    expect(kiesMaat([], 300, 1)).toBeNull()
  })
})

describe('renders uit de website', () => {
  const metFrames = OEFENRENDERS.filter((r) => r.frames !== null)

  it('alleen een render met losse beelden telt', () => {
    for (const r of OEFENRENDERS) expect(leesRepRender(r) === null).toBe(r.frames === null)
  })

  it.each(metFrames.map((r) => [r.naam, r] as const))('%s: frames, fasen en adressen kloppen', (naam, r) => {
    const rep = repRenderVoor(naam)
    expect(rep).not.toBeNull()
    if (!rep) return
    expect(rep.maten.length).toBeGreaterThan(0)
    expect(frameSrc(rep, rep.maten[0], 0)).toContain(`/oefenbeelden/${r.slug}/frames/`)
    const plan = planVoor(rep, { herhalingen: '15', tijdSec: null, tempo: '3010' })
    if (plan.soort === 'herhaling') {
      // Besluit Kane 29-10-2026: 1 seconde heen en 1 terug, ook bij schematempo 3010.
      expect(plan.repDuur).toBe(2)
      expect(plan.totaal).toBe(30)
      expect(plan.segmenten.map((s) => [s.soort, s.duur])).toEqual([
        ['heen', 1],
        ['terug', 1],
      ])
    }
    for (let t = 0; t <= plan.totaal; t += 0.1) {
      const s = standOp(plan, t)
      expect(s.frame).toBeGreaterThanOrEqual(0)
      expect(s.frame).toBeLessThan(rep.frames)
    }
  })

  it('zonder render: null', () => {
    expect(repRenderVoor('Bestaat niet')).toBeNull()
  })
})

describe('wisselende render (besluit Kane 30-10-2026)', () => {
  const basis = OEFENRENDERS.find((r) => r.frames !== null && r.frames.fasenRechts === null)
  const fasenRechts = {
    rust_begin: [48, 49], heen: [49, 72], houden_ver: [72, 73], terug: [73, 95], rust_eind: [95, 96],
  } as const

  it('fasen rechts komen inclusief mee; zonder kanten blijft fasesRechts weg', () => {
    if (!basis?.frames) throw new Error('geen render met losse beelden')
    expect(leesRepRender(basis)?.fasesRechts).toBeUndefined()
    const wissel = { ...basis, frames: { ...basis.frames, aantal: 96, fasenRechts } }
    const rep = leesRepRender(wissel)
    expect(rep?.fasesRechts).toEqual({ rust_begin: [48, 48], heen: [49, 71], houden_ver: [72, 72], terug: [73, 94], rust_eind: [95, 95] })
  })

  it.each(OEFENRENDERS.filter((r) => r.frames?.fasenRechts).map((r) => [r.naam, r] as const))(
    '%s: links in de eerste helft, rechts in de tweede',
    (_naam, r) => {
      const f = r.frames
      if (!f?.fasenRechts) throw new Error('geen wisselende render')
      const half = f.aantal / 2
      expect(Number.isInteger(half)).toBe(true)
      expect(f.fasen.rust_eind[1]).toBe(half)
      expect(f.fasenRechts.rust_begin[0]).toBe(half)
      expect(f.fasenRechts.rust_eind[1]).toBe(f.aantal)
      const plan = planVoor(leesRepRender(r)!, { herhalingen: '10', tijdSec: null, tempo: null })
      expect(plan.soort === 'herhaling' && plan.segmentenRechts !== undefined).toBe(true)
    },
  )
})
