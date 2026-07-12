-- ============================================================
-- MentaForce — Coaching-uitnodigingen (token-link voor NIEUWE klanten)
-- ============================================================
-- Stap 2 van de coaching-onboarding. Een coach (rol 'coach'/'admin')
-- nodigt per e-mail een klant uit die nog GEEN account heeft of nog
-- niet gekoppeld is. De klant klikt de token-link, registreert of
-- logt in en wordt via /api/coaching/uitnodiging/accepteer aan de
-- coach gekoppeld (rij in coach_klanten, status 'actief').
--
-- Bouwt voort op migratie 037 (coach_klanten, is_coach) en volgt het
-- token-precedent van migratie 002 (uitnodiging_tokens).
--
-- Tokenvalidatie/acceptatie loopt volledig server-side via de
-- service-role admin-client, daarom is er GEEN publieke SELECT-policy
-- nodig. RLS beperkt directe toegang tot de eigen uitnodigingen.
-- ============================================================

CREATE TABLE IF NOT EXISTS coaching_uitnodigingen (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email          text NOT NULL,
  naam           text,
  token          text NOT NULL UNIQUE,
  status         text NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','geaccepteerd','ingetrokken','verlopen')),
  aangemaakt_op  timestamptz DEFAULT now(),
  verloopt_op    timestamptz NOT NULL DEFAULT now() + interval '14 days',
  geaccepteerd_op timestamptz
);

COMMENT ON TABLE  coaching_uitnodigingen IS 'Token-uitnodiging van een coach aan een (nog niet gekoppelde) klant — stap 2 coaching-onboarding';
COMMENT ON COLUMN coaching_uitnodigingen.token IS 'Geheime capability-token uit de e-maillink; validatie loopt server-side via service-role';
COMMENT ON COLUMN coaching_uitnodigingen.status IS 'open → geaccepteerd | ingetrokken | verlopen';

-- ─── Indexen ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_coaching_uitnodigingen_token
  ON coaching_uitnodigingen (token);
CREATE INDEX IF NOT EXISTS idx_coaching_uitnodigingen_coach_status
  ON coaching_uitnodigingen (coach_id, status);

-- ─── Row Level Security ─────────────────────────────────────
ALTER TABLE coaching_uitnodigingen ENABLE ROW LEVEL SECURITY;

-- Coach beheert (lezen/aanmaken/bijwerken/verwijderen) zijn eigen uitnodigingen.
-- De klant heeft GEEN directe rij-toegang: acceptatie loopt via de service-role
-- server-route, die de token valideert. Zo kan niemand tokens/uitnodigingen van
-- anderen opsommen.
DROP POLICY IF EXISTS coaching_uitnodigingen_coach ON coaching_uitnodigingen;
CREATE POLICY coaching_uitnodigingen_coach ON coaching_uitnodigingen FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());
