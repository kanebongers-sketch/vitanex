-- ─── Club: extra bescherming van de logins (ledenlogin, personeelslogin) ────
-- Beveiligingsreview 18-10-2026. De code filtert al overal op de sportschool
-- (user_id); dit legt hetzelfde vast in de database, zodat een fout in de code
-- of een handmatige ingreep nooit een sessie of inlogcode aan het verkeerde
-- lid, de verkeerde medewerker of de verkeerde sportschool kan koppelen.
--
-- Alleen toevoegen, nooit verwijderen. Idempotent. De beperkingen komen eerst
-- als NOT VALID (geldt voor nieuwe rijen) en worden daarna gevalideerd; faalt
-- een validatie op bestaande rijen, dan is dat een echte tenant-fout om na te
-- kijken. Nog NIET uitgevoerd: Kane voert dit uit na nalezen.

-- 1. Doel van de samengestelde sleutels.
create unique index if not exists club_leden_id_user on public.club_leden (id, user_id);
create unique index if not exists club_medewerkers_id_user on public.club_medewerkers (id, user_id);
create unique index if not exists club_lid_toegang_id_user_lid on public.club_lid_toegang (id, user_id, lid_id);
create unique index if not exists club_medewerker_toegang_id_user_mw on public.club_medewerker_toegang (id, user_id, medewerker_id);

-- 2. Een inlogcode hoort bij een lid of medewerker van dezelfde sportschool.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_lid_toegang_lid_zelfde_org') then
    alter table public.club_lid_toegang
      add constraint club_lid_toegang_lid_zelfde_org foreign key (lid_id, user_id)
      references public.club_leden (id, user_id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'club_medewerker_toegang_mw_zelfde_org') then
    alter table public.club_medewerker_toegang
      add constraint club_medewerker_toegang_mw_zelfde_org foreign key (medewerker_id, user_id)
      references public.club_medewerkers (id, user_id) on delete cascade not valid;
  end if;

  -- 3. Een sessie hoort bij precies de toegang, het lid/de medewerker en de sportschool waarvoor hij is gemaakt.
  if not exists (select 1 from pg_constraint where conname = 'club_lid_sessies_toegang_zelfde') then
    alter table public.club_lid_sessies
      add constraint club_lid_sessies_toegang_zelfde foreign key (toegang_id, user_id, lid_id)
      references public.club_lid_toegang (id, user_id, lid_id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'club_medewerker_sessies_toegang_zelfde') then
    alter table public.club_medewerker_sessies
      add constraint club_medewerker_sessies_toegang_zelfde foreign key (toegang_id, user_id, medewerker_id)
      references public.club_medewerker_toegang (id, user_id, medewerker_id) on delete cascade not valid;
  end if;

  -- 4. Een pincode staat alleen als scrypt-hash ("salt:hash", hex) in de database.
  if not exists (select 1 from pg_constraint where conname = 'club_lid_toegang_pin_hash_vorm') then
    alter table public.club_lid_toegang
      add constraint club_lid_toegang_pin_hash_vorm check (pin_hash is null or pin_hash ~ '^[0-9a-f]{32}:[0-9a-f]{64}$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'club_medewerker_toegang_pin_hash_vorm') then
    alter table public.club_medewerker_toegang
      add constraint club_medewerker_toegang_pin_hash_vorm check (pin_hash is null or pin_hash ~ '^[0-9a-f]{32}:[0-9a-f]{64}$') not valid;
  end if;
end $$;

-- Valideren (bestaande rijen controleren). Zie de opmerking bovenaan bij een fout.
alter table public.club_lid_toegang validate constraint club_lid_toegang_lid_zelfde_org;
alter table public.club_medewerker_toegang validate constraint club_medewerker_toegang_mw_zelfde_org;
alter table public.club_lid_sessies validate constraint club_lid_sessies_toegang_zelfde;
alter table public.club_medewerker_sessies validate constraint club_medewerker_sessies_toegang_zelfde;
alter table public.club_lid_toegang validate constraint club_lid_toegang_pin_hash_vorm;
alter table public.club_medewerker_toegang validate constraint club_medewerker_toegang_pin_hash_vorm;

-- 5. Verlopen sessies opruimen (de code doet dat alleen bij een nieuwe login).
--    Handmatig of via pg_cron aan te roepen; alleen voor de server.
create or replace function public.club_login_sessies_opruimen()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n1 integer;
  n2 integer;
begin
  delete from public.club_lid_sessies where verloopt_op < now();
  get diagnostics n1 = row_count;
  delete from public.club_medewerker_sessies where verloopt_op < now();
  get diagnostics n2 = row_count;
  return n1 + n2;
end;
$$;

revoke all on function public.club_login_sessies_opruimen() from public, anon, authenticated;
grant execute on function public.club_login_sessies_opruimen() to service_role;

-- Optioneel, elke nacht (als pg_cron aan staat):
-- select cron.schedule('club-login-sessies-opruimen', '17 3 * * *', $$select public.club_login_sessies_opruimen()$$);
