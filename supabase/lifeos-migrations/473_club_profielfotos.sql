-- 473: Club, profielfoto's van leden en medewerkers. Alleen toevoegen, idempotent.
-- Uitgevoerd door Claude op 30-10-2026 (toestemming Kane: aanvullende migraties voor Club).
--
-- Opdracht Kane (30-10-2026): "Profielfoto op de pagina." Een lid zet zelf een
-- foto in de ledenapp, een medewerker bij het eigen profiel in Club. De
-- sportschool (aan de balie) alleen met vastgelegde toestemming van het lid.
-- Weghalen kan altijd. Code: src/lib/club/profielfoto/.
--
-- Wat er gebeurt:
--   1. Private bucket club-profielfoto (alleen WebP, hoogstens 300 kB per bestand).
--   2. Tabel club_profielfotos: een foto per lid of per medewerker, met bron en
--      toestemming. Bestanden: <pad>-256.webp en <pad>-512.webp,
--      pad = <sportschool>/<lid|mw>-<id>/<versie>.
--   3. Kolom profielfoto (de versie) op club_leden en club_medewerkers, bijgehouden
--      door een trigger: zo weet elke lijst zonder extra query of er een foto is.
--   4. Wachtrij club_profielfoto_opruimen: Supabase verbiedt bestanden wissen via
--      SQL, dus elk pad dat vervalt komt hier en de server haalt het bestand weg
--      via de Storage API (cron club-meldingen en elke upload).
--   5. AVG: verzoek tot verwijderen van een lid, anonimiseren of uit dienst van een
--      medewerker = de foto meteen weg. Het lid zelf gaat via on delete cascade.
--   6. Bewaartermijn: de foto van een oud-lid gaat 30 dagen na de einddatum weg
--      (pg_cron club_profielfoto_bewaren, elke nacht).
-- Terugdraaien: drop table club_profielfotos, club_profielfoto_opruimen; drop column
-- profielfoto op club_leden en club_medewerkers; cron.unschedule('club_profielfoto_bewaren').

-- ── 1. Bucket ───────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('club-profielfoto', 'club-profielfoto', false, 307200, array['image/webp'])
on conflict (id) do nothing;
update storage.buckets set public = false where id = 'club-profielfoto';

-- ── 2. Tabel ────────────────────────────────────────────────────────────────

create table if not exists public.club_profielfotos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid references public.club_leden(id) on delete cascade,
  medewerker_id uuid references public.club_medewerkers(id) on delete cascade,
  pad text not null check (pad ~ '^[0-9a-f-]{36}/(lid|mw)-[0-9a-f-]{36}/[a-z0-9]{4,20}$'),
  -- zelf = het lid of de medewerker zette hem; sportschool = een medewerker voor een lid (balie).
  bron text not null check (bron in ('zelf', 'sportschool')),
  toestemming_op timestamptz,
  toestemming_tekst_versie text check (toestemming_tekst_versie is null or char_length(toestemming_tekst_versie) <= 20),
  toegevoegd_door text check (toegevoegd_door is null or char_length(toegevoegd_door) <= 80),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  check ((lid_id is null) <> (medewerker_id is null)),
  -- Een foto door de sportschool kan alleen bij een lid en alleen met toestemming.
  check (bron = 'zelf' or (lid_id is not null and toestemming_op is not null and toestemming_tekst_versie is not null and toegevoegd_door is not null))
);

create unique index if not exists club_profielfotos_lid on public.club_profielfotos (lid_id) where lid_id is not null;
create unique index if not exists club_profielfotos_mw on public.club_profielfotos (medewerker_id) where medewerker_id is not null;
create index if not exists club_profielfotos_user on public.club_profielfotos (user_id);

alter table public.club_profielfotos enable row level security;
revoke all on public.club_profielfotos from anon, authenticated, public;

create table if not exists public.club_profielfoto_opruimen (
  id bigint generated always as identity primary key,
  pad text not null,
  aangemaakt_op timestamptz not null default now()
);
alter table public.club_profielfoto_opruimen enable row level security;
revoke all on public.club_profielfoto_opruimen from anon, authenticated, public;

-- ── 3. Versie op lid en medewerker ──────────────────────────────────────────

alter table public.club_leden add column if not exists profielfoto text;
alter table public.club_medewerkers add column if not exists profielfoto text;

