-- ─── LifeOS — PT-dashboard: logboek per klant + snelle weging ───────────────
-- 1. pt_klantnotities: gedateerde notities per PT-klant (training, gesprek,
--    voeding, no-show, overig). Het vrije veld pt_klanten.notitie blijft de
--    "vaste" notitie; dit is het verloop. Zelfde beveiliging als het dossier:
--    RLS zonder policies (alleen service-role), rij volgt altijd de trainer van
--    de klant (trigger uit migratie 361), klant weg → logboek weg.
-- 2. pt_metingen.soort krijgt 'weging': een snelle tussentijdse weging
--    (gewicht, evt. vetpercentage) die niet meetelt als check-meting.

create table if not exists public.pt_klantnotities (
  id uuid primary key default gen_random_uuid(),
  klant_id uuid not null references public.pt_klanten (id) on delete cascade,
  user_id uuid not null,
  persoon_id uuid not null references public.crm_personen (id) on delete cascade,
  datum date not null,
  soort text not null check (soort in ('training', 'gesprek', 'voeding', 'no_show', 'overig')),
  tekst text not null check (char_length(tekst) between 1 and 2000),
  aangemaakt_op timestamptz not null default now()
);
create index if not exists pt_klantnotities_klant on public.pt_klantnotities (klant_id, datum desc);
create index if not exists pt_klantnotities_persoon on public.pt_klantnotities (user_id, persoon_id);
alter table public.pt_klantnotities enable row level security;

drop trigger if exists pt_klantnotities_rij_van_klant on public.pt_klantnotities;
create trigger pt_klantnotities_rij_van_klant
  before insert or update of klant_id, persoon_id, user_id on public.pt_klantnotities
  for each row execute function public.pt_dossier_rij_van_klant();

-- Het logboek verhuist mee als de klant naar een andere trainer gaat.
create or replace function public.pt_dossier_volgt_klant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.persoon_id is distinct from old.persoon_id then
    update public.pt_intakes set persoon_id = new.persoon_id where klant_id = new.id and user_id = new.user_id;
    update public.pt_metingen set persoon_id = new.persoon_id where klant_id = new.id and user_id = new.user_id;
    update public.pt_klantnotities set persoon_id = new.persoon_id where klant_id = new.id and user_id = new.user_id;
  end if;
  return new;
end;
$$;

alter table public.pt_metingen drop constraint if exists pt_metingen_soort_check;
alter table public.pt_metingen add constraint pt_metingen_soort_check check (soort in ('start', 'tussen', 'eind', 'weging'));
