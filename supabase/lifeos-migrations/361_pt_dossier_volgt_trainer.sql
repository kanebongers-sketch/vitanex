-- ─── LifeOS — PT-dashboard: het dossier volgt altijd de trainer van de klant ──
-- Elke query op pt_intakes / pt_metingen filtert op (user_id, persoon_id): de
-- trainer achter de link. Verplaatst de beheerder een klant naar een andere
-- trainer (pt_klanten.persoon_id wijzigt), dan moeten die dossier-rijen mee —
-- anders ziet de nieuwe trainer een leeg dossier en houdt de oude trainer
-- rechten op gezondheidsgegevens van een klant die niet meer van hem is.
--
-- De app doet dit al in code (klanten-opslag.ts, verplaatsKlant). Deze migratie
-- maakt het een invariant van de database, ook als een pad ooit vergeten wordt:
--   1. wijzigt pt_klanten.persoon_id → pt_intakes/pt_metingen van die klant mee;
--   2. een nieuwe of gewijzigde dossier-rij krijgt altijd de persoon_id (en
--      user_id) van zijn klant — wat de aanroeper ook meestuurt.

create or replace function public.pt_dossier_volgt_klant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.persoon_id is distinct from old.persoon_id then
    update public.pt_intakes
       set persoon_id = new.persoon_id
     where klant_id = new.id and user_id = new.user_id;
    update public.pt_metingen
       set persoon_id = new.persoon_id
     where klant_id = new.id and user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists pt_klanten_dossier_volgt on public.pt_klanten;
create trigger pt_klanten_dossier_volgt
  after update of persoon_id on public.pt_klanten
  for each row execute function public.pt_dossier_volgt_klant();

create or replace function public.pt_dossier_rij_van_klant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  k record;
begin
  select user_id, persoon_id into k from public.pt_klanten where id = new.klant_id;
  if not found then
    raise exception 'pt_klanten % bestaat niet', new.klant_id using errcode = 'foreign_key_violation';
  end if;
  new.user_id := k.user_id;
  new.persoon_id := k.persoon_id;
  return new;
end;
$$;

drop trigger if exists pt_intakes_rij_van_klant on public.pt_intakes;
create trigger pt_intakes_rij_van_klant
  before insert or update of klant_id, persoon_id, user_id on public.pt_intakes
  for each row execute function public.pt_dossier_rij_van_klant();

drop trigger if exists pt_metingen_rij_van_klant on public.pt_metingen;
create trigger pt_metingen_rij_van_klant
  before insert or update of klant_id, persoon_id, user_id on public.pt_metingen
  for each row execute function public.pt_dossier_rij_van_klant();

-- Eenmalig rechtzetten wat al scheef staat (klanten die vóór deze migratie verplaatst zijn).
update public.pt_intakes i
   set persoon_id = k.persoon_id
  from public.pt_klanten k
 where k.id = i.klant_id and k.user_id = i.user_id and i.persoon_id is distinct from k.persoon_id;

update public.pt_metingen m
   set persoon_id = k.persoon_id
  from public.pt_klanten k
 where k.id = m.klant_id and k.user_id = m.user_id and m.persoon_id is distinct from k.persoon_id;
