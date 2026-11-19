import { describe, expect, it, vi } from 'vitest'
import { REM_EMAIL, type Kandidaat } from './regels'
import { MELDING_GEEN_MAIL, MELDING_MAIL_MISLUKT, MELDING_OPSLAAN_MISLUKT, verwerkVergeten, type VergetenDeps } from './verwerk'

const EMAIL = 'sanne@gyma.nl'
const GYM = 'de000000-0000-4000-8000-0000000000c1'
const SANNE: Kandidaat = { naam: 'Sanne Bakker', email: EMAIL, organisatieId: GYM, actief: true, heeftWachtwoord: true }
const LOTTE: Kandidaat = { ...SANNE, naam: 'Lotte de Vries' }

type Deps = VergetenDeps<Kandidaat, Kandidaat>

/** Alles staat goed voor een eigenaar met een wachtwoord; elke test wijzigt een ding. */
function deps(extra: Partial<Deps> = {}): { [K in keyof Deps]: ReturnType<typeof vi.fn<Deps[K]>> } {
  const basis: Deps = {
    mailKlaar: () => true,
    isGeremd: async () => false,
    isPlatform: async () => false,
    vindBeheerder: async () => SANNE,
    vindMedewerker: async () => null,
    sportschool: async () => ({ naam: 'Gym A', slug: 'gyma' }),
    linkBeheerder: async () => ({ pad: '/clubinloggen/code-van-sanne' }),
    linkMedewerker: async () => ({ pad: '/clubinloggen/medewerker/token-van-lotte' }),
    url: (slug, pad) => `https://adres.test/${slug ?? ''}${pad}`,
    stuurMail: async () => 'verstuurd',
    meld: async () => undefined,
  }
  const alles = { ...basis, ...extra }
  return Object.fromEntries(Object.entries(alles).map(([naam, f]) => [naam, vi.fn(f as (...a: never[]) => unknown)])) as never
}

describe('wachtwoord vergeten: een bekend account', () => {
  it('een eigenaar of clubmanager krijgt een mail met een verse link naar de eigen sportschool', async () => {
    // Arrange
    const d = deps()
    // Act
    const uit = await verwerkVergeten(EMAIL, 'nl', d)
    // Assert
    expect(uit).toBe('verstuurd')
    expect(d.linkBeheerder).toHaveBeenCalledWith(SANNE)
    expect(d.linkMedewerker).not.toHaveBeenCalled()
    const [naar, onderwerp, tekst] = d.stuurMail.mock.calls[0]
    expect(naar).toBe(EMAIL)
    expect(onderwerp).toBe('Nieuw wachtwoord voor Gym A')
    expect(tekst).toContain('https://adres.test/gyma/clubinloggen/code-van-sanne')
    expect(d.meld).not.toHaveBeenCalled()
  })
  it('een medewerker krijgt de link van de medewerkersuitnodiging, in de taal van de pagina', async () => {
    const d = deps({ vindBeheerder: async () => null, vindMedewerker: async () => LOTTE })
    expect(await verwerkVergeten(EMAIL, 'en', d)).toBe('verstuurd')
    expect(d.linkMedewerker).toHaveBeenCalledWith(LOTTE)
    expect(d.linkBeheerder).not.toHaveBeenCalled()
    const [, onderwerp, tekst] = d.stuurMail.mock.calls[0]
    expect(onderwerp).toBe('New password for Gym A')
    expect(tekst).toContain('Hi Lotte,')
    expect(tekst).toContain('https://adres.test/gyma/clubinloggen/medewerker/token-van-lotte')
  })
  it('de rem telt per e-mailadres', async () => {
    const d = deps()
    await verwerkVergeten(EMAIL, 'nl', d)
    expect(d.isGeremd).toHaveBeenCalledWith(REM_EMAIL, EMAIL)
  })
})

