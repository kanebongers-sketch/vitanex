-- 015_security_advisories.sql
-- Werkt de resterende Supabase security advisories weg.
-- Toegepast op 11 juni 2026.

-- ─────────────────────────────────────────────────────────────
-- 1. checkin_status: was SECURITY DEFINER zonder eigen filtering.
--    Elke ingelogde gebruiker kon daardoor namen, laatste check-in
--    en welzijnsscores van medewerkers van ÁLLE bedrijven opvragen
--    (het bedrijf-filter zat alleen client-side in het HR-dashboard).
--    Nu filtert de view zelf: alleen HR/admin ziet het eigen bedrijf.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.checkin_status AS
SELECT p.id,
       p.naam,
       p.bedrijf_id,
       p.laatste_checkin,
       CASE
         WHEN p.laatste_checkin >= date_trunc('week', now()) THEN true
         ELSE false
       END AS deze_week_ingevuld,
       (SELECT round(((COALESCE(c.energie, 3) + COALESCE(c.slaap, 3)
                     + COALESCE(c.werkdruk, 3) + COALESCE(c.motivatie, 3)
                     + COALESCE(c.herstel, 3) + COALESCE(c.fysiek_pijn, 3)
                     + COALESCE(c.fysiek_beweging, 3) + COALESCE(c.mentaal_focus, 3)
                     + COALESCE(c.mentaal_stress, 3) + COALESCE(c.mentaal_balans, 3)
                     + COALESCE(c.sociaal_team, 3) + COALESCE(c.sociaal_steun, 3))::numeric
                     / 12::numeric), 2)
          FROM checkins c
         WHERE c.user_id = p.id
         ORDER BY c.created_at DESC
         LIMIT 1) AS laatste_score
  FROM profiles p
 WHERE p.rol = 'medewerker'
   AND EXISTS (
     SELECT 1 FROM profiles ik
      WHERE ik.id = auth.uid()
        AND ik.rol IN ('hr', 'admin')
        AND ik.bedrijf_id = p.bedrijf_id
   );

REVOKE SELECT ON public.checkin_status FROM anon;

-- ─────────────────────────────────────────────────────────────
-- 2. fitness_voortgang: respecteer voortaan de RLS van de aanroeper
--    (gebruikers zien alleen hun eigen logs; service role omzeilt RLS).
-- ─────────────────────────────────────────────────────────────
ALTER VIEW public.fitness_voortgang SET (security_invoker = true);
REVOKE SELECT ON public.fitness_voortgang FROM anon;

-- ─────────────────────────────────────────────────────────────
-- 3. hr_code_logs: de policy heette "Service role only" maar gold met
--    USING (true) voor álle rollen. Weg ermee — alleen de service role
--    (die RLS omzeilt, gebruikt door de API-routes) kan er nog bij.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role only" ON public.hr_code_logs;

-- ─────────────────────────────────────────────────────────────
-- 4. search_path vastzetten op alle gemelde functies
-- ─────────────────────────────────────────────────────────────
ALTER FUNCTION public.update_laatste_checkin() SET search_path = public;
ALTER FUNCTION public.generate_hr_code() SET search_path = public;
ALTER FUNCTION public.set_hr_code_on_insert() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_user_updated() SET search_path = public;

-- ─────────────────────────────────────────────────────────────
-- 5. SECURITY DEFINER trigger-functies niet rechtstreeks aanroepbaar
--    via /rest/v1/rpc. Triggers zelf blijven werken (EXECUTE wordt bij
--    het afvuren van een trigger niet opnieuw gecontroleerd); de
--    auth-triggers krijgen expliciet rechten voor supabase_auth_admin.
-- ─────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_user_updated() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_laatste_checkin() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_user_updated() TO supabase_auth_admin;

-- ─────────────────────────────────────────────────────────────
-- 6. avatars-bucket: listing van álle bestanden uitzetten. Publieke
--    object-URL's blijven gewoon werken (bucket is public).
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Avatars publicly viewable" ON storage.objects;
