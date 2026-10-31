-- 483: Club, remmen in de database (strategie 31-10-2026, roadmap punt 1.12).
--
-- De remmen tegen misbruik (inloggen, aanmelden, uitnodigingen, checkout) en de
-- kostenrem op de voedings-AI telden in het geheugen van een server: na elke
-- deploy op nul en per instance apart. Nu telt een tabel, met een atomische
-- functie, over alle instances heen. Code: src/lib/club/kern/rem-db.ts.
--
-- AVG: de sleutel is "<soort>:<HMAC-SHA256>" (remSleutel, geheim alleen op de
-- server). Nooit een IP-adres, e-mailadres of id in klare tekst; de check op
-- de kolom weigert elke andere vorm. Rijen leven hoogstens tot hun venster
-- voorbij is plus een uur (opruimen elk uur via pg_cron, en af en toe in de
-- functie zelf).
--
-- Venster: vast. Nieuw of verlopen = opnieuw tellen vanaf 1; daarna ophogen
-- zolang onder het maximum. Een geweigerde poging telt niet mee.
--
-- Alleen de server (service_role). RLS aan en geforceerd, geen policies.
-- Alleen toevoegen; idempotent. Niet automatisch uitgevoerd: Kane voert hem uit.

create table if not exists public.club_remmen (
  sleutel text primary key check (sleutel ~ '^[a-z0-9-]{1,48}:[0-9a-f]{64}$'),
  aantal integer not null check (aantal >= 0),
  venster_tot timestamptz not null,
  laatst_toegestaan boolean not null default true
);

create index if not exists club_remmen_venster_tot on public.club_remmen (venster_tot);

alter table public.club_remmen enable row level security;
alter table public.club_remmen force row level security;
revoke all on public.club_remmen from anon, authenticated, public;

-- Een tik: true = toegestaan (en geteld), false = geremd.
create or replace function public.club_rem_tik(p_sleutel text, p_venster_seconden integer, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_mag boolean;
begin
  if p_sleutel is null or p_sleutel !~ '^[a-z0-9-]{1,48}:[0-9a-f]{64}$' then
    raise exception 'club_rem_tik: ongeldige sleutel';
  end if;
  if p_venster_seconden is null or p_venster_seconden < 1 or p_venster_seconden > 31 * 86400 then
    raise exception 'club_rem_tik: ongeldig venster';
  end if;
  if p_max is null or p_max <= 0 then
    return false;
  end if;

  insert into public.club_remmen as r (sleutel, aantal, venster_tot, laatst_toegestaan)
  values (p_sleutel, 1, now() + make_interval(secs => p_venster_seconden), true)
  on conflict (sleutel) do update set
    aantal = case
      when r.venster_tot <= now() then 1
      when r.aantal < p_max then r.aantal + 1
      else r.aantal end,
    venster_tot = case
      when r.venster_tot <= now() then now() + make_interval(secs => p_venster_seconden)
      else r.venster_tot end,
    laatst_toegestaan = (r.venster_tot <= now() or r.aantal < p_max)
  returning laatst_toegestaan into v_mag;

  -- Af en toe (gemiddeld 1 op 500 tikken) oude rijen weg, los van pg_cron.
  if random() < 0.002 then
    delete from public.club_remmen where venster_tot < now() - interval '1 hour';
  end if;

  return v_mag;
end;
$$;

create or replace function public.club_remmen_opruimen()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
begin
  delete from public.club_remmen where venster_tot < now() - interval '1 hour';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.club_rem_tik(text, integer, integer) from public, anon, authenticated;
revoke all on function public.club_remmen_opruimen() from public, anon, authenticated;
grant execute on function public.club_rem_tik(text, integer, integer) to service_role;
grant execute on function public.club_remmen_opruimen() to service_role;

-- Elk uur op minuut 17: verlopen remmen weg.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'club_remmen_opruimen') then
      perform cron.unschedule('club_remmen_opruimen');
    end if;
    perform cron.schedule('club_remmen_opruimen', '17 * * * *', $job$select public.club_remmen_opruimen()$job$);
  end if;
end;
$$;
