// ─── PT-app — kleding: lezen en schrijven (SERVER-ONLY) ────────────────────
// Tabellen en functies uit migratie 368. Lezen doen Kane en de eigenaren (via
// de pagina); schrijven alleen Kane, via de founder-API. Uitgeven en terugnemen
// lopen via de databasefuncties, zodat voorraad en uitgifte altijd samen kloppen.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { KledingActie, KledingArtikel, Uitgifte, VoorraadRegel } from './kleding'

export interface KledingGegevens {
  artikelen: KledingArtikel[]
  voorraad: VoorraadRegel[]
  uitgiftes: Uitgifte[]
}

/** Alles in één rondje. Null = lezen mislukt. */
export async function haalKleding(admin: SupabaseClient, userId: string): Promise<KledingGegevens | null> {
  const [a, u] = await Promise.all([
    admin.from('pt_kleding_artikelen').select('id, naam, maten').eq('user_id', userId).eq('actief', true).order('naam'),
    admin
      .from('pt_kleding_uitgifte')
      .select('id, persoon_id, artikel_id, maat, aantal, uitgegeven_op, terug_op, notitie')
      .eq('user_id', userId)
      .order('uitgegeven_op', { ascending: false })
      .limit(2000),
  ])
  if (a.error || u.error) return null
  const artikelen = ((a.data ?? []) as { id: string; naam: string; maten: string[] | null }[]).map((r) => ({ id: r.id, naam: r.naam, maten: r.maten ?? [] }))
  const ids = artikelen.map((x) => x.id)
  const v = ids.length === 0 ? { data: [], error: null } : await admin.from('pt_kleding_voorraad').select('artikel_id, maat, aantal').in('artikel_id', ids)
  if (v.error) return null
  return {
    artikelen,
    voorraad: ((v.data ?? []) as { artikel_id: string; maat: string; aantal: number }[]).map((r) => ({ artikelId: r.artikel_id, maat: r.maat, aantal: r.aantal })),
    uitgiftes: ((u.data ?? []) as {
      id: string; persoon_id: string; artikel_id: string; maat: string; aantal: number; uitgegeven_op: string; terug_op: string | null; notitie: string | null
    }[]).map((r) => ({
      id: r.id, persoonId: r.persoon_id, artikelId: r.artikel_id, maat: r.maat, aantal: r.aantal,
      uitgegevenOp: r.uitgegeven_op, terugOp: r.terug_op, notitie: r.notitie,
    })),
  }
}

export type KledingUitkomst = { ok: true } | { ok: false; fout: string; status: number }

/** Mag deze persoon kleding krijgen: een actieve PT'er, of de beheerder (traint zelf ook)? */
async function isTrainer(admin: SupabaseClient, userId: string, persoonId: string): Promise<boolean> {
  const [p, l] = await Promise.all([
    admin.from('crm_personen').select('groep, status').eq('id', persoonId).eq('user_id', userId).maybeSingle(),
    admin.from('pt_lead_links').select('rol').eq('persoon_id', persoonId).eq('user_id', userId).eq('actief', true).maybeSingle(),
  ])
  if (!p.data) return false
  return (p.data.groep === 'pt_team' && p.data.status !== 'inactief') || l.data?.rol === 'beheerder'
}

/** Een gecontroleerde actie uitvoeren (de aanroeper heeft de founder-gate al gepasseerd). */
export async function voerKledingActieUit(admin: SupabaseClient, userId: string, a: KledingActie): Promise<KledingUitkomst> {
  switch (a.actie) {
    case 'artikel': {
      const { error } = await admin.from('pt_kleding_artikelen').insert({ user_id: userId, naam: a.naam, maten: a.maten })
      if (error?.code === '23505') return { ok: false, fout: `Er bestaat al een artikel "${a.naam}".`, status: 409 }
      return error ? { ok: false, fout: 'Opslaan mislukt.', status: 502 } : { ok: true }
    }
    case 'voorraad': {
      const { data: art } = await admin.from('pt_kleding_artikelen').select('maten').eq('id', a.artikelId).eq('user_id', userId).maybeSingle()
      if (!art) return { ok: false, fout: 'Artikel bestaat niet.', status: 404 }
      if (!((art.maten as string[] | null) ?? []).includes(a.maat)) return { ok: false, fout: 'Deze maat hoort niet bij het artikel.', status: 400 }
      const { error } = await admin
        .from('pt_kleding_voorraad')
        .upsert({ artikel_id: a.artikelId, maat: a.maat, aantal: a.aantal, bijgewerkt_op: new Date().toISOString() }, { onConflict: 'artikel_id,maat' })
      return error ? { ok: false, fout: 'Opslaan mislukt.', status: 502 } : { ok: true }
    }
    case 'uitgeven': {
      if (!(await isTrainer(admin, userId, a.persoonId))) return { ok: false, fout: "Kies een PT'er uit het team.", status: 400 }
      const { error } = await admin.rpc('pt_kleding_uitgeven', {
        p_user: userId, p_persoon: a.persoonId, p_artikel: a.artikelId, p_maat: a.maat, p_aantal: a.aantal, p_datum: a.datum, p_notitie: a.notitie,
      })
      if (error?.message.includes('onvoldoende_voorraad')) return { ok: false, fout: 'Niet genoeg op voorraad in Eersel voor deze maat.', status: 409 }
      if (error?.message.includes('artikel_onbekend')) return { ok: false, fout: 'Artikel bestaat niet.', status: 404 }
      return error ? { ok: false, fout: 'Opslaan mislukt.', status: 502 } : { ok: true }
    }
    case 'terug': {
      const { data, error } = await admin.rpc('pt_kleding_terug', { p_user: userId, p_uitgifte: a.uitgifteId, p_datum: a.datum, p_op_voorraad: a.opVoorraad })
      if (error) return { ok: false, fout: 'Opslaan mislukt.', status: 502 }
      return data === true ? { ok: true } : { ok: false, fout: 'Deze kleding is al teruggegeven.', status: 409 }
    }
  }
}
