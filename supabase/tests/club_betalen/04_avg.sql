-- pgTAP: AVG voor het lidgeld (migratie 462): blokkades, definitief verwijderen en de nachtelijke opruiming.
--
-- Draaien (alleen op een TESTdatabase of Supabase-branch, nooit op productie):
--   pg_prove -d "$TEST_DATABASE_URL" supabase/tests/club_betalen/04_avg.sql
-- Alles gebeurt in een transactie die wordt teruggedraaid. Let op: club_privacy_opruimen() loopt
-- over ALLE sportscholen van de database; dat is op een testdatabase geen probleem en alles wordt
-- teruggedraaid, maar draai dit dus nooit op productie.
-- De test zet kort een trigger uit (bewaren_tot in het verleden zetten kan anders niet).

begin;
select plan(42);

-- ── Opzet ─────────────────────────────────────────────────────────────────────
-- Sportschool A (...a0001), lid L1 (...b0001) met contract c1, plan en vorm.
insert into public.club_organisaties (id, beheerder_id, naam)
values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000a0001', 'Testclub') on conflict (id) do nothing;
insert into public.club_vestigingen (vestiging, user_id, naam)
values ('budel', '00000000-0000-4000-8000-0000000a0001', 'Budel (test)') on conflict (vestiging) do nothing;
insert into public.club_leden (id, user_id, vestiging, voornaam, achternaam, email)
values ('00000000-0000-4000-8000-0000000b0001', '00000000-0000-4000-8000-0000000a0001', 'budel', 'Test', 'Lid', 'test@example.invalid');
insert into public.club_lidmaatschapsvormen (id, user_id, naam)
values ('00000000-0000-4000-8000-0000000c0001', '00000000-0000-4000-8000-0000000a0001', 'Testvorm');
insert into public.club_betalen_plannen (id, user_id, vorm_id, naam, interval_soort, bedrag_cent, btw_procent)
values ('00000000-0000-4000-8000-0000000d0001', '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000c0001', 'Maand', 'maand', 3000, 21);
insert into public.club_betalen_contracten (id, user_id, lid_id, plan_id, vorm_id, status, plan_naam, interval_soort, bedrag_cent, btw_procent, startdatum, notitie)
values ('00000000-0000-4000-8000-0000000e0001', '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001',
        '00000000-0000-4000-8000-0000000d0001', '00000000-0000-4000-8000-0000000c0001', 'actief', 'Maand', 'maand', 3000, 21, date '2026-01-01', 'geheime notitie');

create function pg_temp.maak_factuur(p_id uuid, p_periode date) returns void language sql as $f$
  insert into public.club_betalen_facturen
    (id, user_id, lid_id, contract_id, soort, periode_van, periode_tot, subtotaal_excl_cent, btw_cent, totaal_cent, verkoper, klant_naam, klant_adres, klant_email)
  values (p_id, '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', '00000000-0000-4000-8000-0000000e0001',
          'periode', p_periode, (p_periode + interval '1 month - 1 day')::date, 1000, 210, 1210,
          '{"naam":"Testclub","kvk":"12345678","btw_nummer":"NL000000000B01","adres":"Straat 1, 1234AB Plaats"}'::jsonb,
          'Test Lid', 'Straat 2, 1234AB Plaats', 'test@example.invalid');
  insert into public.club_betalen_factuurregels (user_id, factuur_id, omschrijving, stukprijs_excl_cent, bedrag_excl_cent, btw_procent, btw_cent, bedrag_incl_cent)
  values ('00000000-0000-4000-8000-0000000a0001', p_id, 'Lidmaatschap', 1000, 1000, 21, 210, 1210);
$f$;

-- ── Blokkades: geld gaat voor ─────────────────────────────────────────────────
select throws_ok($q$select public.club_lid_verwijderen_aanvragen('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', 'test')$q$,
                 'AYG01', null, 'aanvragen wordt geweigerd bij een lopend contract');
select throws_ok($q$select public.club_lid_definitief_verwijderen('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', 'test')$q$,
                 'AYG01', null, 'definitief verwijderen wordt ook geweigerd bij een lopend contract');
select is(public.club_betalen_lid_blokkade('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001'), 'contract', 'reden: contract');

update public.club_betalen_contracten set status = 'beeindigd' where id = '00000000-0000-4000-8000-0000000e0001';
select is(public.club_betalen_lid_blokkade('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001'), null::text, 'een beeindigd contract blokkeert niet');

