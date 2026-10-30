// ─── Club, rollen v2: de routekaart (alleen voor tests, leest de routemappen) ─
// Leest alle pagina's onder /club en alle API-mappen onder /api/club, met de
// sloten (eis...) die elke layout en pagina op het pad zet. Gebruikt door
// routekaart.test.ts en routes-per-rol.test.ts. Niet importeren in de app.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '../../../..')
export const CLUB_MAP = path.join(ROOT, 'src/app/(aiyourgym)/(club)/club')
export const API_MAP = path.join(ROOT, 'src/app/(aiyourgym)/api/club')

export interface Slot {
  naam: string
  /** De eerste en tweede tekst-parameter, of de naam van een constante. */
  args: string[]
}

export interface Pagina {
  /** Het pad binnen de app, bijvoorbeeld /club/beheer/team. */
  pad: string
  sloten: Slot[]
}

function slotenIn(bestand: string): Slot[] {
  if (!fs.existsSync(bestand)) return []
  // Zonder commentaar: een slot dat alleen in uitleg genoemd wordt, telt niet.
  const bron = fs.readFileSync(bestand, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const uit: Slot[] = []
  for (const m of bron.matchAll(/\b(eis[A-Z][A-Za-z]*)\(([^)]*)\)/g)) {
    const args = m[2].split(',').map((a) => a.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
    uit.push({ naam: m[1], args })
  }
  return uit
}

/** Alle pagina's onder /club met de sloten van de layouts op het pad en van de pagina zelf. */
export function clubPaginas(): Pagina[] {
  const uit: Pagina[] = []
  function loop(map: string, delen: string[], erfelijk: Slot[]) {
    const hier = [...erfelijk, ...slotenIn(path.join(map, 'layout.tsx'))]
    if (fs.existsSync(path.join(map, 'page.tsx'))) {
      uit.push({ pad: `/club${delen.length ? `/${delen.join('/')}` : ''}`, sloten: [...hier, ...slotenIn(path.join(map, 'page.tsx'))] })
    }
    for (const sub of fs.readdirSync(map, { withFileTypes: true })) {
      if (sub.isDirectory()) loop(path.join(map, sub.name), [...delen, sub.name], hier)
    }
  }
  loop(CLUB_MAP, [], [])
  return uit.sort((a, b) => a.pad.localeCompare(b.pad))
}

/** Alle mappen met een route.ts onder /api/club, als pad (/api/club/team/[id]). */
export function apiRoutes(): string[] {
  const uit: string[] = []
  function loop(map: string, delen: string[]) {
    if (fs.existsSync(path.join(map, 'route.ts'))) uit.push(`/api/club/${delen.join('/')}`)
    for (const sub of fs.readdirSync(map, { withFileTypes: true })) {
      if (sub.isDirectory()) loop(path.join(map, sub.name), [...delen, sub.name])
    }
  }
  loop(API_MAP, [])
  return uit.sort()
}

/** Een voorbeeldpad voor een dynamisch segment ([id] wordt een uuid). */
export function voorbeeldPad(pad: string): string {
  return pad.replace(/\[\.\.\.[^\]]+\]/g, 'x').replace(/\[[^\]]+\]/g, '00000000-0000-4000-8000-000000000001')
}
