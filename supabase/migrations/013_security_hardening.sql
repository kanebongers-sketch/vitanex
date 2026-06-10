-- ================================================================
-- MentaForce – Migratie 013: Security hardening
-- Lost de openstaande Supabase security advisories op (10 juni 2026):
--
--   1. Views checkin_status & fitness_voortgang → security_invoker,
--      plus bedrijf-scoping ín checkin_status zelf (cross-bedrijf lek dicht)
--   2. hr_code_logs: wereldwijd leesbare USING(true) policy vervangen
--      door bedrijfs-scoped policies
--   3. Mutable search_path op functions vastgezet
--   4. EXECUTE ingetrokken voor anon/authenticated op trigger-functions
--   5. Storage bucket "avatars": listing beperkt tot eigen map
--
-- NIET via SQL op te lossen (dashboard-instelling, zie PATCHNOTES):
--   6. Leaked password protection → Dashboard → Authentication →
--      Settings → "Leaked password protection" inschakelen.
--
-- De migratie is idempotent en defensief: functies die alleen in de
-- live database bestaan (update_laatste_checkin, handle_user_updated)
-- worden via DO-blokken behandeld als ze bestaan.
-- ================================================================

-- ── 0. Helper functions hardenen (gebruikt in views & policies) ───────────
-- CREATE OR REPLACE zet meteen een vaste search_path.
-- LET OP: deze blijven uitvoerbaar door authenticated — ze worden
-- aangeroepen vanuit RLS-policies en views.

create or replace function public.is_hr_or_admin(uid uuid) returns boolean
language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from profiles where id = uid and rol in ('hr', 'admin'));
$$;

create or replace function public.mijn_bedrijf_id() returns uuid
language sql security definer stable
set search_path = public, pg_temp
as $$
  select bedrijf_id from profiles where id = auth.uid();
$$;

grant execute on function public.is_hr_or_admin(uuid) to authenticated, service_role;
grant execute on function public.mijn_bedrijf_id() to authenticated, service_role;
revoke execute on function public.is_hr_or_admin(uuid) from anon;
revoke execute on function public.mijn_bedrijf_id() from anon;

-- ── 1a. checkin_status: security_invoker + bedrijf-scoping in de view ─────
-- Voorheen: SECURITY DEFINER zonder enige scoping — elke ingelogde user kon
-- met een willekeurige bedrijf_id de check-in status van ALLE bedrijven
-- opvragen (client filtert alleen .eq('bedrijf_id', ...)).
-- Nu: rijen zijn alleen zichtbaar voor HR/admin van het eigen bedrijf.
-- De bedrijf-check zit in de view zelf, dus zelfs een te ruime
-- profiles-policy kan geen cross-bedrijf lek meer veroorzaken.

drop view if exists public.checkin_status;

create view public.checkin_status
with (security_invoker = true) as
select
  p.id,
  p.naam,
  p.bedrijf_id,
  p.avatar_url,
  coalesce((
    select true from checkins c
    where c.user_id = p.id
      and c.created_at >= date_trunc('week', now() at time zone 'Europe/Brussels')
    limit 1
  ), false) as deze_week_ingevuld,
  (
    select round(
      (coalesce(c.energie,0) + coalesce(c.slaap,0) + coalesce(c.mentaal_focus,0)
       + coalesce(c.motivatie,0) + coalesce(c.mentaal_balans,0)) / 5.0, 1)
    from checkins c where c.user_id = p.id
    order by c.created_at desc limit 1
  ) as laatste_score,
  (
    select c.created_at from checkins c where c.user_id = p.id
    order by c.created_at desc limit 1
  ) as laatste_checkin
from profiles p
where p.rol = 'medewerker'
  and p.bedrijf_id is not null
  and p.bedrijf_id = public.mijn_bedrijf_id()
  and public.is_hr_or_admin(auth.uid());

-- Dashboard vereist login; anon heeft geen toegang nodig.
revoke all on public.checkin_status from anon, public;
grant select on public.checkin_status to authenticated, service_role;

-- ── 1b. fitness_voortgang: security_invoker ───────────────────────────────
-- Onderliggende tabellen (oefening_logs, training_logs) hebben
-- "eigen rijen lezen"-policies, dus met invoker-rechten ziet iedere
-- gebruiker uitsluitend de eigen progressie. (View wordt momenteel
-- nergens client-side gebruikt.)

