-- 481: ontbrekende indexen op club_*-tabellen (onderzoek 31-10-2026, punt 1.6 van de technische roadmap).
-- Gevonden met pg_catalog op de LifeOS-database: tabellen zonder index die met user_id begint, en
-- foreign keys zonder index op hun kolommen. Alleen toevoegen, niets verwijderen of wijzigen.
-- Geen CONCURRENTLY: de migratie draait in een transactie en de tabellen zijn nog klein, dus de
-- korte schrijfblokkade per tabel is te verwaarlozen. Opnieuw draaien kan veilig (if not exists).

-- Filter op de sportschool (elke query filtert op user_id).

create index if not exists club_aanmeldingen_user_id_idx on public.club_aanmeldingen (user_id);
create index if not exists club_app_aanvragen_user_id_idx on public.club_app_aanvragen (user_id);
create index if not exists club_health_sync_log_user_id_idx on public.club_health_sync_log (user_id);
create index if not exists club_lead_historie_user_id_idx on public.club_lead_historie (user_id);
create index if not exists club_lestypen_user_id_idx on public.club_lestypen (user_id);
create index if not exists club_medewerker_sessies_user_id_idx on public.club_medewerker_sessies (user_id);
create index if not exists club_medewerkers_user_id_idx on public.club_medewerkers (user_id);
create index if not exists club_notities_user_id_idx on public.club_notities (user_id);
create index if not exists club_schema_oefeningen_user_id_idx on public.club_schema_oefeningen (user_id);
create index if not exists club_taken_user_id_idx on public.club_taken (user_id);
create index if not exists club_widget_rem_user_id_idx on public.club_widget_rem (user_id);
create index if not exists club_zalen_user_id_idx on public.club_zalen (user_id);

-- Foreign keys: sneller verwijderen of bijwerken van de rij waarnaar verwezen wordt (AVG-wissen,
-- medewerker of vestiging weghalen) en sneller zoeken per lid, medewerker of vestiging.

