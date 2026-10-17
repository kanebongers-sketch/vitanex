-- ─── Club: subdomein per sportschool ────────────────────────────────────────
-- Elke sportschool krijgt een eigen adres: <slug>.aiyourgym.com (besluit Kane
-- 17-10-2026). De slug is uniek over alle sportscholen. De routering staat
-- achter de schakelaar CLUB_SUBDOMEINEN_ACTIEF (standaard uit), zie
-- src/lib/club/kern/subdomein.ts en src/proxy.ts. Idempotent; voegt alleen toe.

alter table public.club_organisaties add column if not exists slug text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_organisaties_slug_vorm') then
    alter table public.club_organisaties add constraint club_organisaties_slug_vorm
      check (slug is null or slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$');
  end if;
end $$;
create unique index if not exists club_organisaties_slug_uniek on public.club_organisaties (slug) where slug is not null;

update public.club_organisaties set slug = 'fitfactory' where naam = 'Fit Factory' and slug is null and not exists (select 1 from public.club_organisaties where slug = 'fitfactory');
update public.club_organisaties set slug = 'voorbeeldgym' where id = 'de000000-0000-4000-8000-0000000000c1' and slug is null;
