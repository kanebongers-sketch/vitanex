-- 464: Club, pauze van een lid met datums. Alleen toevoegen, idempotent.
-- NIET automatisch uitvoeren: Kane voert hem uit.
--
-- Besluit Kane (27-10-2026): alles van een lid staat op de ledenkaart, ook het
-- lidmaatschap starten, pauzeren en stoppen met datums. Starten (lid_sinds) en
-- stoppen of opzeggen (einddatum) hebben al een kolom; de pauze nog niet.
-- Zolang deze migratie niet is uitgevoerd, werkt de ledenkaart gewoon: de
-- status gaat op gepauzeerd en de kaart meldt dat de datums niet zijn bewaard.
--
-- Geen nieuwe tabel: de kolommen horen bij club_leden en gaan dus vanzelf mee
-- met de export en het definitief verwijderen van een lid (AVG).

alter table public.club_leden add column if not exists pauze_van date;
alter table public.club_leden add column if not exists pauze_tot date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_leden_pauze_volgorde') then
    alter table public.club_leden
      add constraint club_leden_pauze_volgorde check (pauze_van is null or pauze_tot is null or pauze_tot >= pauze_van);
  end if;
end $$;

comment on column public.club_leden.pauze_van is 'Begin van de pauze (status gepauzeerd), ingevuld op de ledenkaart.';
comment on column public.club_leden.pauze_tot is 'Einde van de pauze; null = open pauze. Er gaat niets automatisch: de kaart toont als de pauze voorbij is.';