create index if not exists club_aanmeldlinks_vorm_id_idx on public.club_aanmeldlinks (vorm_id);
create index if not exists club_afspraken_lead_id_idx on public.club_afspraken (lead_id);
create index if not exists club_afspraken_type_id_idx on public.club_afspraken (type_id);
create index if not exists club_afspraken_vestiging_idx on public.club_afspraken (vestiging);
create index if not exists club_agenda_medewerker_id_idx on public.club_agenda (medewerker_id);
create index if not exists club_automatiseringen_medewerker_id_idx on public.club_automatiseringen (medewerker_id);
create index if not exists club_beschikbaarheid_medewerker_id_idx on public.club_beschikbaarheid (medewerker_id);
create index if not exists club_betalen_mutaties_lid_id_idx on public.club_betalen_mutaties (lid_id);
create index if not exists club_betalen_tegoeden_lid_id_idx on public.club_betalen_tegoeden (lid_id);
create index if not exists club_betalen_verkopen_lid_id_idx on public.club_betalen_verkopen (lid_id);
create index if not exists club_betalen_verkopen_product_id_idx on public.club_betalen_verkopen (product_id);
create index if not exists club_challenge_deelnemers_lid_id_idx on public.club_challenge_deelnemers (lid_id);
create index if not exists club_checkins_vestiging_idx on public.club_checkins (vestiging);
create index if not exists club_community_berichten_lid_id_idx on public.club_community_berichten (lid_id);
create index if not exists club_community_groepen_challenge_id_idx on public.club_community_groepen (challenge_id);
create index if not exists club_community_groepen_lestype_id_idx on public.club_community_groepen (lestype_id);
create index if not exists club_community_groepsleden_lid_id_idx on public.club_community_groepsleden (lid_id);
create index if not exists club_community_meldingen_lid_id_idx on public.club_community_meldingen (lid_id);
create index if not exists club_community_reacties_lid_id_idx on public.club_community_reacties (lid_id);
create index if not exists club_dienst_sjablonen_vestiging_idx on public.club_dienst_sjablonen (vestiging);
create index if not exists club_dienst_soorten_vestiging_idx on public.club_dienst_soorten (vestiging);
create index if not exists club_diensten_soort_id_idx on public.club_diensten (soort_id);
create index if not exists club_diensten_vervangt_id_idx on public.club_diensten (vervangt_id);
create index if not exists club_diensten_vestiging_idx on public.club_diensten (vestiging);
create index if not exists club_health_toestemmingen_lid_id_idx on public.club_health_toestemmingen (lid_id);
create index if not exists club_intakes_medewerker_id_idx on public.club_intakes (medewerker_id);
create index if not exists club_leads_medewerker_id_idx on public.club_leads (medewerker_id);
create index if not exists club_leads_vestiging_idx on public.club_leads (vestiging);
create index if not exists club_leden_aangemeld_via_idx on public.club_leden (aangemeld_via);
create index if not exists club_leden_coach_id_idx on public.club_leden (coach_id);
create index if not exists club_leden_vestiging_idx on public.club_leden (vestiging);
create index if not exists club_lessen_instructeur_id_idx on public.club_lessen (instructeur_id);
create index if not exists club_lessen_lestype_id_idx on public.club_lessen (lestype_id);
create index if not exists club_lessen_vestiging_idx on public.club_lessen (vestiging);
create index if not exists club_lessen_zaal_id_idx on public.club_lessen (zaal_id);
create index if not exists club_lesseries_instructeur_id_idx on public.club_lesseries (instructeur_id);
create index if not exists club_lesseries_lestype_id_idx on public.club_lesseries (lestype_id);
create index if not exists club_lesseries_vestiging_idx on public.club_lesseries (vestiging);
create index if not exists club_lesseries_zaal_id_idx on public.club_lesseries (zaal_id);
create index if not exists club_lid_sessies_lid_id_idx on public.club_lid_sessies (lid_id);
create index if not exists club_lid_sessies_toegang_id_user_id_lid_id_idx on public.club_lid_sessies (toegang_id, user_id, lid_id);
create index if not exists club_lid_toegang_lid_id_idx on public.club_lid_toegang (lid_id);
create index if not exists club_medewerker_sessies_medewerker_id_idx on public.club_medewerker_sessies (medewerker_id);
create index if not exists club_medewerker_sessies_toegang_id_user_id_medewerker_id_idx on public.club_medewerker_sessies (toegang_id, user_id, medewerker_id);
create index if not exists club_medewerker_toegang_medewerker_id_user_id_idx on public.club_medewerker_toegang (medewerker_id, user_id);
create index if not exists club_meldingen_lid_id_idx on public.club_meldingen (lid_id);
create index if not exists club_meldingen_voorkeuren_lid_id_idx on public.club_meldingen_voorkeuren (lid_id);
create index if not exists club_metingen_lid_id_idx on public.club_metingen (lid_id);
create index if not exists club_metingen_medewerker_id_idx on public.club_metingen (medewerker_id);
create index if not exists club_opvolgtaken_medewerker_id_idx on public.club_opvolgtaken (medewerker_id);
create index if not exists club_profiel_rollen_medewerker_id_user_id_idx on public.club_profiel_rollen (medewerker_id, user_id);
create index if not exists club_rooster_notities_medewerker_id_idx on public.club_rooster_notities (medewerker_id);
create index if not exists club_rooster_notities_vestiging_idx on public.club_rooster_notities (vestiging);
create index if not exists club_schemas_medewerker_id_idx on public.club_schemas (medewerker_id);
create index if not exists club_set_logs_oefening_id_idx on public.club_set_logs (oefening_id);
create index if not exists club_set_logs_schema_id_idx on public.club_set_logs (schema_id);
create index if not exists club_taak_afsluitrondes_medewerker_id_idx on public.club_taak_afsluitrondes (medewerker_id);
create index if not exists club_taak_afsluitrondes_vestiging_idx on public.club_taak_afsluitrondes (vestiging);
create index if not exists club_taak_afvinken_medewerker_id_idx on public.club_taak_afvinken (medewerker_id);
create index if not exists club_taak_afvinken_vestiging_idx on public.club_taak_afvinken (vestiging);
create index if not exists club_taak_notities_medewerker_id_idx on public.club_taak_notities (medewerker_id);
create index if not exists club_taak_notities_vestiging_idx on public.club_taak_notities (vestiging);
create index if not exists club_takenlijsten_vestiging_idx on public.club_takenlijsten (vestiging);
create index if not exists club_voeding_logs_lid_id_idx on public.club_voeding_logs (lid_id);
create index if not exists club_voeding_producten_lid_id_idx on public.club_voeding_producten (lid_id);
create index if not exists club_zalen_vestiging_idx on public.club_zalen (vestiging);
