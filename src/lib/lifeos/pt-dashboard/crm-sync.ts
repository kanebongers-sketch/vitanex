// ─── PT-app → CRM: Kane's eigen klanten op één plek bijhouden (SERVER-ONLY) ──
// Kane beheert zijn PT-klanten in de PT-app (trainer = de beheerder). Zijn
// inplanning (wie moet ik deze week nog inplannen, afhaaksignalen, dagmail)
// draait op de CRM-groep pt_klant, met agenda-herkenning op naam. In plaats van
// die hele keten om te bouwen, houdt deze module de CRM-klant bij:
//   - nieuwe eigen klant → nieuwe CRM-klant (gekoppeld via pt_klanten.crm_persoon_id);
//   - wijziging → status, locatie, abonnement en duo bijwerken. De NAAM niet:
//     de agenda herkent sessies op de CRM-naam ("Marjan en Ellen");
//   - gestopt, verwijderd of naar een andere trainer → CRM-klant op inactief.
// Best effort: een mislukte sync laat het opslaan in de PT-app niet falen.

import type { SupabaseClient } from '@supabase/supabase-js'
import { maakPersoon, wijzigPersoon } from '@/lib/lifeos/crm/opslag'
import { isPtLocatie, type Abonnement as CrmAbonnement, type PtLocatie } from '@/lib/lifeos/crm/crm'
import { isLopend, type Abonnement, type PtKlant } from './abonnementen'

export interface CrmVelden {
  status: 'actieve_klant' | 'inactief'
  locatie: PtLocatie | null
  abonnement: CrmAbonnement | null
  duo: boolean
}

const CRM_ABONNEMENT: Record<Abonnement, CrmAbonnement | null> = {
  '1x': 'wekelijks_1',
  '2x': 'wekelijks_2',
  duo_1x: 'wekelijks_1',
  duo_2x: 'wekelijks_2',
  '1x_2w': 'tweewekelijks_1',
  duo_start: 'wekelijks_1',
  // Geen vaste wekelijkse cadans bekend: de planning laat ze met rust.
  challenge: null,
  coaching: null,
}

/** Wat de CRM-klant moet zijn voor deze PT-app-klant. Puur. */
export function crmVelden(k: Pick<PtKlant, 'abonnement' | 'club' | 'status' | 'startdatum' | 'opgezegdOp'>, vandaag: string): CrmVelden {
  return {
    status: isLopend(k, vandaag) ? 'actieve_klant' : 'inactief',
    locatie: isPtLocatie(k.club) ? k.club : null,
    abonnement: CRM_ABONNEMENT[k.abonnement],
    duo: k.abonnement === 'duo_1x' || k.abonnement === 'duo_2x' || k.abonnement === 'duo_start',
  }
}

/** Zet een gekoppelde CRM-klant op inactief (verwijderd of naar een andere trainer). */
export async function crmKlantInactief(admin: SupabaseClient, userId: string, crmPersoonId: string | null): Promise<void> {
  if (!crmPersoonId) return
  await wijzigPersoon(admin, userId, crmPersoonId, { status: 'inactief' })
}

/**
 * Houd de CRM-klant bij na het opslaan van een klant in de PT-app. Alleen voor
 * klanten van de beheerder (`beheerderId`); is de klant naar een andere trainer
 * verhuisd, dan gaat de gekoppelde CRM-klant op inactief.
 */
export async function synchroniseerMetCrm(
  admin: SupabaseClient,
  userId: string,
  beheerderId: string,
  klant: PtKlant,
  vandaag: string,
): Promise<void> {
  const { data: rij } = await admin
    .from('pt_klanten')
    .select('persoon_id, crm_persoon_id')
    .eq('id', klant.id)
    .eq('user_id', userId)
    .maybeSingle()
  if (!rij) return
  const crmId = (rij.crm_persoon_id as string | null) ?? null
  if (rij.persoon_id !== beheerderId) return crmKlantInactief(admin, userId, crmId)

  const velden = crmVelden(klant, vandaag)
  if (crmId) {
    await wijzigPersoon(admin, userId, crmId, velden)
    return
  }
  const nieuw = await maakPersoon(admin, userId, {
    naam: klant.naam,
    groep: 'pt_klant',
    status: velden.status,
    followUpDatum: null,
    telefoon: null,
    email: null,
    bijzonderheden: null,
  })
  if (!nieuw.ok) return
  await wijzigPersoon(admin, userId, nieuw.waarde.id, { locatie: velden.locatie, abonnement: velden.abonnement, duo: velden.duo })
  await admin.from('pt_klanten').update({ crm_persoon_id: nieuw.waarde.id }).eq('id', klant.id).eq('user_id', userId)
}