describe('wachtwoord vergeten: niemand krijgt een mail', () => {
  it('een onbekend adres: geen code, geen mail, geen melding', async () => {
    const d = deps({ vindBeheerder: async () => null })
    expect(await verwerkVergeten(EMAIL, 'nl', d)).toBe('geen_account')
    expect(d.linkBeheerder).not.toHaveBeenCalled()
    expect(d.linkMedewerker).not.toHaveBeenCalled()
    expect(d.stuurMail).not.toHaveBeenCalled()
    expect(d.meld).not.toHaveBeenCalled()
  })
  it('het master account van het platform: er wordt niet eens naar een beheerder gezocht', async () => {
    const d = deps({ isPlatform: async () => true })
    expect(await verwerkVergeten(EMAIL, 'nl', d)).toBe('geen_account')
    expect(d.vindBeheerder).not.toHaveBeenCalled()
    expect(d.vindMedewerker).not.toHaveBeenCalled()
    expect(d.stuurMail).not.toHaveBeenCalled()
  })
  it('een account zonder wachtwoord of dat gestopt is: geen nieuwe code', async () => {
    for (const extra of [{ heeftWachtwoord: false }, { actief: false }]) {
      const d = deps({ vindBeheerder: async () => ({ ...SANNE, ...extra }) })
      expect(await verwerkVergeten(EMAIL, 'nl', d)).toBe('geen_account')
      expect(d.linkBeheerder).not.toHaveBeenCalled()
    }
  })
  it('de sportschool bestaat niet meer: geen code en geen mail', async () => {
    const d = deps({ sportschool: async () => null })
    expect(await verwerkVergeten(EMAIL, 'nl', d)).toBe('geen_account')
    expect(d.linkBeheerder).not.toHaveBeenCalled()
    expect(d.stuurMail).not.toHaveBeenCalled()
  })
  it('te vaak voor hetzelfde adres: stil niets, er wordt niet eens gezocht', async () => {
    const d = deps({ isGeremd: async () => true })
    expect(await verwerkVergeten(EMAIL, 'nl', d)).toBe('geremd')
    expect(d.isPlatform).not.toHaveBeenCalled()
    expect(d.vindBeheerder).not.toHaveBeenCalled()
    expect(d.stuurMail).not.toHaveBeenCalled()
  })
})

describe('wachtwoord vergeten: storingen komen bij de platform-eigenaar, zonder persoonsgegevens', () => {
  const zonderPersoon = (melding: string) => {
    expect(melding).not.toContain(EMAIL)
    expect(melding).not.toContain('Sanne')
    expect(melding).not.toContain('clubinloggen')
  }

  it('geen mail-afzender: niets doen (geen rem, geen zoekwerk, geen code) en het melden', async () => {
    const d = deps({ mailKlaar: () => false })
    expect(await verwerkVergeten(EMAIL, 'nl', d)).toBe('niet_ingesteld')
    expect(d.isGeremd).not.toHaveBeenCalled()
    expect(d.vindBeheerder).not.toHaveBeenCalled()
    expect(d.linkBeheerder).not.toHaveBeenCalled()
    expect(d.stuurMail).not.toHaveBeenCalled()
    expect(d.meld).toHaveBeenCalledWith(MELDING_GEEN_MAIL)
    zonderPersoon(MELDING_GEEN_MAIL)
  })
  it('de code opslaan mislukt: geen mail, wel een melding', async () => {
    const d = deps({ linkBeheerder: async () => null })
    expect(await verwerkVergeten(EMAIL, 'nl', d)).toBe('db')
    expect(d.stuurMail).not.toHaveBeenCalled()
    expect(d.meld).toHaveBeenCalledWith(MELDING_OPSLAAN_MISLUKT)
    zonderPersoon(MELDING_OPSLAAN_MISLUKT)
  })
  it('versturen mislukt: een melding', async () => {
    const d = deps({ stuurMail: async () => 'mislukt' })
    expect(await verwerkVergeten(EMAIL, 'nl', d)).toBe('mislukt')
    expect(d.meld).toHaveBeenCalledWith(MELDING_MAIL_MISLUKT)
    zonderPersoon(MELDING_MAIL_MISLUKT)
  })
})
