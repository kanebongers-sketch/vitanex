-- pgTAP: alleen-toevoegen-triggers, bevroren facturen, de toestandsmachines en de functies (migratie 460 en 461).
--
-- Draaien (alleen op een TESTdatabase of Supabase-branch, nooit op productie):
--   pg_prove -d "$TEST_DATABASE_URL" supabase/tests/club_betalen/02_alleen_toevoegen.sql
-- Alles gebeurt in een transactie die wordt teruggedraaid. De test zet kort een trigger uit
-- (alter table ... disable trigger) om te bewijzen dat knoeien met de hashketen opvalt; dat
-- vraagt de eigenaar van de tabel (de rol waarmee de migraties draaien).
--
-- Niet getest, om een lock op de hele tabel te vermijden: truncate op boekingen en audit
-- (die hebben een before-truncate-trigger met dezelfde functie als update en delete).

begin;
select plan(61);

-- ── Opzet ─────────────────────────────────────────────────────────────────────
-- Sportschool A: ...a0001, lid ...b0001, contract ...e0001 (actief). B en C: alleen voor de hashketen.
insert into public.club_vestigingen (vestiging, user_id, naam)
values ('budel', '00000000-0000-4000-8000-0000000a0001', 'Budel (test)') on conflict (vestiging) do nothing;
insert into public.club_leden (id, user_id, vestiging, voornaam, achternaam, email)
values ('00000000-0000-4000-8000-0000000b0001', '00000000-0000-4000-8000-0000000a0001', 'budel', 'Test', 'Lid', 'test@example.invalid');
insert into public.club_lidmaatschapsvormen (id, user_id, naam)
values ('00000000-0000-4000-8000-0000000c0001', '00000000-0000-4000-8000-0000000a0001', 'Testvorm');
insert into public.club_betalen_plannen (id, user_id, vorm_id, naam, interval_soort, bedrag_cent, btw_procent)
values ('00000000-0000-4000-8000-0000000d0001', '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000c0001', 'Maand', 'maand', 3000, 21);
insert into public.club_betalen_contracten (id, user_id, lid_id, plan_id, vorm_id, status, plan_naam, interval_soort, bedrag_cent, btw_procent, startdatum)
values ('00000000-0000-4000-8000-0000000e0001', '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001',
        '00000000-0000-4000-8000-0000000d0001', '00000000-0000-4000-8000-0000000c0001', 'actief', 'Maand', 'maand', 3000, 21, date '2026-01-01');

create function pg_temp.maak_factuur(
  p_id uuid, p_periode date,
  p_verkoper jsonb default '{"naam":"Testclub","kvk":"12345678","btw_nummer":"NL000000000B01","adres":"Straat 1, 1234AB Plaats"}'::jsonb,
  p_regel_excl integer default 1000
) returns void language sql as $f$
  insert into public.club_betalen_facturen
    (id, user_id, lid_id, contract_id, soort, periode_van, periode_tot, subtotaal_excl_cent, btw_cent, totaal_cent, verkoper, klant_naam, klant_adres, klant_email)
  values (p_id, '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', '00000000-0000-4000-8000-0000000e0001',
          'periode', p_periode, (p_periode + interval '1 month - 1 day')::date, 1000, 210, 1210, p_verkoper, 'Test Lid', 'Straat 2, 1234AB Plaats', 'test@example.invalid');
  insert into public.club_betalen_factuurregels (user_id, factuur_id, omschrijving, stukprijs_excl_cent, bedrag_excl_cent, btw_procent, btw_cent, bedrag_incl_cent)
  values ('00000000-0000-4000-8000-0000000a0001', p_id, 'Lidmaatschap', p_regel_excl, p_regel_excl, 21, 210, p_regel_excl + 210);
$f$;

create function pg_temp.maak_creditnota(p_id uuid, p_van uuid, p_excl integer, p_btw integer) returns void language sql as $f$
  insert into public.club_betalen_facturen
    (id, user_id, lid_id, soort, creditnota_van, subtotaal_excl_cent, btw_cent, totaal_cent, verkoper, klant_naam)
  values (p_id, '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', 'creditnota', p_van, p_excl, p_btw, p_excl + p_btw,
          '{"naam":"Testclub","kvk":"12345678","btw_nummer":"NL000000000B01","adres":"Straat 1, 1234AB Plaats"}'::jsonb, 'Test Lid');
  insert into public.club_betalen_factuurregels (user_id, factuur_id, omschrijving, stukprijs_excl_cent, bedrag_excl_cent, btw_procent, btw_cent, bedrag_incl_cent)
  values ('00000000-0000-4000-8000-0000000a0001', p_id, 'Correctie', p_excl, p_excl, 21, p_btw, p_excl + p_btw);
