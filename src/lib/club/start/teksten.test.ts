import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as start from '@/lib/aiyourgym/taal/woorden/club/start'
import * as startLib from '@/lib/aiyourgym/taal/woorden/club/start-lib'

// Een nieuwe sportschool loopt de startwizard, het inlezen van leden en het
// uitnodigen van het team zelf door. Wat daar op het scherm staat mag niet
// verwijzen naar de oude inlog (inloglink met pincode, controlecode), naar het platform
// (Kane, testomgeving, presentatie) of naar Fit Factory en zijn vestigingen.
// We kijken naar de code zonder commentaar.

const MAPPEN = ['src/components/club/start', 'src/lib/club/start', 'src/components/club/leden/import', 'src/lib/club/leden/import']
const LOSSE = [
  'src/app/(aiyourgym)/(club)/club/start/page.tsx',
  'src/app/(aiyourgym)/(club)/club/leden/importeren/page.tsx',
  'src/components/club/instellingen/MedewerkerLogin.tsx',
  'src/lib/club/kern/instel-paginas.ts',
  // De teksten van de wizard staan sinds de twee talen in woordenboeken (Nederlands en Engels).
  'src/lib/aiyourgym/taal/woorden/club/start.ts',
  'src/lib/aiyourgym/taal/woorden/club/start-lib.ts',
]
const VERBODEN = /pincode|controlecode|inloglink|vaste link|\bKane\b|Fit Factory|Budel|Eersel|presentatie|testomgeving/i
// Bestaande medewerkers van voor 23-10-2026 zien eerlijk dat ze nog met een pincode inloggen.
const UITZONDERING = /Nog met pincode|oude link en pincode/

// De wizard stelt alles meteen in: elke vorm van uitstel of wegsturen naar een andere plek is verboden.
const UITSTEL = /doe je later|pas je later|kies je later|stel je later|later verder|later doen|doe het later|of later\b|later aan te passen|later aan\b|is later|overslaan|kun je overslaan|in Instellingen|bij Instellingen|bij Medewerkers|instellingencentrum/i
const WIZARD = ['src/components/club/start', 'src/lib/club/start']
const WOORDENBOEKEN = ['src/lib/aiyourgym/taal/woorden/club/start.ts', 'src/lib/aiyourgym/taal/woorden/club/start-lib.ts']
// Hetzelfde in het Engels: geen later, skip of verwijzing naar Settings.
const UITSTEL_EN = /\blater\b|\bskip|in settings|settings centre/i

/** Het Engelse deel van een woordenboekbestand (alles na "  en: {"), ook de teksten in functies. */
function engelsDeel(pad: string): string {
  const bron = readFileSync(pad, 'utf8')
  const begin = bron.search(/\r?\n {2}en: \{/)
  return begin >= 0 ? bron.slice(begin) : ''
}

function wizardBestanden(): string[] {
  return [...WIZARD.flatMap((m) => readdirSync(m).filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.')).map((f) => join(m, f))), 'src/app/(aiyourgym)/(club)/club/start/page.tsx', ...WOORDENBOEKEN]
}

function zonderCommentaar(bron: string): string[] {
  return bron
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\r?\n/)
    .map((r) => r.replace(/(^|\s)\/\/.*$/, ''))
}

function bestanden(): string[] {
  const uitMappen = MAPPEN.flatMap((m) => readdirSync(m).filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.')).map((f) => join(m, f)))
  return [...uitMappen, ...LOSSE]
}

describe('teksten voor een nieuwe sportschool', () => {
  it('verwijzen niet naar pincodes, het platform of Fit Factory', () => {
    const fout = bestanden().flatMap((pad) =>
      zonderCommentaar(readFileSync(pad, 'utf8'))
        .map((regel, i) => ({ regel, i }))
        .filter(({ regel }) => VERBODEN.test(regel) && !UITZONDERING.test(regel) && !/LOGO_FIT_FACTORY|FitFactory/.test(regel))
        .map(({ regel, i }) => `${pad}:${i + 1}: ${regel.trim()}`),
    )
    expect(fout).toEqual([])
  })

  it('stellen niets uit: geen "doe je later", overslaan of verwijzing naar Instellingen (besluit Kane 23-10-2026)', () => {
    const fout = wizardBestanden().flatMap((pad) =>
      zonderCommentaar(readFileSync(pad, 'utf8'))
        .map((regel, i) => ({ regel, i }))
        .filter(({ regel }) => UITSTEL.test(regel))
        .map(({ regel, i }) => `${pad}:${i + 1}: ${regel.trim()}`),
    )
    expect(fout).toEqual([])
  })

  it('stellen ook in het Engels niets uit', () => {
    expect(startLib.START_LIB.en.stappen.huisstijl.titel).toBe('Branding')
    const fout = WOORDENBOEKEN.flatMap((pad) =>
      zonderCommentaar(engelsDeel(pad))
        .filter((regel) => UITSTEL_EN.test(regel))
        .map((regel) => `${pad}: ${regel.trim()}`),
    )
    expect(fout).toEqual([])
  })

  it('heeft Opslaan en stoppen en geen knop Overslaan in de voet', () => {
    const voet = zonderCommentaar(readFileSync('src/components/club/start/StartVoet.tsx', 'utf8')).join(' ')
    expect(voet).toMatch(/t\.opslaanStoppen/)
    expect(start.START.nl.voet.opslaanStoppen).toBe('Opslaan en stoppen')
    expect(start.START.en.voet.opslaanStoppen).toBe('Save and stop')
    expect(voet).not.toMatch(/overslaan|skip/i)
  })

  it('leggen de inlog van nu uit: uitnodiging per e-mail, daarna e-mailadres en wachtwoord', () => {
    const { live, team } = start.START.nl
    expect(live.inloggenUitleg).toMatch(/uitnodiging per e-mail/)
    expect(live.inloggenUitleg).toMatch(/e-mailadres en wachtwoord/)
    expect(live.ledenappUitleg).toMatch(/link of QR-code/)
    expect(team.inlogUitleg).toMatch(/e-mailadres en een wachtwoord/)
    expect(start.START.en.live.inloggenUitleg).toMatch(/invitation by email/)
    expect(start.START.en.team.inlogUitleg).toMatch(/email address and a password/)
    expect(readFileSync('src/components/club/start/StapLive.tsx', 'utf8')).toMatch(/t\.inloggenUitleg/)
    expect(readFileSync('src/components/club/start/TeamFormulier.tsx', 'utf8')).toMatch(/t\.inlogUitleg/)
  })
})
