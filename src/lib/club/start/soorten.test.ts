import { describe, expect, it } from 'vitest'
import { MODULES } from '@/lib/club/kern/organisatie'
import { MEDEWERKER_ROLLEN } from '@/lib/club/kern/medewerker'
import { ONDERDEEL_SLEUTELS, leesOrgInstellingenInvoer, orgInstellingenUitRij } from '@/lib/club/kern/org-instellingen'
import { REGEL_DEFINITIES, REGEL_SLEUTELS } from '@/lib/club/rooster/regels'
import { controleerOpeningstijden } from '@/lib/club/rooster/openingstijden'
import { LESTYPE_SCHEMA, leesNieuw, leesRegelsInvoer } from '@/lib/club/instellingen/validatie'
import { leesHuisstijl } from '@/lib/club/kern/organisatie-invoer'
import {
  MODULE_ONDERDELEN,
  SOORT_INFO,
  SPORTSCHOOL_SOORTEN,
  STANDAARD_TIJD,
  isSportschoolSoort,
  klaargezet,
  voorstelLestypen,
  onderdelenTekst,
  pakketVoor,
  rechtenTekst,
  rechtenVoor,
  standaardWeek,
  toepasPlan,
  weekMet,
  weekTekst,
} from './soorten'

const T = (van: string, tot: string) => ({ van, tot })

describe('soorten sportschool', () => {
  it('heeft zeven soorten met een titel en uitleg', () => {
    expect(SPORTSCHOOL_SOORTEN).toEqual(['gym', 'boutique', 'pt', 'keten', 'yoga', 'vechtsport', 'bootcamp'])
    for (const s of SPORTSCHOOL_SOORTEN) {
      expect(SOORT_INFO[s].titel.length).toBeGreaterThan(2)
      expect(SOORT_INFO[s].kort.length).toBeGreaterThan(10)
    }
  })

  it('herkent alleen bekende soorten', () => {
    expect(isSportschoolSoort('yoga')).toBe(true)
    expect(isSportschoolSoort('zwembad')).toBe(false)
    expect(isSportschoolSoort(3)).toBe(false)
  })

  it('heeft voor elke module de bijbehorende onderdelen', () => {
    for (const m of MODULES) {
      expect(MODULE_ONDERDELEN[m].length, m).toBeGreaterThan(0)
      for (const o of MODULE_ONDERDELEN[m]) expect(ONDERDEEL_SLEUTELS as readonly string[]).toContain(o)
    }
  })
})

describe('openingstijden', () => {
  it('maakt de standaardweek van 06:00 tot 23:00', () => {
    expect(STANDAARD_TIJD).toEqual(T('06:00', '23:00'))
    expect(standaardWeek()).toEqual(Array(7).fill(T('06:00', '23:00')))
  })

  it('beschrijft een week in gewone taal', () => {
    expect(weekTekst(standaardWeek())).toBe('Elke dag 06:00 tot 23:00')
    expect(weekTekst(weekMet(T('07:00', '21:00'), T('08:00', '14:00'), null))).toBe('Ma tot vr 07:00 tot 21:00, za 08:00 tot 14:00, zo dicht')
    expect(weekTekst(weekMet(T('07:00', '21:00'), T('09:00', '13:00')))).toBe('Ma tot vr 07:00 tot 21:00, za en zo 09:00 tot 13:00')
    expect(weekTekst(weekMet(null))).toBe('Elke dag dicht')
  })
})

describe('startpakket per soort', () => {
  it.each(SPORTSCHOOL_SOORTEN)('%s: geldig voor dezelfde controles als de API', (soort) => {
    const p = pakketVoor(soort)
    // Onderdelen
    expect(leesHuisstijl({ naam: 'Test', slogan: '', kleurAccent: '#B58E5C', thema: 'donker', uit: p.uit }).ok).toBe(true)
    // Openingstijden en regels (PUT /api/club/instellingen/regels)
    expect(controleerOpeningstijden(p.openingstijden).ok).toBe(true)
    expect(leesRegelsInvoer({ vestiging: 'budel', regels: p.regels, openingstijden: p.openingstijden }).ok).toBe(true)
    for (const s of REGEL_SLEUTELS) {
      expect(p.regels[s]).toBeGreaterThanOrEqual(REGEL_DEFINITIES[s].min)
      expect(p.regels[s]).toBeLessThanOrEqual(REGEL_DEFINITIES[s].max)
    }
    // Lestypen (POST /api/club/instellingen/lestypen)
    for (const l of p.lestypen) {
      expect(leesNieuw({ naam: l.naam, omschrijving: l.omschrijving, soort: l.soort, duurMin: l.duurMin, intensiteit: l.intensiteit }, LESTYPE_SCHEMA, { actief: true }).ok, l.naam).toBe(true)
    }
    // Rechten (PATCH /api/club/organisatie/instellingen)
    const huidig = orgInstellingenUitRij(null, ONDERDEEL_SLEUTELS)
    expect(leesOrgInstellingenInvoer({ rechten: p.rechten }, huidig, ONDERDEEL_SLEUTELS).ok).toBe(true)
    // Voorgestelde lessen horen bij de lestypen van het pakket
    for (const les of p.lessen) expect(p.lestypen.map((l) => l.naam)).toContain(les.lestype)
  })

  it('geeft een PT-studio lessen die bij personal training passen', () => {
    const p = pakketVoor('pt')
    const namen = p.lestypen.map((l) => l.naam)
    expect(p.uit).not.toContain('rooster')
    expect(namen).toEqual(['Small group training', 'Personal training', 'Kracht in de groep', 'Circuittraining', 'Intake'])
    for (const fout of ['Spinning', 'Dance fitness', 'Yoga']) expect(namen).not.toContain(fout)
    expect(p.lessen.length).toBeGreaterThan(0)
    expect(p.openingstijden[6]).toBeNull()
  })

  it('stelt ook lestypen voor als de groepslessen uit staan', () => {
    expect(voorstelLestypen('pt').map((l) => l.naam)).toContain('Small group training')
    expect(voorstelLestypen('yoga').map((l) => l.naam)).toContain('Yin yoga')
  })

  it('geeft een fitnessclub en een keten alles aan en de standaardtijden', () => {
    for (const s of ['gym', 'keten'] as const) {
      const p = pakketVoor(s)
      expect(p.uit).toEqual([])
      expect(p.openingstijden).toEqual(standaardWeek())
    }
    expect(pakketVoor('keten').lestypen.length).toBeGreaterThan(pakketVoor('gym').lestypen.length)
  })

  it('geeft yoga en vechtsport hun eigen lestypen', () => {
    expect(pakketVoor('yoga').lestypen.map((l) => l.naam)).toContain('Yin yoga')
    expect(pakketVoor('vechtsport').lestypen.map((l) => l.naam)).toContain('Kickboksen')
    expect(pakketVoor('gym').lestypen.map((l) => l.naam)).not.toContain('Kickboksen')
  })

  it('maakt reserveren strenger bij een boutique studio', () => {
    expect(pakketVoor('boutique').regels.annuleerUren).toBeGreaterThan(pakketVoor('gym').regels.annuleerUren)
  })

  it('geeft geen pakket dat naar een gedeeld object verwijst', () => {
    const a = pakketVoor('gym')
    a.uit.push('leden')
    expect(pakketVoor('gym').uit).toEqual([])
  })
})