select pg_temp.maak_factuur('00000000-0000-4000-8000-000000f00001', date '2026-04-01');
select public.club_betalen_factuur_definitief('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000f00001', date '2026-04-01');
select is(public.club_betalen_lid_blokkade('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001'), 'factuur', 'reden: open factuur');

insert into public.club_betalen_betalingen (id, user_id, lid_id, factuur_id, soort, poging, bedrag_cent, fout_bericht)
values ('00000000-0000-4000-8000-000000a00001', '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001',
        '00000000-0000-4000-8000-000000f00001', 'incasso', 1, 1210, 'vrije tekst van Stripe');
update public.club_betalen_facturen set status = 'betaald', betaald_cent = 1210 where id = '00000000-0000-4000-8000-000000f00001';
select is(public.club_betalen_lid_blokkade('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001'), 'betaling', 'reden: lopende betaling');
select public.club_betalen_betaling_overgang('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-000000a00001', 'geslaagd', 'pi_test123456');
select is(public.club_betalen_lid_blokkade('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001'), null::text, 'een betaalde factuur blokkeert niet');

insert into public.club_betalen_geschillen (id, user_id, lid_id, betaling_id, factuur_id, bedrag_cent, toelichting)
values ('00000000-0000-4000-8000-000000a10001', '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001',
        '00000000-0000-4000-8000-000000a00001', '00000000-0000-4000-8000-000000f00001', 1210, 'vrije tekst geschil');
select is(public.club_betalen_lid_blokkade('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001'), 'geschil', 'reden: open geschil');
update public.club_betalen_geschillen set status = 'gewonnen' where id = '00000000-0000-4000-8000-000000a10001';

insert into public.club_betalen_opdrachten (user_id, lid_id, soort, idempotentie_sleutel)
values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', 'incasso', 'ayg_incasso_00000000-0000-4000-8000-000000a00001');
select is(public.club_betalen_lid_blokkade('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001'), 'opdracht', 'reden: openstaande opdracht aan Stripe');
update public.club_betalen_opdrachten set status = 'klaar', klaar_op = now() where idempotentie_sleutel = 'ayg_incasso_00000000-0000-4000-8000-000000a00001';
select is(public.club_betalen_lid_blokkade('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001'), null::text, 'alles is klaar: geen blokkade meer');

-- ── Gegevens die bij verwijderen moeten wijzigen of weggaan ───────────────────
insert into public.club_betalen_terugbetalingen (user_id, lid_id, betaling_id, factuur_id, bedrag_cent, toelichting)
values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', '00000000-0000-4000-8000-000000a00001',
        '00000000-0000-4000-8000-000000f00001', 100, 'vrije tekst terugbetaling');
update public.club_betalen_terugbetalingen set status = 'geslaagd' where betaling_id = '00000000-0000-4000-8000-000000a00001';
insert into public.club_betalen_klanten (id, user_id, lid_id, stripe_klant_id, stripe_account_id)
values ('00000000-0000-4000-8000-000000a20001', '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', 'cus_test123456', 'acct_test123456');
insert into public.club_betalen_mandaten (id, user_id, lid_id, klant_id, stripe_pm_id, type, laatste4, is_standaard, laatste_incasso_op)
values ('00000000-0000-4000-8000-000000a30001', '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001',
        '00000000-0000-4000-8000-000000a20001', 'pm_test123456', 'sepa_debit', '1234', true, now() - interval '1 month'),
       ('00000000-0000-4000-8000-000000a30002', '00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001',
        '00000000-0000-4000-8000-000000a20001', 'pm_test654321', 'sepa_debit', '5678', false, now() - interval '14 months');
insert into public.club_betalen_herinneringen (user_id, lid_id, factuur_id, stap, kanaal)
values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', '00000000-0000-4000-8000-000000f00001', 1, 'mail');
insert into public.club_betalen_pauzes (user_id, contract_id, lid_id, van, tot, status, reden)
values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000e0001', '00000000-0000-4000-8000-0000000b0001', date '2026-02-01', date '2026-02-28', 'beeindigd', 'blessure');
insert into public.club_betalen_gezinnen (id, user_id, naam, hoofd_lid_id)
values ('00000000-0000-4000-8000-000000a40001', '00000000-0000-4000-8000-0000000a0001', 'Familie Test', '00000000-0000-4000-8000-0000000b0001');
select pg_temp.maak_factuur('00000000-0000-4000-8000-000000f00002', date '2026-05-01');

-- ── Verwijderen ───────────────────────────────────────────────────────────────
select lives_ok($q$select public.club_lid_verwijderen_aanvragen('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', 'test')$q$,
                'aanvragen lukt als het geld klopt');
