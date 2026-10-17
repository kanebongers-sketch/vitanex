-- ─── Club: uitgebreide instellingen per sportschool ─────────────────────────
-- De eigenaar stelt alles zelf in (besluit Kane 17-10-2026). Instellingen die
-- geen eigen tabel nodig hebben staan als object in club_organisaties.instellingen:
--   ledenapp: { welkom, tabs_uit, qr }       (de app voor leden)
--   rechten:  { <rol>: [onderdelen] }        (wat elke rol straks ziet)
-- De vorm wordt in de app gecontroleerd (src/lib/club/kern/org-instellingen.ts).
-- Idempotent; voegt alleen toe.

alter table public.club_organisaties add column if not exists instellingen jsonb not null default '{}'::jsonb;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_organisaties_instellingen_vorm') then
    alter table public.club_organisaties add constraint club_organisaties_instellingen_vorm
      check (jsonb_typeof(instellingen) = 'object' and pg_column_size(instellingen) < 32768);
  end if;
end $$;
