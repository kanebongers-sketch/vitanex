-- 044_security_hardening_v3.sql
-- MentaForce V3 — security hardening na de audit (juli 2026).
--
-- Lost twee CRITICAL-bevindingen op (live geverifieerd tegen productie):
--   (A) Privilege-escalatie: elke ingelogde kon via de browser-client zijn eigen
--       profiles.rol / bedrijf_id wijzigen. De policy "Eigen profiel" is
--       ALL USING (auth.uid() = id) zonder kolomrestrictie, en `authenticated`
--       heeft UPDATE-grant op rol én bedrijf_id. Gevolg: zelfpromotie naar
--       admin/hr + overstappen naar een willekeurig bedrijf (AVG-kritiek).
--   (B) Content-OS-tabellen stonden open voor ELKE 'authenticated' gebruiker
--       ("Allow all for authenticated"), dus voor elke medewerker van elk
--       klantbedrijf.
-- Plus veilige hardening: search_path vastzetten op de door de advisor
-- gemarkeerde functies.
--
-- LET OP (server-side afscherming): de content-API-routes draaien op de
-- service-role client (bypasst RLS) en worden PRIMAIR in de code met isFounder()
-- afgeschermd. De RLS hieronder is defense-in-depth voor directe PostgREST-toegang.
--
-- Deze migratie is idempotent (drop if exists / create or replace) en veilig
-- opnieuw te draaien.

-- ─────────────────────────────────────────────────────────────────────────────
-- (A) profiles: guard tegen client-side privilege-escalatie & bedrijf-hopping
-- ─────────────────────────────────────────────────────────────────────────────
-- De bestaande "Eigen profiel"-policy blijft intact (self-service op je eigen
-- profielvelden). Een BEFORE UPDATE-trigger dwingt af dat privilege-wijzigingen
-- alleen door bevoegden gebeuren. Concreet mag een sessie die NIET service-role
-- én NIET een admin is:
--   • rol niet naar een bevoorrechte waarde (admin/hr/coach) tillen;
--   • bedrijf_id niet van het ene bedrijf naar een ander wijzigen.
-- Legitiem toegestaan blijft dus:
--   • iedereen: rol -> 'medewerker' (onboarding/uitnodiging), bedrijf_id
--     NULL->waarde (koppelen) en waarde->NULL (ontkoppelen);
--   • admins: HR-accounts aanmaken / gebruikers verplaatsen (admin-paneel);
--   • service-role: alle server-flows (/api/hr-code/koppel, /api/admin/testrol).
-- SECURITY INVOKER is bewust: we lezen `current_user` om de service-role te
-- herkennen (bij SECURITY DEFINER zou dat de owner zijn).

create or replace function public.guard_profiel_privileges()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  priv_rollen constant text[] := array['admin', 'hr', 'coach'];
  caller_is_admin boolean;
begin
  -- Server-/migratiecontext mag alles.
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  -- Is de handelende gebruiker zelf een admin? rol is (na deze trigger) alleen
  -- server-side/door-admins te zetten, dus deze controle is betrouwbaar.
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.rol = 'admin'
  ) into caller_is_admin;

  if not caller_is_admin then
    -- rol: niet-admins mogen nooit naar een bevoorrechte rol.
    if new.rol is distinct from old.rol and new.rol = any (priv_rollen) then
      raise exception
        'Niet toegestaan: rol kan niet client-side naar % worden gezet.', new.rol
        using errcode = 'check_violation';
    end if;

    -- bedrijf_id: geen bedrijf-hopping (koppelen/ontkoppelen blijft toegestaan).
    if old.bedrijf_id is not null
       and new.bedrijf_id is not null
       and new.bedrijf_id is distinct from old.bedrijf_id then
      raise exception
        'Niet toegestaan: bedrijf kan niet client-side gewijzigd worden.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profiel_privileges on public.profiles;
create trigger trg_guard_profiel_privileges
  before update on public.profiles
  for each row
  execute function public.guard_profiel_privileges();

-- ─────────────────────────────────────────────────────────────────────────────
-- (B) content_*: alleen de founder (per e-mail) — spiegelt 013_agent_rls_hardening.
-- ─────────────────────────────────────────────────────────────────────────────
-- Vervangt de "Allow all for authenticated"-policies door één founder-only
-- policy. De founder blijft dus ook via de browser-client lezen/schrijven
-- (JWT-email matcht); alle andere gebruikers worden geweigerd.

do $$
declare
  t text;
  founder_email constant text := 'kanebongers@gmail.com';
