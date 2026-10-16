-- ─── Fit Factory Club: notities (à la Evernote) en agenda ───────────────────
-- Testfase: alleen Kane (zie src/lib/club/toegang.ts). Zelfde beveiliging als de
-- andere club_*-tabellen: RLS aan zonder policies, alleen de service role.
--
-- club_kladblok: notities per vestiging (los van club_notities, de notities bij een lid) (vestiging null = alle vestigingen),
-- ingedeeld in mappen, vast te pinnen en te archiveren.
-- club_agenda: afspraken per vestiging (overleg, intake, onderhoud, ...), met
-- optioneel een medewerker.

create table if not exists public.club_kladblok (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text check (vestiging is null or vestiging in ('budel', 'bergeijk', 'someren', 'eindhoven_boschdijk', 'eindhoven_tongelre', 'eersel', 'oisterwijk', 'bladel')),
  map text not null default 'algemeen' check (map in ('algemeen', 'overdracht', 'afspraken', 'kennis', 'ideeen')),
  titel text not null check (char_length(titel) between 1 and 160),
  inhoud text not null default '' check (char_length(inhoud) <= 20000),
  vastgepind boolean not null default false,
  gearchiveerd boolean not null default false,
  auteur text,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists club_kladblok_lijst on public.club_kladblok (user_id, gearchiveerd, bijgewerkt_op desc);
alter table public.club_kladblok enable row level security;
revoke all on public.club_kladblok from anon, authenticated;

create table if not exists public.club_agenda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null check (vestiging in ('budel', 'bergeijk', 'someren', 'eindhoven_boschdijk', 'eindhoven_tongelre', 'eersel', 'oisterwijk', 'bladel')),
  titel text not null check (char_length(titel) between 1 and 160),
  soort text not null default 'afspraak' check (soort in ('afspraak', 'overleg', 'intake', 'pt', 'onderhoud', 'overig')),
  begin_op timestamptz not null,
  eind_op timestamptz not null,
  hele_dag boolean not null default false,
  medewerker_id uuid references public.club_medewerkers (id) on delete set null,
  notitie text check (notitie is null or char_length(notitie) <= 2000),
  auteur text,
  aangemaakt_op timestamptz not null default now(),
  check (eind_op >= begin_op)
);
create index if not exists club_agenda_week on public.club_agenda (user_id, vestiging, begin_op);
alter table public.club_agenda enable row level security;
revoke all on public.club_agenda from anon, authenticated;
