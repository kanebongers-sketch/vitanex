-- ─── Fit Factory clubsoftware: rooster en reserveren ────────────────────────
-- Aanvulling op 380_club_basis.sql. Idempotent; veilig om opnieuw te draaien.
--
-- 1. Te laat annuleren markeren: binnen regels.annuleer_uren voor de start
--    geannuleerd telt als "te laat". Zo blijft zichtbaar wie vaak kort van
--    tevoren afzegt, zonder dat het lid meteen geblokkeerd wordt.
-- 2. Wanneer er geannuleerd is (voor het logboek en latere cijfers).
-- 3. Indexen voor het tellen per les en het vinden van no-shows per lid.
--
-- De code werkt ook zonder deze migratie (dan wordt "te laat" niet bewaard).

alter table public.club_reserveringen add column if not exists te_laat boolean not null default false;
alter table public.club_reserveringen add column if not exists geannuleerd_op timestamptz;

create index if not exists club_reserveringen_les_status on public.club_reserveringen (les_id, status);
create index if not exists club_reserveringen_lid_status on public.club_reserveringen (lid_id, status);
create index if not exists club_lesseries_vestiging on public.club_lesseries (user_id, vestiging, actief);
create index if not exists club_leads_proefles_les on public.club_leads (proefles_les_id) where proefles_les_id is not null;