select is((public.club_lid_definitief_verwijderen('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0001', 'test') ->> 'verwijderd'), 'true', 'definitief verwijderen lukt');

select is((select count(*) from public.club_leden where id = '00000000-0000-4000-8000-0000000b0001'), 0::bigint, 'het lid is weg');
select is((select lid_id from public.club_betalen_facturen where id = '00000000-0000-4000-8000-000000f00001'), null::uuid, 'de definitieve factuur blijft, zonder lid');
select is((select klant_email from public.club_betalen_facturen where id = '00000000-0000-4000-8000-000000f00001'), null::text, 'het mailadres op de factuur is weg');
select is((select klant_naam from public.club_betalen_facturen where id = '00000000-0000-4000-8000-000000f00001'), 'Test Lid', 'naam en adres blijven op de factuur tot bewaren_tot');
select is((select count(*) from public.club_betalen_facturen where id = '00000000-0000-4000-8000-000000f00002'), 0::bigint, 'een conceptfactuur is weg');
select is((select count(*) from public.club_betalen_factuurregels where factuur_id = '00000000-0000-4000-8000-000000f00002'), 0::bigint, 'met zijn regels');
select is((select count(*) from public.club_betalen_contracten where id = '00000000-0000-4000-8000-0000000e0001' and lid_id is null and notitie is null), 1::bigint, 'het contract blijft, zonder lid en zonder notitie');
select is((select count(*) from public.club_betalen_pauzes where user_id = '00000000-0000-4000-8000-0000000a0001' and lid_id is null and reden is null), 1::bigint, 'de pauze blijft, zonder lid en zonder reden');
select is((select count(*) from public.club_betalen_boekingen where user_id = '00000000-0000-4000-8000-0000000a0001' and lid_id is not null), 0::bigint, 'geen enkele boeking wijst nog naar het lid');
select cmp_ok((select count(*) from public.club_betalen_boekingen where user_id = '00000000-0000-4000-8000-0000000a0001'), '>', 0::bigint, 'maar de boekingen zelf zijn er nog');
select is((select count(*) from public.club_betalen_betalingen where user_id = '00000000-0000-4000-8000-0000000a0001' and lid_id is null and fout_bericht is null), 1::bigint, 'de betaling blijft, zonder lid en zonder foutbericht');
select is((select count(*) from public.club_betalen_terugbetalingen where user_id = '00000000-0000-4000-8000-0000000a0001' and lid_id is null and toelichting is null), 1::bigint, 'de terugbetaling blijft, zonder lid en zonder toelichting');
select is((select count(*) from public.club_betalen_geschillen where user_id = '00000000-0000-4000-8000-0000000a0001' and lid_id is null and toelichting is null), 1::bigint, 'het geschil blijft, zonder lid en zonder toelichting');
select is((select count(*) from public.club_betalen_herinneringen where factuur_id = '00000000-0000-4000-8000-000000f00001'), 0::bigint, 'herinneringen zijn weg');
select is((select count(*) from public.club_betalen_klanten where id = '00000000-0000-4000-8000-000000a20001'), 0::bigint, 'de klant is weg');
select is((select count(*) from public.club_betalen_mandaten where id = '00000000-0000-4000-8000-000000a30001' and lid_id is null and klant_id is null and laatste4 is null), 1::bigint, 'een recent mandaat blijft anoniem tot de SEPA-termijn voorbij is');
select is((select count(*) from public.club_betalen_mandaten where id = '00000000-0000-4000-8000-000000a30002'), 0::bigint, 'een mandaat van meer dan 13 maanden geleden is weg');
select is((select count(*) from public.club_betalen_opdrachten where user_id = '00000000-0000-4000-8000-0000000a0001' and (lid_id is not null or idempotentie_sleutel = 'ayg_incasso_00000000-0000-4000-8000-000000a00001')), 0::bigint, 'opdrachten van het lid zijn weg');
select is((select count(*) from public.club_betalen_opdrachten
            where soort = 'klant_verwijderen' and lid_id is null and status = 'wacht'
              and payload ->> 'stripe_klant_id' = 'cus_test123456' and payload ->> 'stripe_account_id' = 'acct_test123456'), 1::bigint, 'er staat een opdracht klaar om de Stripe-klant te wissen');
select is((select count(*) from public.club_betalen_gezinnen where id = '00000000-0000-4000-8000-000000a40001' and hoofd_lid_id is null and naam is null), 1::bigint, 'het gezin heeft geen naam en geen hoofd meer');
select is((select count(*) from public.club_betalen_audit where user_id = '00000000-0000-4000-8000-0000000a0001' and actie = 'lid_verwijderd_avg' and onderwerp_id is null), 1::bigint, 'de audit heeft een regel zonder id van het lid');
select is(public.club_betalen_audit_controleer('00000000-0000-4000-8000-0000000a0001'), null::bigint, 'de hashketen klopt na het verwijderen');

