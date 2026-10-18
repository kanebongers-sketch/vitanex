import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { controleerAbonnement, type Aanmelding } from './opslag'

/** Nep-Supabase: per tabel een antwoord op maybeSingle, en een teller voor schrijven. */
function nepAdmin(voorkeur: Record<string, unknown> | null, toestel: Record<string, unknown> | null) {
  const geschreven: string[] = []
  const admin = {
    from: (tabel: string) => {
      const keten = {
        select: () => keten,
        eq: () => keten,
        order: async () => ({ data: [], error: null }),
        maybeSingle: async () => ({ data: tabel === 'club_meldingen_voorkeuren' ? voorkeur : toestel, error: null }),
        upsert: async () => {
          geschreven.push(`upsert ${tabel}`)
          return { error: null }
        },
        update: () => {
          geschreven.push(`update ${tabel}`)
          return keten
        },
      }
      return keten
    },
  }
  return { admin: admin as unknown as SupabaseClient, geschreven }
}

const AANMELDING: Aanmelding = {
  userId: 'org',
  lidId: 'l1',
  abonnement: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh: 'p', auth: 'a' },
  toestel: null,
  sessieHash: 's1',
}

describe('controleerAbonnement (stil nakijken)', () => {
  it('zet een uitgezette voorkeur niet weer aan en schrijft niets', async () => {
    const { admin, geschreven } = nepAdmin({ push: false }, null)
    expect(await controleerAbonnement(admin, AANMELDING)).toBe('uit')
    expect(geschreven).toEqual([])
  })

  it('schrijft niets als het toestel al bekend is voor dit lid en deze sessie', async () => {
    const { admin, geschreven } = nepAdmin({ push: true }, { lid_id: 'l1', sessie_hash: 's1' })
    expect(await controleerAbonnement(admin, AANMELDING)).toBe('bekend')
    expect(geschreven).toEqual([])
  })

  it('bewaart een onbekend toestel zonder de voorkeur te raken', async () => {
    const { admin, geschreven } = nepAdmin(null, null)
    expect(await controleerAbonnement(admin, AANMELDING)).toBe('opgeslagen')
    expect(geschreven).toEqual(['upsert club_push_abonnementen'])
  })
})
