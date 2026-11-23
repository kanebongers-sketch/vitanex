import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, test } from 'vitest'
import { LINK_ROLLEN, zietCoach } from '@/lib/lifeos/leads/links'

// Bewaker (besluit Kane 23-11-2026, "Dit is NOOIT de bedoeling"): een PT'er ziet
// NOOIT iets van de coachgesprekken: geen verslag, scores, notities, feedback of
// aandachtspunten. Deze test faalt als code die verslagen of aandachtspunten leest
// op een nieuwe plek opduikt, of als de PT-app ze aan een PT'er zou kunnen tonen.
// Een nieuwe plek toevoegen mag alleen als die plek alleen voor Kane of de eigenaren is.

const SRC = join(__dirname, '..', '..', '..')
const LEES_MODULES = /['"]@\/lib\/lifeos\/pt-coaching\/(opslag|coach-team|verslag-bouw)['"]/

/** Wie verslagen of aandachtspunten mag lezen, met de reden waarom geen PT'er erbij kan. */
const TOEGESTAAN: Record<string, string> = {
  'app/api/lifeos/pt-coaching/route.ts': 'LifeOS: alleen het founder-account van Kane',
  'app/api/lifeos/pt-coaching/[id]/pdf/route.ts': 'LifeOS: alleen het founder-account van Kane',
  'app/api/lifeos/pt-gesprekken/route.ts': 'LifeOS: alleen het founder-account van Kane',
  'app/api/lifeos/pt-gesprekken/afronden/route.ts': 'LifeOS: alleen het founder-account van Kane',
  'app/api/cron/dagplanning-mail/route.ts': 'cron, mailt alleen naar Kane',
  'app/api/pt/[code]/coaching/[id]/pdf/route.ts': 'PT-app, met zietCoach (eigenaren en beheerder)',
  'components/lifeos/pt-eigenaar/EigenaarCoach.tsx': 'alleen op /coach na zietCoach',
  'lib/lifeos/weekmail/coach-week-ophalen.ts': 'weekmail, alleen naar Kane',
  'lib/lifeos/pt-coaching/coach-team.ts': 'bouwsteen van EigenaarCoach en de weekmail',
  'lib/lifeos/pt-coaching/verslag-bouw.ts': 'bouwsteen van de pdf-routes hierboven',
}

function bestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam)
    if (statSync(pad).isDirectory()) return naam === 'node_modules' ? [] : bestanden(pad)
    return /\.(ts|tsx)$/.test(naam) && !/\.test\.tsx?$/.test(naam) ? [pad] : []
  })
}

const lees = (pad: string) => readFileSync(join(SRC, pad), 'utf8')

describe('een PT\'er ziet nooit feedback uit coachgesprekken', () => {
  test('alleen eigenaren en de beheerder zien coachgesprekken', () => {
    expect(LINK_ROLLEN.filter(zietCoach)).toEqual(['eigenaar', 'beheerder'])
  })

  test('verslagen en aandachtspunten worden alleen op goedgekeurde plekken gelezen', () => {
    const lezers = bestanden(SRC)
      .filter((pad) => LEES_MODULES.test(readFileSync(pad, 'utf8')))
      .map((pad) => relative(SRC, pad).split('\\').join('/'))
      .sort()
    expect(lezers.filter((p) => !(p in TOEGESTAAN))).toEqual([])
  })

  test('LifeOS-routes vragen het founder-account, de cron een geheim', () => {
    for (const pad of Object.keys(TOEGESTAAN).filter((p) => p.startsWith('app/api/lifeos/'))) {
      expect(lees(pad), pad).toMatch(/vereisLifeosToegang\(req\)/)
    }
    expect(lees('app/api/cron/dagplanning-mail/route.ts')).toMatch(/LIFEOS_DAGPLANNING_MAIL/)
  })

  test('de PT-app toont coachgesprekken alleen na zietCoach', () => {
    expect(lees('app/api/pt/[code]/coaching/[id]/pdf/route.ts')).toMatch(/if \(!zietCoach\(r\.link\.rol\)\)/)
    const coach = lees('app/(hoofd)/[pt]/coach/page.tsx')
    expect(coach).toMatch(/if \(!zietCoach\(s\.link\.rol\)\) notFound\(\)/)
    expect(coach).not.toMatch(/haalOpenPunten|CoachPunten|OpenPunt\b/)
  })

  test('een PT\'er heeft geen tab Coach', () => {
    expect(lees('components/lifeos/pt-dashboard/PtNav.tsx')).toMatch(/const ITEMS: Item\[\] = BASIS\.filter\(\(i\) => i\.pad !== '\/coach'\)/)
  })

  test('mails met verslagen gaan alleen naar Kane', () => {
    expect(lees('lib/lifeos/pt-coaching/verslag-mail.ts')).toMatch(/to: ontvanger\(\)/)
    expect(lees('lib/lifeos/pt-coaching/verslag-mail.ts')).toMatch(/LIFEOS_DAGPLANNING_MAIL/)
  })
})