-- Bewaakt dat de foto bij dezelfde sportschool hoort als het lid of de
-- medewerker en houdt de versie op club_leden en club_medewerkers bij.
create or replace function public.club_profielfoto_controle()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.lid_id is not null and not exists (select 1 from public.club_leden l where l.id = new.lid_id and l.user_id = new.user_id) then
    raise exception 'Lid hoort niet bij deze sportschool' using errcode = '23503';
  end if;
  if new.medewerker_id is not null and not exists (select 1 from public.club_medewerkers m where m.id = new.medewerker_id and m.user_id = new.user_id) then
    raise exception 'Medewerker hoort niet bij deze sportschool' using errcode = '23503';
  end if;
  if new.pad not like new.user_id::text || '/%' then
    raise exception 'Pad hoort niet bij deze sportschool' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists club_profielfotos_controle on public.club_profielfotos;
create trigger club_profielfotos_controle
  before insert or update on public.club_profielfotos
  for each row execute function public.club_profielfoto_controle();

create or replace function public.club_profielfoto_bijhouden()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Een vervallen bestand: naar de wachtrij (de server wist het via de Storage API).
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.pad is distinct from new.pad) then
    insert into public.club_profielfoto_opruimen (pad) values (old.pad);
  end if;
  if tg_op = 'DELETE' then
    if old.lid_id is not null then update public.club_leden set profielfoto = null where id = old.lid_id and profielfoto is not null; end if;
    if old.medewerker_id is not null then update public.club_medewerkers set profielfoto = null where id = old.medewerker_id and profielfoto is not null; end if;
    return old;
  end if;
  if new.lid_id is not null then
    update public.club_leden set profielfoto = split_part(new.pad, '/', 3) where id = new.lid_id and profielfoto is distinct from split_part(new.pad, '/', 3);
  end if;
  if new.medewerker_id is not null then
    update public.club_medewerkers set profielfoto = split_part(new.pad, '/', 3) where id = new.medewerker_id and profielfoto is distinct from split_part(new.pad, '/', 3);
  end if;
  return new;
end;
$$;

drop trigger if exists club_profielfotos_bijhouden on public.club_profielfotos;
create trigger club_profielfotos_bijhouden
  after insert or update or delete on public.club_profielfotos
  for each row execute function public.club_profielfoto_bijhouden();

-- ── 5. AVG: foto meteen weg ─────────────────────────────────────────────────

-- Een verzoek tot verwijderen van een lid (door de sportschool of de bewaartermijn).
create or replace function public.club_profielfoto_weg_lid()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.club_profielfotos where lid_id = new.lid_id;
  return new;
end;
$$;

drop trigger if exists club_lid_verwijderingen_profielfoto on public.club_lid_verwijderingen;
create trigger club_lid_verwijderingen_profielfoto
  after insert on public.club_lid_verwijderingen
  for each row execute function public.club_profielfoto_weg_lid();

-- Een medewerker die wordt geanonimiseerd of uit dienst gaat (actief uit).
create or replace function public.club_profielfoto_weg_medewerker()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.club_profielfotos where medewerker_id = new.id;
  return new;
end;
$$;

drop trigger if exists club_medewerkers_profielfoto on public.club_medewerkers;
create trigger club_medewerkers_profielfoto
  after update of actief, geanonimiseerd_op on public.club_medewerkers
  for each row
  when ((old.actief and not new.actief) or (old.geanonimiseerd_op is null and new.geanonimiseerd_op is not null))
  execute function public.club_profielfoto_weg_medewerker();

-- ── 6. Bewaartermijn ────────────────────────────────────────────────────────

create or replace function public.club_profielfoto_bewaren()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
begin
  -- Oud-leden: 30 dagen na de einddatum (zonder einddatum: na de laatste wijziging).
  delete from public.club_profielfotos f
  using public.club_leden l
  where f.lid_id = l.id and l.status in ('gestopt', 'opgezegd')
    and coalesce(l.einddatum, l.bijgewerkt_op::date) < current_date - 30;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.club_profielfoto_bewaren() from public, anon, authenticated;
revoke all on function public.club_profielfoto_controle() from public, anon, authenticated;
revoke all on function public.club_profielfoto_bijhouden() from public, anon, authenticated;
revoke all on function public.club_profielfoto_weg_lid() from public, anon, authenticated;
revoke all on function public.club_profielfoto_weg_medewerker() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'club_profielfoto_bewaren') then
      perform cron.unschedule('club_profielfoto_bewaren');
    end if;
    perform cron.schedule('club_profielfoto_bewaren', '25 4 * * *', $job$select public.club_profielfoto_bewaren()$job$);
  end if;
end;
$$;
