-- 428: foutregistratie voor Club, de ledenapp en AI Your Gym.
--
-- Serverfouten komen hier binnen via src/instrumentation.ts (onRequestError)
-- en via meldFout() in src/lib/club/betrouwbaarheid/. Per dag een rij per
-- soort fout (fingerprint); herhalingen tellen op in "aantal".
--
-- Bewust GEEN persoonsgegevens: geen headers, geen body, geen tokens, geen
-- ip-adressen. De melding is vooraf geschoond (e-mail, uuid's, cijfers en
-- tekst tussen aanhalingstekens eruit) en hooguit 200 tekens.
--
-- Alleen de server (service-role) schrijft en leest; anon en authenticated
-- kunnen er niet bij. Oude rijen (ouder dan 90 dagen) ruimt pg_cron elke nacht op.

create table if not exists public.club_fouten (
  id bigint generated always as identity primary key,
  dag date not null,
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{16}$'),
  gebied text not null check (gebied in ('club', 'leden', 'aiyourgym')),
  route text not null check (char_length(route) between 1 and 160),
  methode text check (methode is null or char_length(methode) <= 10),
  soort text check (soort is null or soort in ('render', 'route', 'action', 'proxy', 'handmatig')),
  sportschool text check (sportschool is null or char_length(sportschool) <= 60),
  melding text not null check (char_length(melding) between 1 and 200),
  aantal integer not null default 1 check (aantal >= 1),
  eerste_op timestamptz not null default now(),
  laatst_op timestamptz not null default now(),
  unique (fingerprint, dag)
);

create index if not exists club_fouten_laatst on public.club_fouten (laatst_op desc);
create index if not exists club_fouten_dag on public.club_fouten (dag);

alter table public.club_fouten enable row level security;
revoke all on public.club_fouten from public, anon, authenticated;

-- Een fout melden: nieuwe rij, of de bestaande van vandaag ophogen (atomair).
create or replace function public.club_fout_melden(
  p_fingerprint text,
  p_gebied text,
  p_route text,
  p_methode text,
  p_soort text,
  p_sportschool text,
  p_melding text
) returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.club_fouten as f (dag, fingerprint, gebied, route, methode, soort, sportschool, melding)
  values ((now() at time zone 'Europe/Amsterdam')::date, p_fingerprint, p_gebied, p_route, p_methode, p_soort, p_sportschool, p_melding)
  on conflict (fingerprint, dag) do update
    set aantal = f.aantal + 1,
        laatst_op = now(),
        sportschool = coalesce(excluded.sportschool, f.sportschool);
$$;

revoke all on function public.club_fout_melden(text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.club_fout_melden(text, text, text, text, text, text, text) to service_role;

-- De stand van de database voor /clubkane/systeem: grootte en tijd van de server.
create or replace function public.club_systeem_status()
returns table (database_bytes bigint, server_tijd timestamptz, postgres_versie text)
language sql
security invoker
set search_path = public
as $$
  select pg_database_size(current_database()), now(), current_setting('server_version');
$$;

revoke all on function public.club_systeem_status() from public, anon, authenticated;
grant execute on function public.club_systeem_status() to service_role;

-- Opruimen: fouten ouder dan 90 dagen weg (elke nacht om 03:40 UTC).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'club_fouten_opruimen') then
    perform cron.unschedule('club_fouten_opruimen');
  end if;
  perform cron.schedule(
    'club_fouten_opruimen',
    '40 3 * * *',
    $job$delete from public.club_fouten where dag < current_date - 90$job$
  );
end
$$;
