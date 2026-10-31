import { describe, expect, it } from 'vitest'
import { nepSupabase, type Vraag } from '@/lib/club/beheerders/nep-supabase'
import { meldingIn } from './taal/woorden/website/meldingen'
import { AANMELDING_BEZET, EMAIL_NIET_BRUIKBAAR, emailVrijVoorAanmelding } from './dubbel'

const BEHEERDER = { id: 'b1', organisatie_id: 'o1', naam: 'Sanne', email: 's@b.nl', rol: 'eigenaar', actief: true, wachtwoord_hash: 'x' }

interface Stand {
  beheerder?: boolean
  platform?: boolean
  aanmelding?: boolean
  fout?: boolean
}

function db(s: Stand) {
  return nepSupabase((v: Vraag) => {
    if (v.tabel === 'club_beheerders') return { data: s.beheerder ? [BEHEERDER] : [], error: null }
    if (v.tabel === 'club_platform_accounts') return { data: null, error: null }
    if (v.tabel === 'ayg_aanmeldingen') return s.fout ? { data: null, error: { message: 'kapot', code: 'XX' } } : { data: s.aanmelding ? [{ id: 'a1' }] : [], error: null }
    return { data: null, error: null }
  })
}

describe('een e-mailadres kan maar een eigenaar-account worden', () => {
  it('een nieuw adres is vrij', async () => {
    expect(await emailVrijVoorAanmelding(db({}).admin, 'nieuw@b.nl')).toBe(true)
  })
  it('een adres met een lopende aanmelding (andere sportschool) is niet vrij', async () => {
    const { admin, vragen } = db({ aanmelding: true })
    expect(await emailVrijVoorAanmelding(admin, 'S@B.nl')).toBe(false)
    const v = vragen.find((x) => x.tabel === 'ayg_aanmeldingen')
    expect(v?.filters).toContainEqual(['eq', 'eigenaar_email', 's@b.nl'])
    expect(v?.filters).toContainEqual(['in', 'status', [...AANMELDING_BEZET]])
  })
  it('een aanmelding die nog op betaling wacht, blokkeert niet (opnieuw proberen na afbreken mag)', () => {
    expect(AANMELDING_BEZET).not.toContain('wacht_op_betaling')
    expect(AANMELDING_BEZET).toContain('inrichten')
  })
  it('een databasefout: niet doorgaan', async () => {
    expect(await emailVrijVoorAanmelding(db({ fout: true }).admin, 's@b.nl')).toBeNull()
  })
  it('de melding verraadt niet of er een account is, en bestaat in NL en EN', () => {
    expect(EMAIL_NIET_BRUIKBAAR).not.toMatch(/is al een account|bestaat al|al geregistreerd/i)
    const en = meldingIn(EMAIL_NIET_BRUIKBAAR, 'en')
    expect(en).not.toBe(EMAIL_NIET_BRUIKBAAR)
    expect(en).toMatch(/email address/)
    for (const t of [EMAIL_NIET_BRUIKBAAR, en]) expect(t).not.toMatch(/[–—]| - /)
  })
})
