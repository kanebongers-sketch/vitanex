// ─── Coaching-uitnodigingen — server-helpers ────────────────────────────────
// Alleen server-side (service-role admin-client). Aangeroepen door de
// /api/coaching/uitnodiging(en)/* routes ná de auth-check. Bevat de logica om
// een token-uitnodiging aan te maken, te lijsten, in te trekken en te
// accepteren. Bouwt voort op migratie 039 en de coach_klanten-tabel (037).
//
// LET OP: dit is de MENSELIJKE coaching-laag (coach → klant), los van bedrijf/HR.

import { randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

type Admin = ReturnType<typeof createAdminClient>

const EMAIL_PATROON = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Genereert een geheime, URL-veilige token (48 hex-tekens). */
function genereerToken(): string {
  return randomBytes(24).toString('hex')
}

export type UitnodigingStatus = 'open' | 'geaccepteerd' | 'ingetrokken' | 'verlopen'

export interface CoachingUitnodiging {
  id: string
  email: string
  naam: string | null
  status: UitnodigingStatus
  aangemaakt_op: string | null
  verloopt_op: string
  geaccepteerd_op: string | null
}

interface MaakResultaatOk {
  ok: true
  token: string
  email: string
  naam: string | null
  hergebruikt: boolean
}
interface Fout {
  ok: false
  status: number
  fout: string
}

/**
 * Maakt een uitnodiging voor een (nog niet gekoppelde) klant. Controleert
 * op zelf-uitnodiging, een bestaande actieve koppeling en een reeds openstaande
 * uitnodiging (die wordt hergebruikt i.p.v. gedupliceerd). Retourneert de token
 * zodat de API-route de e-mail kan versturen.
 */
export async function maakUitnodiging(
  admin: Admin,
  coachId: string,
  emailInput: string,
  naamInput?: string,
): Promise<MaakResultaatOk | Fout> {
  const email = emailInput.trim().toLowerCase()
  const naam = naamInput?.trim() ? naamInput.trim() : null

  if (!email || !EMAIL_PATROON.test(email)) {
    return { ok: false, status: 400, fout: 'Voer een geldig e-mailadres in.' }
  }

  // Zelf-uitnodiging voorkomen (op basis van het e-mailadres van de coach).
  const { data: coachProfiel } = await admin
    .from('profiles')
    .select('email')
    .eq('id', coachId)
    .maybeSingle()
  if (coachProfiel?.email && coachProfiel.email.trim().toLowerCase() === email) {
    return { ok: false, status: 400, fout: 'Je kunt jezelf niet uitnodigen.' }
  }

  // Bestaat er al een gebruiker met dit e-mailadres die al actief gekoppeld is?
  const { data: bestaandProfiel } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle()

  if (bestaandProfiel) {
    const { data: koppeling } = await admin
      .from('coach_klanten')
      .select('status')
      .eq('coach_id', coachId)
      .eq('klant_id', bestaandProfiel.id)
      .maybeSingle()
    if (koppeling && koppeling.status === 'actief') {
      return { ok: false, status: 409, fout: 'Deze klant is al aan je gekoppeld.' }
    }
  }

  // Hergebruik een reeds openstaande, niet-verlopen uitnodiging i.p.v. dupliceren.
  const { data: bestaande } = await admin
    .from('coaching_uitnodigingen')
    .select('id, token, verloopt_op')
    .eq('coach_id', coachId)
    .ilike('email', email)
    .eq('status', 'open')
    .order('aangemaakt_op', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (bestaande && new Date(bestaande.verloopt_op).getTime() > Date.now()) {
    return { ok: true, token: bestaande.token, email, naam, hergebruikt: true }
  }

  const token = genereerToken()
  const { error } = await admin
    .from('coaching_uitnodigingen')
    .insert({ coach_id: coachId, email, naam, token })

  if (error) {
    return { ok: false, status: 500, fout: 'Uitnodiging aanmaken mislukt. Probeer opnieuw.' }
  }
  return { ok: true, token, email, naam, hergebruikt: false }
}

/** Alle uitnodigingen van een coach, nieuwste eerst. */
export async function lijstUitnodigingen(
  admin: Admin,
  coachId: string,
): Promise<CoachingUitnodiging[]> {
  const { data } = await admin
    .from('coaching_uitnodigingen')
    .select('id, email, naam, status, aangemaakt_op, verloopt_op, geaccepteerd_op')
    .eq('coach_id', coachId)
    .order('aangemaakt_op', { ascending: false })

  return (data as CoachingUitnodiging[] | null) ?? []
}

/** Trekt een nog openstaande uitnodiging in. Alleen de eigenaar-coach mag dit. */
export async function trekUitnodigingIn(
  admin: Admin,
  coachId: string,
  uitnodigingId: string,
): Promise<{ ok: true } | Fout> {
  const { data, error } = await admin
    .from('coaching_uitnodigingen')
    .update({ status: 'ingetrokken' })
    .eq('id', uitnodigingId)
    .eq('coach_id', coachId)
    .eq('status', 'open')
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, status: 500, fout: 'Intrekken mislukt. Probeer opnieuw.' }
  if (!data) return { ok: false, status: 404, fout: 'Uitnodiging niet gevonden of al verwerkt.' }
  return { ok: true }
}

/**
 * Accepteert een uitnodiging voor de ingelogde gebruiker: valideert de token
 * (open + niet verlopen), maakt/updatet de coach_klanten-rij naar 'actief' en
 * markeert de uitnodiging als 'geaccepteerd'. Bezit van een geldige token is
 * de autorisatie (capability-model, net als het HR-token-precedent).
 */
export async function accepteerUitnodiging(
  admin: Admin,
  tokenInput: string,
  userId: string,
): Promise<{ ok: true; coach_id: string } | Fout> {
  const token = tokenInput.trim()
  if (!token) return { ok: false, status: 400, fout: 'Ongeldige uitnodiging.' }

  const { data: uitnodiging } = await admin
    .from('coaching_uitnodigingen')
    .select('id, coach_id, status, verloopt_op')
    .eq('token', token)
    .maybeSingle()

  if (!uitnodiging) {
    return { ok: false, status: 404, fout: 'Deze uitnodiging bestaat niet meer.' }
  }
  if (uitnodiging.status === 'ingetrokken') {
    return { ok: false, status: 410, fout: 'Deze uitnodiging is ingetrokken door je coach.' }
  }
  if (uitnodiging.status === 'geaccepteerd') {
    return { ok: false, status: 409, fout: 'Deze uitnodiging is al gebruikt.' }
  }
  if (new Date(uitnodiging.verloopt_op).getTime() < Date.now()) {
    // Markeer verlopen voor hygiëne; negeer een eventuele update-fout bewust.
    await admin
      .from('coaching_uitnodigingen')
      .update({ status: 'verlopen' })
      .eq('id', uitnodiging.id)
      .eq('status', 'open')
    return { ok: false, status: 410, fout: 'Deze uitnodiging is verlopen. Vraag je coach om een nieuwe.' }
  }
  if (uitnodiging.coach_id === userId) {
    return { ok: false, status: 400, fout: 'Je kunt je eigen uitnodiging niet accepteren.' }
  }

  // Koppeling activeren (nieuw of bestaand → 'actief'). inzage_toestemming blijft
  // op de bestaande/standaardwaarde (AVG-opt-in geeft de klant later zelf).
  const { error: koppelFout } = await admin
    .from('coach_klanten')
    .upsert(
      { coach_id: uitnodiging.coach_id, klant_id: userId, status: 'actief' },
      { onConflict: 'coach_id,klant_id' },
    )
  if (koppelFout) {
    return { ok: false, status: 500, fout: 'Koppelen aan je coach mislukt. Probeer opnieuw.' }
  }

  const { error: markeerFout } = await admin
    .from('coaching_uitnodigingen')
    .update({ status: 'geaccepteerd', geaccepteerd_op: new Date().toISOString() })
    .eq('id', uitnodiging.id)
  if (markeerFout) {
    return { ok: false, status: 500, fout: 'Uitnodiging verwerken mislukt. Probeer opnieuw.' }
  }

  return { ok: true, coach_id: uitnodiging.coach_id }
}
