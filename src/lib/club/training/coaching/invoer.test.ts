import { describe, expect, it } from 'vitest'
import { coachingUitRij, leesCoaching } from './invoer'
import { COACHING_BOEKEN } from './index'

const GOED = {
  kernpunten: [
    { punt: 'Rug recht', uitleg: 'Je onderrug blijft neutraal.' },
    { punt: 'Knieen niet op slot', uitleg: 'Een kleine buiging houdt spanning op de spier.' },
    { punt: 'Rustig omlaag', uitleg: 'Twee tellen terug, dan voel je het meest.' },
  ],
  opstelling: ['Stel de stoel zo in dat je knie bij het draaipunt zit.'],
  stappen: ['Duw rustig omhoog.', 'Laat gecontroleerd zakken.'],
  fouten: [
    { fout: 'Billen komen los', beter: 'Trek jezelf in de stoel met de handvatten.' },
    { fout: 'Te snel', beter: 'Twee tellen omlaag.' },
  ],
  ademhaling: 'Uitademen bij het duwen, inademen bij het zakken.',
  tempo: '2 tellen omlaag, 1 tel omhoog',
}

describe('leesCoaching', () => {
  it('neemt geldige coaching over en schoont spaties', () => {
    const u = leesCoaching({ ...GOED, ademhaling: '  Uitademen   bij duwen. ', makkelijker: ' ' })
    expect(u.ok).toBe(true)
    if (!u.ok) return
    expect(u.waarde.ademhaling).toBe('Uitademen bij duwen.')
    expect(u.waarde.makkelijker).toBeUndefined()
  })

  it('laat lege regels weg en telt pas daarna', () => {
    const u = leesCoaching({ ...GOED, kernpunten: [...GOED.kernpunten, { punt: ' ', uitleg: '' }] })
    expect(u.ok && u.waarde.kernpunten.length).toBe(3)
  })

  it('weigert te weinig kernpunten, een fout zonder correctie of een te lang punt', () => {
    expect(leesCoaching({ ...GOED, kernpunten: GOED.kernpunten.slice(0, 2) })).toMatchObject({ ok: false, fout: expect.stringContaining('Kernpunten') })
    expect(leesCoaching({ ...GOED, fouten: [GOED.fouten[0], { fout: 'Te snel', beter: '' }] }).ok).toBe(false)
    expect(leesCoaching({ ...GOED, kernpunten: [{ punt: 'x'.repeat(33), uitleg: 'a' }, ...GOED.kernpunten.slice(1)] }).ok).toBe(false)
    expect(leesCoaching({ ...GOED, tempo: '' }).ok).toBe(false)
    expect(leesCoaching('tekst').ok).toBe(false)
  })

  it('accepteert alle standaardcoaching (zelfde regels)', () => {
    for (const boek of COACHING_BOEKEN) for (const c of Object.values(boek)) expect(leesCoaching(c).ok).toBe(true)
  })

  it('leest opgeslagen coaching alleen als die geldig is', () => {
    expect(coachingUitRij(null)).toBeNull()
    expect(coachingUitRij({ kernpunten: [] })).toBeNull()
    expect(coachingUitRij(GOED)?.tempo).toBe(GOED.tempo)
  })
})
