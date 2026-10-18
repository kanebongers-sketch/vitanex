-- 437: Club sneller. Alleen indexen toevoegen (create index if not exists), nooit iets verwijderen.
-- Gebaseerd op de filters die de pagina's gebruiken en op de bestaande indexen; nog niet
-- met EXPLAIN gemeten (zie rapport). Veilig om vaker uit te voeren.

-- No-shows (Vandaag en ledenlijst): filteren op sportschool + status, daarna koppelen aan lessen.
create index if not exists club_reserveringen_user_status on public.club_reserveringen (user_id, status);

-- Ledenapp en voorvertoning: leden met een actief schema (user_id + status).
create index if not exists club_schemas_user_status on public.club_schemas (user_id, status);

-- Leden in blokken van 1000 lezen, op id gesorteerd: de index levert de volgorde meteen.
create index if not exists club_leden_vestiging_id on public.club_leden (user_id, vestiging, id);

-- Advisor (18-10-2026): verwijzingen naar een lid zonder index. Nodig voor de
-- ledenkaart en voor het verwijderen van een lid (AVG), dat al deze tabellen raakt.
create index if not exists club_metingen_lid on public.club_metingen (lid_id);
create index if not exists club_meldingen_lid on public.club_meldingen (lid_id);
create index if not exists club_meldingen_voorkeuren_lid on public.club_meldingen_voorkeuren (lid_id);
create index if not exists club_opvolgtaken_lid on public.club_opvolgtaken (lid_id);
create index if not exists club_voedingsplannen_lid on public.club_voedingsplannen (lid_id);
create index if not exists club_leads_lid on public.club_leads (lid_id);
create index if not exists club_challenge_deelnemers_lid on public.club_challenge_deelnemers (lid_id);
create index if not exists club_lid_toegang_lid on public.club_lid_toegang (lid_id, user_id);
create index if not exists club_lid_sessies_lid on public.club_lid_sessies (toegang_id, user_id, lid_id);
create index if not exists club_trainingslog_schema on public.club_trainingslog (schema_id);
create index if not exists club_schema_oefeningen_oefening on public.club_schema_oefeningen (oefening_id);
