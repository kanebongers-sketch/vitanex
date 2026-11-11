-- LifeOS | PT-app: Eindhoven Boschdijk en Eindhoven Tongelre worden samen een club "Eindhoven"
-- (besluit Kane 11-11-2026: "boschdijk en tongelre gaan samen"). Alleen de PT-app: de clubsoftware
-- (club_*, migratie 380 en hoger) houdt beide vestigingen apart.
-- De checks staan de oude sleutels nog toe, zodat een oudere app-versie tijdens de deploy niet faalt;
-- de app schrijft alleen nog 'eindhoven'. De update is veilig om opnieuw te draaien.
-- Uitgevoerd 11-11-2026. Alleen toevoegen en bijwerken, niets verwijderd.

alter table public.pt_leads drop constraint if exists pt_leads_locatie_check;
alter table public.pt_leads add constraint pt_leads_locatie_check check (locatie is null or locatie in
  ('budel', 'bergeijk', 'someren', 'eindhoven', 'eindhoven_boschdijk', 'eindhoven_tongelre', 'eersel', 'oisterwijk', 'bladel'));

alter table public.pt_klanten drop constraint if exists pt_klanten_locatie_check;
alter table public.pt_klanten add constraint pt_klanten_locatie_check check (locatie in
  ('budel', 'bergeijk', 'someren', 'eindhoven', 'eindhoven_boschdijk', 'eindhoven_tongelre', 'eersel', 'oisterwijk', 'bladel'));

alter table public.pt_lead_links drop constraint if exists pt_lead_links_club_check;
alter table public.pt_lead_links add constraint pt_lead_links_club_check check (club is null or club in
  ('budel', 'bergeijk', 'someren', 'eindhoven', 'eindhoven_boschdijk', 'eindhoven_tongelre', 'eersel', 'oisterwijk', 'bladel'));

alter table public.pt_lead_links drop constraint if exists pt_lead_links_clubs_check;
alter table public.pt_lead_links add constraint pt_lead_links_clubs_check check (clubs <@ array[
  'budel', 'bergeijk', 'someren', 'eindhoven', 'eindhoven_boschdijk', 'eindhoven_tongelre', 'eersel', 'oisterwijk', 'bladel'
]::text[]);

update public.pt_leads set locatie = 'eindhoven' where locatie in ('eindhoven_boschdijk', 'eindhoven_tongelre');
update public.pt_klanten set locatie = 'eindhoven' where locatie in ('eindhoven_boschdijk', 'eindhoven_tongelre');
update public.pt_lead_links set club = 'eindhoven' where club in ('eindhoven_boschdijk', 'eindhoven_tongelre');

-- Clubmanagers: beide Eindhovense sleutels worden een keer 'eindhoven', de volgorde van de rest blijft.
update public.pt_lead_links l set clubs = (
  select coalesce(array_agg(c order by eerste), '{}') from (
    select c, min(nr) as eerste
    from unnest(array(
      select case when x in ('eindhoven_boschdijk', 'eindhoven_tongelre') then 'eindhoven' else x end
      from unnest(l.clubs) x
    )) with ordinality as u(c, nr)
    group by c
  ) s
)
where l.clubs && array['eindhoven_boschdijk', 'eindhoven_tongelre']::text[];
