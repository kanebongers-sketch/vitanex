-- 013_agent_rls_hardening.sql
--
-- Probleem: alle agent_* outreach-tabellen hadden RLS-policies met
-- USING (true) / WITH CHECK (true) voor álle rollen, en op twee tabellen
-- stond RLS helemaal uit. Daardoor kon iedereen met de (publieke) anon key
-- de volledige outreach-pijplijn lezen én wijzigen via de REST API.
--
-- Oplossing: alleen de eigenaar (ingelogd als kanebongers@gmail.com) heeft
-- toegang via de app. Server-side processen die de service role key
-- gebruiken omzeilen RLS en blijven gewoon werken.
--
-- LET OP vóór het toepassen: draait er een extern outreach-script dat met
-- de ANON key schrijft naar deze tabellen? Zet dat script dan eerst om
-- naar de service role key, anders stopt het met werken.

DROP POLICY IF EXISTS "agent schrijven batches" ON public.agent_batches;
DROP POLICY IF EXISTS "agent schrijven bedrijven" ON public.agent_bedrijven;
DROP POLICY IF EXISTS "agent schrijven contacten" ON public.agent_contacten;
DROP POLICY IF EXISTS "agent schrijven dag stats" ON public.agent_dag_stats;
DROP POLICY IF EXISTS "agent schrijven emails" ON public.agent_emails;
DROP POLICY IF EXISTS "agent schrijven goedkeuring" ON public.agent_goedkeuring;

ALTER TABLE public.agent_dagselectie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_instellingen ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'agent_batches', 'agent_bedrijven', 'agent_contacten', 'agent_dag_stats',
    'agent_emails', 'agent_goedkeuring', 'agent_dagselectie', 'agent_instellingen'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY agent_eigenaar ON public.%I FOR ALL TO authenticated '
      'USING ((auth.jwt() ->> ''email'') = ''kanebongers@gmail.com'') '
      'WITH CHECK ((auth.jwt() ->> ''email'') = ''kanebongers@gmail.com'')',
      t
    );
  END LOOP;
END $$;
