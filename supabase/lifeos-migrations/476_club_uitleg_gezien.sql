-- 476: Club en ledenapp, de eerste-keer-uitleg per account onthouden. Alleen toevoegen, idempotent.
-- Uitgevoerd door Claude op 30-10-2026 (toestemming Kane: aanvullende migraties voor Club).
--
-- Een nieuwe medewerker en een nieuw lid krijgen bij de eerste keer een korte
-- uitleg van hoogstens drie kaarten. Wie hem wegklikt, ziet hem op geen enkel
-- apparaat meer. We bewaren alleen welke uitleg is weggeklikt (bijvoorbeeld
-- "trainer:v1"), op de rij die er al is:
--   club_medewerkers (het profiel, ook van een eigenaar of clubmanager, rollen v2)
--   club_lid_toegang (het account van een lid in de ledenapp)
-- Geen nieuwe tabel en geen nieuwe persoonsgegevens: de waarde gaat mee met de
-- rij, dus met anonimiseren en definitief verwijderen van die rij.
-- Terugdraaien: alter table ... drop column uitleg_gezien (beide tabellen).

alter table public.club_medewerkers
  add column if not exists uitleg_gezien text[] not null default '{}'::text[];

alter table public.club_lid_toegang
  add column if not exists uitleg_gezien text[] not null default '{}'::text[];

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_medewerkers_uitleg_gezien_kort') then
    alter table public.club_medewerkers
      add constraint club_medewerkers_uitleg_gezien_kort check (cardinality(uitleg_gezien) <= 20);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'club_lid_toegang_uitleg_gezien_kort') then
    alter table public.club_lid_toegang
      add constraint club_lid_toegang_uitleg_gezien_kort check (cardinality(uitleg_gezien) <= 20);
  end if;
end;
$$;

comment on column public.club_medewerkers.uitleg_gezien is 'Weggeklikte eerste-keer-uitleg (rol:versie), migratie 476.';
comment on column public.club_lid_toegang.uitleg_gezien is 'Weggeklikte eerste-keer-uitleg in de ledenapp (leden:versie), migratie 476.';
