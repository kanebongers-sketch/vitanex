-- ─── Club: eigen coaching per oefening ──────────────────────────────────────
-- Elke sportschool kan de coaching van een oefening zelf schrijven of aanpassen
-- (kernpunten, opstelling, stappen, fouten, ademhaling, tempo, varianten).
-- Leeg = de standaardcoaching uit de code (src/lib/club/training/coaching).
-- De vorm wordt in de app gecontroleerd (leesCoaching); hier alleen een object
-- met een maximale grootte. Idempotent; voegt alleen toe.

alter table public.club_oefeningen add column if not exists coaching jsonb;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_oefeningen_coaching_vorm') then
    alter table public.club_oefeningen add constraint club_oefeningen_coaching_vorm
      check (coaching is null or (jsonb_typeof(coaching) = 'object' and pg_column_size(coaching) < 16384));
  end if;
end $$;