$f$;

-- ── Kasboek: alleen toevoegen ─────────────────────────────────────────────────
select pg_temp.maak_factuur('00000000-0000-4000-8000-000000f00001', date '2026-04-01');
select public.club_betalen_boek('00000000-0000-4000-8000-0000000a0001', 'factuur', 500, 'kasboek:1', null, null, '00000000-0000-4000-8000-0000000b0001');
select throws_ok($q$update public.club_betalen_boekingen set bedrag_cent = 600 where oorzaak = 'kasboek:1'$q$, 'AYG10', null, 'een boeking wijzigen mag niet');
select throws_ok($q$delete from public.club_betalen_boekingen where oorzaak = 'kasboek:1'$q$, 'AYG10', null, 'een boeking verwijderen mag niet');
select lives_ok($q$update public.club_betalen_boekingen set lid_id = null where oorzaak = 'kasboek:1'$q$, 'lid_id naar null mag wel (AVG)');
select is((select lid_id from public.club_betalen_boekingen where oorzaak = 'kasboek:1'), null::uuid, 'lid_id is nu leeg');
select throws_ok($q$update public.club_betalen_boekingen set lid_id = '00000000-0000-4000-8000-0000000b0001' where oorzaak = 'kasboek:1'$q$, 'AYG10', null, 'lid_id weer vullen mag niet');
select is((select bedrag_cent from public.club_betalen_boekingen where oorzaak = 'kasboek:1'), 500, 'het bedrag is onveranderd');

-- ── Controlelog: hashketen per sportschool ────────────────────────────────────
select is(public.club_betalen_audit_schrijf('00000000-0000-4000-8000-0000000a0002', 'systeem', null, 'test_een', 'test', null, null, '{"n":1}'), 1::bigint, 'B: eerste regel is volgnummer 1');
select is(public.club_betalen_audit_schrijf('00000000-0000-4000-8000-0000000a0002', 'eigenaar', 'beheerder-1', 'test_twee', 'test', null, '{"n":1}', '{"n":2}'), 2::bigint, 'B: tweede regel is volgnummer 2');
select is(public.club_betalen_audit_schrijf('00000000-0000-4000-8000-0000000a0002', 'stripe', null, 'test_drie', 'test', null, null, null), 3::bigint, 'B: derde regel is volgnummer 3');
select is(public.club_betalen_audit_schrijf('00000000-0000-4000-8000-0000000a0003', 'systeem', null, 'test_een', 'test', null, null, null), 1::bigint, 'C: een eigen keten begint opnieuw bij 1');
select is(public.club_betalen_audit_controleer('00000000-0000-4000-8000-0000000a0002'), null, 'B: de keten klopt');
select throws_ok($q$update public.club_betalen_audit set actie = 'knoeien' where user_id = '00000000-0000-4000-8000-0000000a0002' and volgnr = 2$q$, 'AYG10', null, 'audit wijzigen mag niet');
select throws_ok($q$delete from public.club_betalen_audit where user_id = '00000000-0000-4000-8000-0000000a0002' and volgnr = 2$q$, 'AYG10', null, 'audit verwijderen mag niet');
-- Knoeien met een uitgeschakelde trigger moet opvallen.
alter table public.club_betalen_audit disable trigger club_betalen_audit_vast;
update public.club_betalen_audit set actie = 'geknoeid' where user_id = '00000000-0000-4000-8000-0000000a0002' and volgnr = 2;
alter table public.club_betalen_audit enable trigger club_betalen_audit_vast;
select is(public.club_betalen_audit_controleer('00000000-0000-4000-8000-0000000a0002'), 2::bigint, 'B: de controle wijst het geknoeide volgnummer aan');
select is(public.club_betalen_audit_controleer('00000000-0000-4000-8000-0000000a0003'), null, 'C: de keten van een andere sportschool is niet geraakt');

-- ── Contractwijzigingen: alleen toevoegen ─────────────────────────────────────
insert into public.club_betalen_contract_wijzigingen (user_id, contract_id, soort)
values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0001', 'aangemaakt');
select throws_ok($q$update public.club_betalen_contract_wijzigingen set soort = 'anders'$q$, 'AYG10', null, 'een contractwijziging wijzigen mag niet');
select throws_ok($q$delete from public.club_betalen_contract_wijzigingen$q$, 'AYG10', null, 'een contractwijziging verwijderen mag niet');

-- ── Facturen: definitief maken en bevriezen ───────────────────────────────────
select pg_temp.maak_factuur('00000000-0000-4000-8000-000000f00002', date '2026-05-01');
select pg_temp.maak_factuur('00000000-0000-4000-8000-000000f00003', date '2026-06-01', '{}'::jsonb);
select pg_temp.maak_factuur('00000000-0000-4000-8000-000000f00004', date '2026-07-01', p_regel_excl => 900);