describe('rechten', () => {
  it('haalt onderdelen van modules die uit staan weg', () => {
    const r = rechtenVoor(['rooster', 'training'])
    for (const rol of MEDEWERKER_ROLLEN) {
      expect(r[rol]).not.toContain('rooster')
      expect(r[rol]).not.toContain('schemas')
    }
    expect(r.trainer).toContain('leden')
  })

  it('geeft de instructeur bij lesstudio\'s ook check-in en leden', () => {
    expect(pakketVoor('yoga').rechten.instructeur).toEqual(expect.arrayContaining(['rooster', 'checkin', 'leden']))
    expect(pakketVoor('gym').rechten.instructeur).not.toContain('checkin')
  })

  it('heeft geen dubbele onderdelen', () => {
    for (const s of SPORTSCHOOL_SOORTEN) {
      const r = pakketVoor(s).rechten
      for (const rol of MEDEWERKER_ROLLEN) expect(new Set(r[rol]).size).toBe(r[rol].length)
    }
  })
})

describe('klaargezet', () => {
  it('beschrijft wat er klaar staat', () => {
    const regels = klaargezet(pakketVoor('boutique'))
    expect(regels.map((r) => r.sleutel)).toEqual(['onderdelen', 'lestypen', 'openingstijden', 'reserveren', 'rechten'])
    expect(regels.find((r) => r.sleutel === 'reserveren')?.tekst).toContain('12 uur')
  })

  it('laat reserveren weg zonder groepslessen', () => {
    const regels = klaargezet({ ...pakketVoor('gym'), uit: ['rooster'], lestypen: [], lessen: [] })
    expect(regels.map((r) => r.sleutel)).not.toContain('reserveren')
    expect(regels.find((r) => r.sleutel === 'lestypen')?.tekst).toContain('Geen groepslessen')
  })

  it('schrijft onderdelen en rechten leesbaar', () => {
    expect(onderdelenTekst([])).toBe('Alle 10 onderdelen staan aan.')
    expect(onderdelenTekst(['taken', 'training'])).toBe('8 van de 10 onderdelen aan. Uit: taken en poetslijsten en training.')
    expect(rechtenTekst(pakketVoor('gym').rechten)).toMatch(/^Trainers zien \d+ onderdelen, groepslesinstructeurs \d+, clubmanagers \d+ en de administratie \d+\. Jij als eigenaar ziet alles\.$/)
  })

  it('gebruikt geen gedachtestreepjes of klemtoon-accenten', () => {
    const teksten = [
      ...SPORTSCHOOL_SOORTEN.flatMap((s) => [SOORT_INFO[s].titel, SOORT_INFO[s].kort, ...klaargezet(pakketVoor(s)).map((r) => r.tekst)]),
      ...SPORTSCHOOL_SOORTEN.flatMap((s) => pakketVoor(s).lestypen.map((l) => l.omschrijving)),
    ]
    for (const t of teksten) expect(t, t).not.toMatch(/[–—]| - |[éèëáíóúÉÁ]/)
  })
})

describe('toepasPlan', () => {
  const p = pakketVoor('gym')

  it('zet tijden alleen bij vestigingen zonder tijden en voegt alleen nieuwe lestypen toe', () => {
    const plan = toepasPlan(p, [{ sleutel: 'budel', heeftTijden: true }, { sleutel: 'eersel', heeftTijden: false }], ['spinning', 'HIIT '])
    expect(plan.vestigingen).toEqual(['eersel'])
    expect(plan.lestypen.map((l) => l.naam)).not.toContain('Spinning')
    expect(plan.lestypen.map((l) => l.naam)).not.toContain('HIIT')
    expect(plan.lestypen.length).toBe(p.lestypen.length - 2)
    expect(plan.uit).toEqual(p.uit)
    expect(plan.rechten).toEqual(p.rechten)
  })

  it('doet niets dubbel als alles er al is', () => {
    const plan = toepasPlan(p, [{ sleutel: 'budel', heeftTijden: true }], p.lestypen.map((l) => l.naam))
    expect(plan.vestigingen).toEqual([])
    expect(plan.lestypen).toEqual([])
  })
})
