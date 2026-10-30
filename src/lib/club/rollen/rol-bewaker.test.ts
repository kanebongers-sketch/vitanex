// Bewaker (rollen v2): wie er binnen is en wat hij mag, beslist alleen
// src/lib/club/rollen/ (wie.ts: isEigenaar, isLeiding, isMedewerkerSessie,
// v2Minstens). Een losse vergelijking `t.rol === ...` elders omzeilt de rollen
// van het profiel en is daarom verboden.

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(__dirname, '../../../..')
const MAPPEN = ['src/lib/club', 'src/components/club', 'src/app/(aiyourgym)', 'src/lib/aiyourgym', 'src/components/aiyourgym']
const TOEGESTAAN = path.join(ROOT, 'src/lib/club/rollen')
const VERBODEN = /\bt\.rol\s*[!=]==?/

function bestanden(map: string): string[] {
  if (!fs.existsSync(map)) return []
  return fs.readdirSync(map, { recursive: true, withFileTypes: true })
    .filter((f) => f.isFile() && /\.(ts|tsx)$/.test(f.name) && !/\.test\.tsx?$/.test(f.name))
    .map((f) => path.join(f.parentPath, f.name))
}

describe('rol-bewaker', () => {
  it('geen t.rol === buiten src/lib/club/rollen/', () => {
    const fout: string[] = []
    for (const m of MAPPEN) {
      for (const b of bestanden(path.join(ROOT, m))) {
        if (b.startsWith(TOEGESTAAN)) continue
        fs.readFileSync(b, 'utf8').split('\n').forEach((regel, i) => {
          if (VERBODEN.test(regel)) fout.push(`${path.relative(ROOT, b)}:${i + 1}`)
        })
      }
    }
    expect(fout).toEqual([])
  })

  it('de bewaker vangt het echt', () => {
    expect(VERBODEN.test("if (t.rol === 'eigenaar')")).toBe(true)
    expect(VERBODEN.test("t.rol !== 'medewerker'")).toBe(true)
    expect(VERBODEN.test('isEigenaar(t)')).toBe(false)
  })
})