select is(public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000f00001'),
          'F' || extract(year from (now() at time zone 'Europe/Amsterdam'))::integer::text || '-00001', 'het eerste factuurnummer is 00001');
select is(public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000f00001'),
          'F' || extract(year from (now() at time zone 'Europe/Amsterdam'))::integer::text || '-00001', 'nog een keer definitief maken geeft hetzelfde nummer');
select is((select status from public.club_betalen_facturen where id = '00000000-0000-4000-8000-000000f00001'), 'definitief', 'de factuur is definitief');
select is((select sum(bedrag_cent) from public.club_betalen_boekingen where factuur_id = '00000000-0000-4000-8000-000000f00001'), 1210::bigint, 'het kasboek heeft de factuur +1210');
select throws_ok($q$update public.club_betalen_facturen set subtotaal_excl_cent = 2000, totaal_cent = 2210 where id = '00000000-0000-4000-8000-000000f00001'$q$, 'AYG11', null, 'bedragen van een definitieve factuur wijzigen mag niet');
select throws_ok($q$update public.club_betalen_facturen set klant_naam = 'Iemand anders' where id = '00000000-0000-4000-8000-000000f00001'$q$, 'AYG11', null, 'de klantnaam van een definitieve factuur wijzigen mag niet');
select lives_ok($q$update public.club_betalen_facturen set status = 'open' where id = '00000000-0000-4000-8000-000000f00001'$q$, 'de status mag wel verder');
select throws_ok($q$delete from public.club_betalen_facturen where id = '00000000-0000-4000-8000-000000f00001'$q$, 'AYG11', null, 'een definitieve factuur verwijderen mag niet');
select throws_ok($q$insert into public.club_betalen_factuurregels (user_id, factuur_id, omschrijving, stukprijs_excl_cent, bedrag_excl_cent, btw_procent, btw_cent, bedrag_incl_cent)
  values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000f00001', 'Extra', 100, 100, 21, 21, 121)$q$, 'AYG11', null, 'een regel toevoegen aan een definitieve factuur mag niet');
select throws_ok($q$update public.club_betalen_factuurregels set omschrijving = 'Anders' where factuur_id = '00000000-0000-4000-8000-000000f00001'$q$, 'AYG11', null, 'een regel wijzigen mag niet');
select throws_ok($q$delete from public.club_betalen_factuurregels where factuur_id = '00000000-0000-4000-8000-000000f00001'$q$, 'AYG11', null, 'een regel verwijderen mag niet');
select throws_ok($q$select public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000f00003')$q$, 'AYG04', null, 'zonder verkopergegevens (KvK, btw-nummer, adres) geen definitieve factuur');
select throws_ok($q$select public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000f00004')$q$, 'AYG05', null, 'regels die niet kloppen met het totaal geven geen definitieve factuur');
select lives_ok($q$delete from public.club_betalen_facturen where id = '00000000-0000-4000-8000-000000f00002'$q$, 'een concept mag weg');
select is((select count(*) from public.club_betalen_factuurregels where factuur_id = '00000000-0000-4000-8000-000000f00002'), 0::bigint, 'de regels van het concept zijn mee verwijderd');

-- ── Creditnota's ──────────────────────────────────────────────────────────────
select pg_temp.maak_creditnota('00000000-0000-4000-8000-000000f00010', '00000000-0000-4000-8000-000000f00001', 2000, 420);
select throws_ok($q$select public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000f00010')$q$, 'AYG06', null, 'een creditnota groter dan de factuur wordt geweigerd');
select pg_temp.maak_creditnota('00000000-0000-4000-8000-000000f00011', '00000000-0000-4000-8000-000000f00001', 1000, 210);
select is(public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000f00011'),
          'CN' || extract(year from (now() at time zone 'Europe/Amsterdam'))::integer::text || '-00001', 'een creditnota heeft een eigen reeks');
select is((select status from public.club_betalen_facturen where id = '00000000-0000-4000-8000-000000f00001'), 'gecrediteerd', 'volledig gecrediteerd zet de factuur op gecrediteerd');
select is((select sum(bedrag_cent) from public.club_betalen_boekingen where factuur_id = '00000000-0000-4000-8000-000000f00001'), 0::bigint, 'factuur en creditnota heffen elkaar op in het kasboek');

-- ── Betalingen: alleen vooruit ────────────────────────────────────────────────
select pg_temp.maak_factuur('00000000-0000-4000-8000-000000f00005', date '2026-08-01');
select public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000f00005');
insert into public.club_betalen_betalingen (id, user_id, lid_id, factuur_id, soort, poging, bedrag_cent)
values ('00000000-0000-4000-8000-000000a00001', '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', '00000000-0000-4000-8000-000000f00005', 'incasso', 1, 1210);

select is(public.club_betalen_betaling_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', 'aangeboden', 'pi_test123456'), 'ok', 'klaar naar aangeboden');
select is(public.club_betalen_betaling_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', 'aangeboden'), 'genegeerd', 'dezelfde toestand nog een keer wordt genegeerd');
select is(public.club_betalen_betaling_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', 'klaar'), 'genegeerd', 'een oudere toestand wordt genegeerd');
select is(public.club_betalen_betaling_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', 'geslaagd'), 'ok', 'aangeboden naar geslaagd (in_behandeling overslaan mag)');
select is((select status from public.club_betalen_facturen where id = '00000000-0000-4000-8000-000000f00005'), 'betaald', 'de factuur is betaald');
select is(public.club_betalen_betaling_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', 'mislukt'), 'afwijkend', 'mislukt na geslaagd is afwijkend');
select is(public.club_betalen_betaling_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', 'in_behandeling'), 'genegeerd', 'in_behandeling na geslaagd is een te late melding');
select is(public.club_betalen_betaling_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00099', 'geslaagd'), 'onbekend', 'een onbekende betaling');
select throws_ok($q$select public.club_betalen_betaling_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', 'verzonnen')$q$, 'AYG03', null, 'een onbekende toestand is een fout');

-- ── Terugbetalingen: nooit meer dan betaald ───────────────────────────────────
insert into public.club_betalen_terugbetalingen (user_id, betaling_id, factuur_id, bedrag_cent)
values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', '00000000-0000-4000-8000-000000f00005', 600);
select throws_ok($q$insert into public.club_betalen_terugbetalingen (user_id, betaling_id, factuur_id, bedrag_cent)
  values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', '00000000-0000-4000-8000-000000f00005', 700)$q$, 'AYG12', null, '600 plus 700 is meer dan de 1210 die betaald is');
select lives_ok($q$insert into public.club_betalen_terugbetalingen (user_id, betaling_id, factuur_id, bedrag_cent)
  values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', '00000000-0000-4000-8000-000000f00005', 610)$q$, '600 plus 610 is precies het betaalde bedrag');

-- ── Storno ────────────────────────────────────────────────────────────────────
select is(public.club_betalen_betaling_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', 'gestorneerd'), 'ok', 'geslaagd naar gestorneerd');
select is((select status from public.club_betalen_facturen where id = '00000000-0000-4000-8000-000000f00005'), 'open', 'de factuur is weer open');
select is((select sum(bedrag_cent) from public.club_betalen_boekingen where factuur_id = '00000000-0000-4000-8000-000000f00005'), 1210::bigint, 'kasboek: factuur +1210, betaling -1210, storno +1210');
select is(public.club_betalen_betaling_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', 'storno_teruggedraaid'), 'ok', 'gestorneerd naar storno_teruggedraaid');
select is((select sum(bedrag_cent) from public.club_betalen_boekingen where factuur_id = '00000000-0000-4000-8000-000000f00005'), 0::bigint, 'kasboek is weer in evenwicht');

-- ── Contracten: toegestane overgangen ─────────────────────────────────────────
select is(public.club_betalen_contract_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0001', 'gepauzeerd'), 'ok', 'actief naar gepauzeerd');
select is(public.club_betalen_contract_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0001', 'actief'), 'ok', 'gepauzeerd naar actief');
select is(public.club_betalen_contract_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0001', 'actief'), 'genegeerd', 'dezelfde toestand wordt genegeerd');
select throws_ok($q$select public.club_betalen_contract_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0001', 'beeindigd')$q$, 'AYG03', null, 'actief rechtstreeks naar beeindigd mag niet (eerst opzeggen)');
select is(public.club_betalen_contract_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0001', 'opgezegd', 'lid', null, 'opzeg_lid', date '2026-12-31', date '2026-12-31'), 'ok', 'actief naar opgezegd');
select is(public.club_betalen_contract_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0001', 'actief', 'lid'), 'ok', 'opzeggen intrekken');
select is((select count(*) from public.club_betalen_contract_wijzigingen where contract_id = '00000000-0000-4000-8000-0000000e0001' and soort = 'opzegging_ingetrokken'), 1::bigint, 'het intrekken van de opzegging is vastgelegd');
select is(public.club_betalen_contract_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0099', 'actief'), 'onbekend', 'een onbekend contract');

-- ── De keten van sportschool A klopt na alle acties ───────────────────────────
select is(public.club_betalen_audit_controleer('00000000-0000-4000-8000-0000000a0001'), null, 'A: de keten klopt na alle acties');

select * from finish();
rollback;