drop view if exists public.fitness_voortgang;

create view public.fitness_voortgang
with (security_invoker = true) as
select
  ol.user_id,
  ol.oefening_naam,
  date_trunc('week', tl.datum::timestamptz)::date as week_start,
  max(ol.gewicht_kg)                              as max_gewicht,
  sum(ol.herhalingen * coalesce(ol.gewicht_kg, 0))
    * count(distinct ol.set_nummer)               as totaal_volume,
  count(distinct tl.id)                           as aantal_sessies
from oefening_logs ol
join training_logs tl on tl.id = ol.training_log_id
where ol.gewicht_kg is not null
  or ol.herhalingen is not null
group by
  ol.user_id,
  ol.oefening_naam,
  date_trunc('week', tl.datum::timestamptz)::date;

revoke all on public.fitness_voortgang from anon, public;
grant select on public.fitness_voortgang to authenticated, service_role;

-- ── 2. hr_code_logs: USING(true) policy vervangen ─────────────────────────
-- De live policy "Service role only" met USING(true) maakte de tabel
-- feitelijk wereldwijd leesbaar (service_role omzeilt RLS sowieso, dus die
-- policy beschermde niets). Alle bestaande policies gaan eraf en worden
-- vervangen door een canonieke, bedrijfs-scoped set.

alter table public.hr_code_logs enable row level security;

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'hr_code_logs'
  loop
    execute format('drop policy %I on public.hr_code_logs', pol.policyname);
  end loop;
end $$;

create policy "hr_code_logs: eigen lezen"
  on public.hr_code_logs for select
  using (auth.uid() = user_id);

create policy "hr_code_logs: eigen aanmaken"
  on public.hr_code_logs for insert
  with check (auth.uid() = user_id);

create policy "hr_code_logs: hr leest eigen bedrijf"
  on public.hr_code_logs for select
  using (
    public.is_hr_or_admin(auth.uid())
    and bedrijf_id = public.mijn_bedrijf_id()
  );

-- ── 3. Mutable search_path vastzetten ─────────────────────────────────────
-- Geldt voor alle genoemde functions, ongeacht signatuur. Functions die
-- niet (meer) bestaan worden stilzwijgend overgeslagen.

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'update_laatste_checkin',
        'generate_hr_code',
        'set_hr_code_on_insert',
        'handle_new_user',
        'handle_user_updated',
        'genereer_hr_code',
        'bedrijf_hr_code_trigger',
        'update_bijgewerkt_op'
      )
  loop
    execute format('alter function %s set search_path = public, pg_temp', f.sig);
  end loop;
end $$;

-- ── 4. EXECUTE intrekken op trigger-only functions ────────────────────────
-- Pure trigger-functions: bij het afvuren van een trigger wordt géén
-- runtime EXECUTE-check gedaan, dus intrekken voor client-rollen is veilig.

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'handle_new_user',
        'handle_user_updated',
        'update_laatste_checkin',
        'set_hr_code_on_insert',
        'bedrijf_hr_code_trigger',
        'update_bijgewerkt_op'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

-- Code-generators worden tijdens een client-side INSERT op bedrijven
-- aangeroepen vanuit de trigger (geneste call → runtime EXECUTE-check
-- tegen de invoker). authenticated moet ze dus kunnen uitvoeren;
-- anon niet. Ze lekken niets: ze geven enkel een ongebruikte random code.

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('generate_hr_code', 'genereer_hr_code')
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
end $$;

-- ── 5. Storage: avatars bucket — listing beperken ─────────────────────────
-- De bucket blijft public (avatar-weergave loopt via getPublicUrl en
-- public buckets serveren downloads buiten RLS om), maar list/select via
-- de storage API wordt beperkt tot de eigen map. Uploadpad in de app is
-- `${userId}/avatar.jpg`, dus map 1 == auth.uid().

do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') ilike '%avatars%'
        or coalesce(with_check, '') ilike '%avatars%')
  loop
    execute format('drop policy %I on storage.objects', pol.policyname);
  end loop;
end $$;

create policy "avatars: eigen map lezen"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: eigen map uploaden"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: eigen map bijwerken"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: eigen map verwijderen"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