begin
  foreach t in array array[
    'content_pillars', 'content_ideas', 'content_briefings',
    'content_opnames', 'content_kalender', 'content_weekplanningen'
  ] loop
    -- Verwijder de bekende te ruime policies (namen uit de live-audit).
    execute format('drop policy if exists %I on public.%I', 'Allow all for authenticated', t);
    execute format('drop policy if exists %I on public.%I', 'Authenticated users can insert weekplanningen', t);
    execute format('drop policy if exists %I on public.%I', 'Authenticated users can read weekplanningen', t);
    execute format('drop policy if exists %I on public.%I', 'Authenticated users can update weekplanningen', t);
    execute format('drop policy if exists %I on public.%I', 'Service role bypasses RLS', t);
    execute format('drop policy if exists %I on public.%I', 'content founder only', t);

    -- Eén founder-only policy (service-role bypasst RLS sowieso).
    execute format(
      'create policy %I on public.%I for all to authenticated '
      'using ((auth.jwt() ->> ''email'') = %L) '
      'with check ((auth.jwt() ->> ''email'') = %L)',
      'content founder only', t, founder_email, founder_email
    );
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- (C) Hardening: zet search_path vast op de door de advisor gemarkeerde functies.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'is_hr_or_admin', 'mijn_bedrijf_id',
        'update_vita_companion_updated_at', 'update_bijgewerkt_op'
      )
  loop
    execute format('alter function %s set search_path = public', r.sig);
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- (D) Sluit de ANONIEME rollen-oracle.
--
-- `is_hr_or_admin(uid uuid)` is SECURITY DEFINER en stond op `anon=X` + PUBLIC.
-- Gevolg: iedereen kon ZONDER in te loggen POST /rest/v1/rpc/is_hr_or_admin
-- doen met een willekeurige user-uuid en uitlezen of die persoon HR of admin is.
-- SECURITY DEFINER betekent dat de RLS op `profiles` dat juist NIET tegenhoudt.
--
-- Geverifieerd tegen de LIVE database vóór deze wijziging:
--   • alle 5 policies die de functie gebruiken roepen 'm aan als
--     `is_hr_or_admin(auth.uid())` — nooit met een uuid van buiten;
--   • de applicatie roept de RPC nergens aan (0 treffers op `.rpc(` in src/).
-- De functies zijn dus puur RLS-helpers; niemand verliest functionaliteit.
--
-- `authenticated` MOET EXECUTE houden: policy-expressies worden geëvalueerd met
-- de rechten van de query-uitvoerder. Zonder die grant faalt de RLS met
-- "permission denied" in plaats van 0 rijen terug te geven.
--
-- RESTRISICO (bewust geaccepteerd — niet vergeten): een INGELOGDE gebruiker kan
-- nog steeds een willekeurige uuid bevragen. Fors kleiner (account nodig + kennis
-- van een uuid, antwoord is één bit), maar niet nul. Strakker kan door
-- `and uid = auth.uid()` in de functie-body te zetten — gedragsbehoudend voor
-- álle huidige callers, want die passen auth.uid() al door. Bewust niet hier:
-- dat verdient een eigen test-ronde, en deze migratie moet nú kunnen landen.
-- ─────────────────────────────────────────────────────────────────────────────
revoke execute on function public.is_hr_or_admin(uuid) from public, anon;
revoke execute on function public.mijn_bedrijf_id()    from public, anon;

grant execute on function public.is_hr_or_admin(uuid) to authenticated, service_role;
grant execute on function public.mijn_bedrijf_id()    to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- NA HET DRAAIEN — nog handmatig / in een volgende migratie (zie audit, niet
-- hier meegenomen omdat ze live-flow-tests vereisen):
--   • checkin_status: view is SECURITY DEFINER (advisor ERROR) -> herbouw als
--     security_invoker nadat de onderliggende RLS HR-lees toestaat.
--   • uitnodiging_tokens: SELECT USING (true) laat token/e-mail-enumeratie toe
--     -> verplaats token-lookup naar een server-route (service-role) en verwijder
--     de publieke SELECT-policy.
--   • /api/manager/team-overzicht: voeg k-anonimiteitsdrempel toe (min. teamgrootte).
--   • Auth: zet "Leaked password protection" aan in het Supabase-dashboard.
--   • Zorg dat CRON_SECRET in de omgeving is gezet (de cron-routes falen nu dicht).
--
-- NIET FIXEN — de advisor flagt deze vier ook als "RLS enabled, no policy", maar
-- dat is hier de BEDOELING: "RLS aan zonder policy" = deny-all = fail-closed. Ze
-- worden uitsluitend door de service-role geschreven (die RLS bypasst), dus
-- deny-all voor anon/authenticated is precies goed. Een policy toevoegen zou data
-- juist OPENZETTEN:
--   • app_events, hr_code_logs, stripe_webhook_events
--   • vita_dagstart — geverifieerd 15-07-2026: komt 0× voor in src/. Dode tabel,
--     geen lek, geen actie. Kandidaat om op te ruimen, niet om te "fixen".