-- ── De nachtelijke opruiming ──────────────────────────────────────────────────
-- bewaren_tot in het verleden zetten: dat is normaal bevroren, dus de trigger kort uit.
alter table public.club_betalen_facturen disable trigger club_betalen_factuur_vast;
update public.club_betalen_facturen set bewaren_tot = current_date - 1 where id = '00000000-0000-4000-8000-000000f00001';
alter table public.club_betalen_facturen enable trigger club_betalen_factuur_vast;
-- Een mandaat zonder lid dat al ouder is dan de SEPA-termijn.
update public.club_betalen_mandaten set laatste_incasso_op = now() - interval '14 months' where id = '00000000-0000-4000-8000-000000a30001';
-- Stripe-events: een oud en een recent.
insert into public.club_betalen_stripe_events (event_id, type, ontvangen_op) values
  ('evt_test_oud_123456', 'payment_intent.succeeded', now() - interval '100 days'),
  ('evt_test_nieuw_123456', 'payment_intent.succeeded', now() - interval '1 day');
-- Een afgeronde wis-opdracht van meer dan 90 dagen geleden.
update public.club_betalen_opdrachten set status = 'klaar', klaar_op = now() - interval '100 days' where soort = 'klant_verwijderen' and user_id = '00000000-0000-4000-8000-0000000a0001';
-- Een oud-lid met een lopend contract en een oud-lid zonder: alleen de tweede mag worden aangevraagd.
insert into public.club_leden (id, user_id, vestiging, voornaam, achternaam, status, einddatum)
values ('00000000-0000-4000-8000-0000000b0002', '00000000-0000-4000-8000-0000000a0001', 'budel', 'Oud', 'Metcontract', 'gestopt', date '2020-01-01'),
       ('00000000-0000-4000-8000-0000000b0003', '00000000-0000-4000-8000-0000000a0001', 'budel', 'Oud', 'Zondercontract', 'gestopt', date '2020-01-01');
update public.club_leden set bijgewerkt_op = timestamptz '2020-01-01' where id in ('00000000-0000-4000-8000-0000000b0002', '00000000-0000-4000-8000-0000000b0003');
insert into public.club_betalen_contracten (user_id, lid_id, plan_id, vorm_id, status, plan_naam, interval_soort, bedrag_cent, btw_procent, startdatum)
values ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-0000000b0002', '00000000-0000-4000-8000-0000000d0001',
        '00000000-0000-4000-8000-0000000c0001', 'actief', 'Maand', 'maand', 3000, 21, date '2019-01-01');

select lives_ok($q$select public.club_privacy_opruimen()$q$, 'de nachtelijke opruiming loopt zonder fout, ook met een oud-lid met een contract');

select is((select klant_naam from public.club_betalen_facturen where id = '00000000-0000-4000-8000-000000f00001'), 'Geanonimiseerd', 'na bewaren_tot is de naam op de factuur anoniem');
select is((select count(*) from public.club_betalen_facturen where id = '00000000-0000-4000-8000-000000f00001' and klant_adres is null and anoniem_op is not null and totaal_cent = 1210), 1::bigint, 'het adres is weg en het bedrag blijft');
select is((select count(*) from public.club_betalen_mandaten where id = '00000000-0000-4000-8000-000000a30001'), 0::bigint, 'een mandaat zonder lid verdwijnt na de SEPA-termijn');
select is((select count(*) from public.club_betalen_stripe_events where event_id in ('evt_test_oud_123456', 'evt_test_nieuw_123456')), 1::bigint, 'het Stripe-event van 100 dagen oud is weg, het recente blijft');
select is((select count(*) from public.club_betalen_opdrachten where user_id = '00000000-0000-4000-8000-0000000a0001' and soort = 'klant_verwijderen'), 0::bigint, 'een afgeronde wis-opdracht van meer dan 90 dagen oud is weg');
select is((select count(*) from public.club_lid_verwijderingen where lid_id = '00000000-0000-4000-8000-0000000b0002'), 0::bigint, 'een oud-lid met een lopend contract wordt niet voor verwijderen aangemeld');
select is((select count(*) from public.club_lid_verwijderingen where lid_id = '00000000-0000-4000-8000-0000000b0003'), 1::bigint, 'een oud-lid zonder contract wel');

select * from finish();
rollback;
