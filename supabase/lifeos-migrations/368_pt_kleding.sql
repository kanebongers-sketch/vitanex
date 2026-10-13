-- ─── LifeOS — PT-app: kleding van PT'ers + voorraad in Eersel ──────────────
-- Kane houdt bij welke kleding elke PT'er heeft, met één voorraad in Eersel.
-- Alleen Kane registreert (via de founder-API); Kane en de eigenaren kijken mee.
--   pt_kleding_artikelen  — wat er is (bv. "Shirt", maten S t/m XXL)
--   pt_kleding_voorraad   — hoeveel er per artikel + maat in Eersel ligt
--   pt_kleding_uitgifte   — wie wat kreeg; terug_op gezet = teruggegeven
-- Uitgeven en terugnemen gaan via functies, zodat voorraad en uitgifte altijd
-- samen kloppen (ook bij twee acties tegelijk) en de voorraad nooit negatief wordt.
-- Alleen de service-role (RLS aan, geen policies), net als de andere PT-tabellen.

create table if not exists public.pt_kleding_artikelen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  naam text not null check (char_length(naam) between 1 and 60),
  maten text[] not null default '{}' check (cardinality(maten) between 1 and 12),
  actief boolean not null default true,
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, naam)
);
alter table public.pt_kleding_artikelen enable row level security;

create table if not exists public.pt_kleding_voorraad (
  artikel_id uuid not null references public.pt_kleding_artikelen (id) on delete cascade,
  maat text not null check (char_length(maat) between 1 and 12),
  aantal int not null default 0 check (aantal >= 0 and aantal <= 10000),
  bijgewerkt_op timestamptz not null default now(),
  primary key (artikel_id, maat)
);
alter table public.pt_kleding_voorraad enable row level security;

create table if not exists public.pt_kleding_uitgifte (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- De PT'er (of Kane als trainer) die de kleding kreeg.
  persoon_id uuid not null references public.crm_personen (id) on delete cascade,
  artikel_id uuid not null references public.pt_kleding_artikelen (id) on delete restrict,
  maat text not null check (char_length(maat) between 1 and 12),
  aantal int not null check (aantal between 1 and 50),
  uitgegeven_op date not null default current_date,
  terug_op date,
  notitie text check (notitie is null or char_length(notitie) <= 300),
  aangemaakt_op timestamptz not null default now(),
  check (terug_op is null or terug_op >= uitgegeven_op)
);
create index if not exists pt_kleding_uitgifte_persoon on public.pt_kleding_uitgifte (user_id, persoon_id, uitgegeven_op desc);
alter table public.pt_kleding_uitgifte enable row level security;

-- Uitgeven: voorraad omlaag (nooit onder nul) en de uitgifte vastleggen, in één keer.
create or replace function public.pt_kleding_uitgeven(
  p_user uuid, p_persoon uuid, p_artikel uuid, p_maat text, p_aantal int, p_datum date, p_notitie text
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  nieuw uuid;
begin
  if not exists (select 1 from public.pt_kleding_artikelen a where a.id = p_artikel and a.user_id = p_user) then
    raise exception 'artikel_onbekend';
  end if;
  update public.pt_kleding_voorraad v
    set aantal = v.aantal - p_aantal, bijgewerkt_op = now()
    where v.artikel_id = p_artikel and v.maat = p_maat and v.aantal >= p_aantal;
  if not found then
    raise exception 'onvoldoende_voorraad';
  end if;
  insert into public.pt_kleding_uitgifte (user_id, persoon_id, artikel_id, maat, aantal, uitgegeven_op, notitie)
    values (p_user, p_persoon, p_artikel, p_maat, p_aantal, p_datum, p_notitie)
    returning id into nieuw;
  return nieuw;
end;
$$;

-- Terugnemen: uitgifte afsluiten en (als het nog bruikbaar is) terug op voorraad.
create or replace function public.pt_kleding_terug(
  p_user uuid, p_uitgifte uuid, p_datum date, p_op_voorraad boolean
) returns boolean
language plpgsql
set search_path = ''
as $$
declare
  rij public.pt_kleding_uitgifte;
begin
  update public.pt_kleding_uitgifte u
    set terug_op = p_datum
    where u.id = p_uitgifte and u.user_id = p_user and u.terug_op is null
    returning * into rij;
  if not found then
    return false;
  end if;
  if p_op_voorraad then
    insert into public.pt_kleding_voorraad (artikel_id, maat, aantal)
      values (rij.artikel_id, rij.maat, rij.aantal)
      on conflict (artikel_id, maat) do update
        set aantal = public.pt_kleding_voorraad.aantal + excluded.aantal, bijgewerkt_op = now();
  end if;
  return true;
end;
$$;

-- Alleen de service-role mag deze functies aanroepen (geen publieke API).
revoke all on function public.pt_kleding_uitgeven(uuid, uuid, uuid, text, int, date, text) from public, anon, authenticated;
revoke all on function public.pt_kleding_terug(uuid, uuid, date, boolean) from public, anon, authenticated;
