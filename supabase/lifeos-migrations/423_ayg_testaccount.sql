-- ─── AI Your Gym: testaccount "Test Gym" ────────────────────────────────────
-- Een duidelijk gemarkeerde test-sportschool (demo = true) om het portaal van
-- een eigenaar te testen, zoals een betaalde aanmelding hem zou krijgen
-- (src/lib/aiyourgym/sportschool.ts): eigen omgeving onder Kane, adres testgym,
-- een vestiging, de basisbibliotheek met oefeningen en een eigenaar-beheerder.
-- Kane ziet hem in de sportschool-wissel van Club.
--
-- De persoonlijke code van de eigenaar wordt hier willekeurig gemaakt (144 bits)
-- en staat nergens in de code; Kane vindt de link in het huisstijl-portaal bij
-- Beheerders. Er is geen pincode: die kiest de testeigenaar en keurt Kane goed.
-- test@aiyourgym.com is alleen een label (er wordt niets naartoe gestuurd).
-- Idempotent; voegt alleen toe.

do $$
declare
  org uuid := '7e570000-0000-4000-8000-000000000001';
  kane uuid;
begin
  select user_id into kane from public.pt_lead_links where rol = 'beheerder' and actief limit 1;
  if kane is null then raise exception 'Geen beheerder gevonden.'; end if;

  insert into public.club_organisaties (id, beheerder_id, naam, slogan, logo, kleur_accent, thema, demo, slug)
  select org, kane, 'Test Gym', 'Testaccount van AI Your Gym', null, '#3E63DD', 'licht', true, 'testgym'
  where not exists (select 1 from public.club_organisaties where id = org or slug = 'testgym' or (beheerder_id = kane and lower(naam) = 'test gym'));

  if not exists (select 1 from public.club_organisaties where id = org) then return; end if;

  insert into public.club_vestigingen (vestiging, user_id, naam, adres, regels, openingstijden, volgorde, standaard)
  values ('testgym-centrum', org, 'Test Gym Centrum', null,
    '{"annuleer_uren":2,"no_show_drempel":3,"no_show_blokkade_dagen":7,"reserveer_dagen_vooruit":7,"max_open_reserveringen":5,"checkin_venster_min":15}'::jsonb,
    '{"1":["07:00","22:00"],"2":["07:00","22:00"],"3":["07:00","22:00"],"4":["07:00","22:00"],"5":["07:00","22:00"],"6":["09:00","16:00"],"7":["09:00","16:00"]}'::jsonb, 1, true)
  on conflict (vestiging) do nothing;

  -- Basisbibliotheek: zoals maakOrganisatie, zonder de eigen coaching van Fit Factory.
  if not exists (select 1 from public.club_oefeningen where user_id = org) then
    insert into public.club_oefeningen (user_id, actief, naam, spiergroep, materiaal, niveau, uitleg, aandachtspunten, patroon, belast,
      beeld_start, beeld_eind, beeld_bron, beeld_licentie, spieren_primair, spieren_secundair)
    select org, true, naam, spiergroep, materiaal, niveau, uitleg, aandachtspunten, patroon, belast,
      beeld_start, beeld_eind, beeld_bron, beeld_licentie, spieren_primair, spieren_secundair
    from public.club_oefeningen where user_id = kane and actief;
  end if;

  insert into public.club_beheerders (organisatie_id, naam, email, rol, code)
  select org, 'Test Eigenaar', 'test@aiyourgym.com', 'eigenaar',
    translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/', '-_')
  where not exists (select 1 from public.club_beheerders where organisatie_id = org and email = 'test@aiyourgym.com');

  insert into public.ayg_aanmeldingen (pakket, sportschool_naam, slug, aantal_vestigingen, eigenaar_naam, eigenaar_email, eigenaar_telefoon, status, organisatie_id, akkoord_op)
  select 'club', 'Test Gym', 'testgym', 1, 'Test Eigenaar', 'test@aiyourgym.com', '0000000000', 'test', org, now()
  where not exists (select 1 from public.ayg_aanmeldingen where status = 'test' and slug = 'testgym');
end $$;
