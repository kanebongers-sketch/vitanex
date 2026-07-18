import { afterEach, describe, expect, it, vi } from 'vitest'
import { luisterOpWijziging, meldWijziging } from '@/lib/lifeos/events'

// De listeners leven op module-niveau; elke test meldt zich netjes af via de
// teruggegeven opzeg-functie, zodat tests elkaar niet beïnvloeden.

describe('events — signaal tussen kaarten', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('roept een luisteraar aan bij een melding op hetzelfde kanaal', () => {
    const fn = vi.fn()
    const stop = luisterOpWijziging('taken', fn)
    meldWijziging('taken')
    expect(fn).toHaveBeenCalledTimes(1)
    stop()
  })

  it('roept een luisteraar NIET aan voor een ander kanaal', () => {
    const fn = vi.fn()
    const stop = luisterOpWijziging('taken', fn)
    meldWijziging('notities')
    expect(fn).not.toHaveBeenCalled()
    stop()
  })

  it('roept meerdere luisteraars op hetzelfde kanaal allemaal aan', () => {
    const a = vi.fn()
    const b = vi.fn()
    const stopA = luisterOpWijziging('welzijn', a)
    const stopB = luisterOpWijziging('welzijn', b)
    meldWijziging('welzijn')
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
    stopA()
    stopB()
  })

  it('stopt met aanroepen na afmelden', () => {
    const fn = vi.fn()
    const stop = luisterOpWijziging('taken', fn)
    stop()
    meldWijziging('taken')
    expect(fn).not.toHaveBeenCalled()
  })

  it('meldt zonder luisteraars zonder te crashen', () => {
    expect(() => meldWijziging('notities')).not.toThrow()
  })

  // Een luisteraar die zich tijdens de melding afmeldt mag de iteratie niet breken.
  it('overleeft een luisteraar die zich tijdens de melding afmeldt', () => {
    const b = vi.fn()
    let stopA = () => {}
    const a = vi.fn(() => stopA())
    stopA = luisterOpWijziging('taken', a)
    const stopB = luisterOpWijziging('taken', b)
    expect(() => meldWijziging('taken')).not.toThrow()
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
    stopB()
  })
})
