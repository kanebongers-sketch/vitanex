-- pgTAP: de harde remmen van het lidgeld (migratie 460 en 461).
--
-- Draaien (alleen op een TESTdatabase of Supabase-branch, nooit op productie):
--   pg_prove -d "$TEST_DATABASE_URL" supabase/tests/club_betalen/*.sql
-- of in de SQL-editor van een testproject (pgTAP aanzetten: create extension pgtap with schema extensions).
-- Alles gebeurt in een transactie die wordt teruggedraaid; er blijft niets achter.
--
-- Wat dit bewijst:
--   * een lopend contract per lid per vorm
--   * een periodefactuur per contract per periode (de rem tegen een dubbele maandfactuur)
--   * hooguit een lopende betaalpoging per factuur
--   * een kasboekregel per (sportschool, soort, oorzaak)
--   * unieke herinneringen en idempotentiesleutels
--   * geen overlappende pauzes

begin;
select plan(16);

-- ── Opzet: een sportschool, een lid, een vorm, een plan en een contract ───────
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

create function pg_temp.maak_factuur(p_id uuid, p_periode date) returns void language sql as $f$
  insert into public.club_betalen_facturen
    (id, user_id, lid_id, contract_id, soort, periode_van, periode_tot, subtotaal_excl_cent, btw_cent, totaal_cent, verkoper, klant_naam)
  values (p_id, '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', '00000000-0000-4000-8000-0000000e0001',
          'periode', p_periode, (p_periode + interval '1 month - 1 day')::date, 1000, 210, 1210,
          '{"naam":"Testclub","kvk":"12345678","btw_nummer":"NL000000000B01","adres":"Straat 1, 1234AB Plaats"}'::jsonb, 'Test Lid');
$f$;

-- ── Contracten ────────────────────────────────────────────────────────────────
select throws_ok(
  $q$insert into public.club_betalen_contracten (user_id, lid_id, plan_id, vorm_id, status, plan_naam, interval_soort, bedrag_cent, btw_procent, startdatum)
     values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', '00000000-0000-4000-8000-0000000d0001',
             '00000000-0000-4000-8000-0000000c0001', 'concept', 'Maand', 'maand', 3000, 21, date '2026-02-01')$q$,
  '23505', null, 'een tweede lopend contract voor dezelfde vorm wordt geweigerd');

update public.club_betalen_contracten set status = 'beeindigd' where id = '00000000-0000-4000-8000-0000000e0001';
select lives_ok(
  $q$insert into public.club_betalen_contracten (user_id, lid_id, plan_id, vorm_id, status, plan_naam, interval_soort, bedrag_cent, btw_procent, startdatum)
     values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', '00000000-0000-4000-8000-0000000d0001',
             '00000000-0000-4000-8000-0000000c0001', 'actief', 'Maand', 'maand', 3000, 21, date '2026-03-01')$q$,
  'na een beeindigd contract mag een nieuw contract');

-- ── Facturen: een per contract per periode ────────────────────────────────────
select pg_temp.maak_factuur('00000000-0000-4000-8000-000000f00001', date '2026-04-01');
select throws_ok(
  $q$select pg_temp.maak_factuur('00000000-0000-4000-8000-000000f00002', date '2026-04-01')$q$,
  '23505', null, 'een tweede periodefactuur voor dezelfde periode wordt geweigerd');
select lives_ok(
  $q$select pg_temp.maak_factuur('00000000-0000-4000-8000-000000f00003', date '2026-05-01')$q$,
  'een volgende periode mag wel');
select lives_ok(
  $q$insert into public.club_betalen_facturen (user_id, contract_id, soort) values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0001', 'handmatig')$q$,
  'een handmatige factuur valt buiten de periode-rem');
select throws_ok(
  $q$insert into public.club_betalen_facturen (user_id, contract_id, soort) values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0001', 'periode')$q$,
  '23514', null, 'een periodefactuur zonder periode wordt geweigerd');

-- Factuurnummer uniek per sportschool (via een directe update op een concept met nummer is niet mogelijk
-- zonder definitief te zijn, dus via de unieke index zelf).
select has_index('public', 'club_betalen_facturen', 'club_betalen_facturen_nummer', 'unieke index op het factuurnummer bestaat');

-- ── Betalingen: hooguit een lopende poging per factuur ────────────────────────
select lives_ok(
  $q$insert into public.club_betalen_betalingen (id, user_id, lid_id, factuur_id, soort, poging, bedrag_cent)
     values ('00000000-0000-4000-8000-000000a00001', '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001',
             '00000000-0000-4000-8000-000000f00001', 'incasso', 1, 1210)$q$,
  'een eerste poging is goed');
select throws_ok(
  $q$insert into public.club_betalen_betalingen (user_id, factuur_id, soort, poging, bedrag_cent)
     values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000f00001', 'incasso', 2, 1210)$q$,
  '23505', null, 'een tweede lopende poging voor dezelfde factuur wordt geweigerd');
update public.club_betalen_betalingen set status = 'mislukt' where id = '00000000-0000-4000-8000-000000a00001';
select lives_ok(
  $q$insert into public.club_betalen_betalingen (user_id, factuur_id, soort, poging, bedrag_cent)
     values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000f00001', 'incasso', 2, 1210)$q$,
  'na een mislukte poging mag een nieuwe');

-- ── Kasboek: een regel per (sportschool, soort, oorzaak) ──────────────────────
select is(public.club_betalen_boek('00000000-0000-4000-8000-0000000a0001', 'factuur', 1210, 'test:1', '00000000-0000-4000-8000-000000f00001'),
          true, 'de eerste boeking wordt toegevoegd');
select is(public.club_betalen_boek('00000000-0000-4000-8000-0000000a0001', 'factuur', 1210, 'test:1', '00000000-0000-4000-8000-000000f00001'),
          false, 'dezelfde boeking nog een keer is onschadelijk');
select throws_ok(
  $q$select public.club_betalen_boek('00000000-0000-4000-8000-0000000a0001', 'factuur', 999, 'test:1', '00000000-0000-4000-8000-000000f00001')$q$,
  'AYG13', null, 'dezelfde oorzaak met een ander bedrag is een fout');

-- ── Herinneringen en outbox ───────────────────────────────────────────────────
insert into public.club_betalen_herinneringen (user_id, lid_id, factuur_id, stap, kanaal)
values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', '00000000-0000-4000-8000-000000f00003', 1, 'mail');
select throws_ok(
  $q$insert into public.club_betalen_herinneringen (user_id, factuur_id, stap, kanaal)
     values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000f00003', 1, 'mail')$q$,
  '23505', null, 'dezelfde herinnering (factuur, stap, kanaal) kan maar een keer');

insert into public.club_betalen_opdrachten (user_id, soort, idempotentie_sleutel)
values ('00000000-0000-4000-8000-0000000a0001', 'incasso', 'ayg_incasso_00000000-0000-4000-8000-000000a00001');
select throws_ok(
  $q$insert into public.club_betalen_opdrachten (user_id, soort, idempotentie_sleutel)
     values ('00000000-0000-4000-8000-0000000a0001', 'incasso', 'ayg_incasso_00000000-0000-4000-8000-000000a00001')$q$,
  '23505', null, 'dezelfde idempotentiesleutel kan maar een keer in de outbox');

-- ── Pauzes zonder overlap ─────────────────────────────────────────────────────
-- Eerst een stabiel contract: het eerste is beeindigd, het nieuwe heeft een eigen id.
insert into public.club_betalen_pauzes (user_id, contract_id, van, tot)
values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0001', date '2026-06-01', date '2026-06-30');
select throws_ok(
  $q$insert into public.club_betalen_pauzes (user_id, contract_id, van, tot)
     values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0001', date '2026-06-30', date '2026-07-15')$q$,
  '23P01', null, 'een pauze die overlapt (ook een dag) wordt geweigerd');

select * from finish();
rollback;
