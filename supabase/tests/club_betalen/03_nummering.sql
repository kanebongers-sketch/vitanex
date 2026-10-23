-- pgTAP: factuurnummers zonder gaten en zonder dubbelen (migratie 461), een sessie na elkaar.
-- Gelijktijdige aanroepen test 03_nummering_gelijktijdig.sh.
--
-- Draaien (alleen op een TESTdatabase of Supabase-branch, nooit op productie):
--   pg_prove -d "$TEST_DATABASE_URL" supabase/tests/club_betalen/03_nummering.sql
-- Alles gebeurt in een transactie die wordt teruggedraaid.

begin;
select plan(12);

-- Handmatige facturen hebben geen contract of lid nodig: ideaal voor een nummertest.
create function pg_temp.maak_handmatig(p_org uuid, p_id uuid) returns void language sql as $f$
  insert into public.club_betalen_facturen (id, user_id, soort, subtotaal_excl_cent, btw_cent, totaal_cent, verkoper, klant_naam)
  values (p_id, p_org, 'handmatig', 1000, 210, 1210,
          '{"naam":"Testclub","kvk":"12345678","btw_nummer":"NL000000000B01","adres":"Straat 1, 1234AB Plaats"}'::jsonb, 'Test Klant');
  insert into public.club_betalen_factuurregels (user_id, factuur_id, omschrijving, stukprijs_excl_cent, bedrag_excl_cent, btw_procent, btw_cent, bedrag_incl_cent)
  values (p_org, p_id, 'Losse factuur', 1000, 1000, 21, 210, 1210);
$f$;

-- Sportschool D krijgt zes concepten; E een.
select pg_temp.maak_handmatig('00000000-0000-4000-8000-0000000a00d0', ('00000000-0000-4000-8000-00000000d0' || lpad(n::text, 2, '0'))::uuid)
from generate_series(1, 6) as n;
select pg_temp.maak_handmatig('00000000-0000-4000-8000-0000000a00e0', '00000000-0000-4000-8000-00000000e001');

-- Een vaste uitgiftedatum, zodat de test niet van het jaar afhangt.
select is(public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a00d0', '00000000-0000-4000-8000-00000000d001', date '2026-03-10'), 'F2026-00001', 'eerste nummer');
select is(public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a00d0', '00000000-0000-4000-8000-00000000d002', date '2026-03-11'), 'F2026-00002', 'tweede nummer');
select is(public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a00d0', '00000000-0000-4000-8000-00000000d003', date '2026-03-12'), 'F2026-00003', 'derde nummer');

-- Een mislukte transactie laat geen gat achter: de teller rolt mee terug.
savepoint voor_mislukking;
select public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a00d0', '00000000-0000-4000-8000-00000000d004', date '2026-03-13');
rollback to savepoint voor_mislukking;
select is((select laatste_nummer from public.club_betalen_factuurreeksen
            where user_id = '00000000-0000-4000-8000-0000000a00d0' and soort = 'factuur' and jaar = 2026), 3, 'na een teruggedraaide poging staat de teller nog op 3');
select is(public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a00d0', '00000000-0000-4000-8000-00000000d004', date '2026-03-13'), 'F2026-00004', 'het volgende nummer is 00004: geen gat');

-- Een ander jaar begint opnieuw, het oude jaar blijft staan.
select is(public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a00d0', '00000000-0000-4000-8000-00000000d005', date '2027-01-04'), 'F2027-00001', 'een nieuw jaar begint bij 00001');
select is(public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a00d0', '00000000-0000-4000-8000-00000000d006', date '2026-12-31'), 'F2026-00005', 'het oude jaar gaat gewoon door');

-- Een andere sportschool heeft een eigen reeks.
select is(public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a00e0', '00000000-0000-4000-8000-00000000e001', date '2026-03-10'), 'F2026-00001', 'sportschool E begint zelf bij 00001');

-- Dubbel aanroepen geeft hetzelfde nummer en gebruikt er geen extra.
select is(public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a00d0', '00000000-0000-4000-8000-00000000d002', date '2026-04-01'), 'F2026-00002', 'opnieuw definitief maken geeft het bestaande nummer');
select is((select laatste_nummer from public.club_betalen_factuurreeksen
            where user_id = '00000000-0000-4000-8000-0000000a00d0' and soort = 'factuur' and jaar = 2026), 5, 'en de teller liep niet op');

-- Geen dubbele nummers binnen een sportschool.
select is((select count(distinct nummer) from public.club_betalen_facturen where user_id = '00000000-0000-4000-8000-0000000a00d0' and nummer is not null),
          (select count(*) from public.club_betalen_facturen where user_id = '00000000-0000-4000-8000-0000000a00d0' and nummer is not null), 'alle nummers zijn uniek');
select throws_ok($q$update public.club_betalen_facturen set nummer = 'F2026-00001' where id = '00000000-0000-4000-8000-00000000d002'$q$, 'AYG11', null,
                 'een nummer na het definitief maken aanpassen kan niet (bevroren of dubbel)');

select * from finish();
rollback;
