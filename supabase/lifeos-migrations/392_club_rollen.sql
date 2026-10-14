-- ─── Fit Factory clubsoftware: drie functies per vestiging ──────────────────
-- Besluit Kane (14-10-2026): in Budel zijn er maar drie functies: trainer (doet
-- ook de balie), groepslesinstructeur en clubmanager. Daarnaast de centrale
-- administratie voor de uren. De functie 'balie' verdwijnt: wie die had, wordt
-- trainer. ("balie" blijft wel bestaan als kanaal, bijv. een lead die aan de
-- balie binnenkomt of een reservering via de balie.) Idempotent.

update public.club_medewerkers
set rollen = (
  select coalesce(array_agg(distinct r order by r), '{}')
  from unnest(array_replace(rollen, 'balie', 'trainer')) as r
)
where 'balie' = any(rollen);

alter table public.club_medewerkers drop constraint if exists club_medewerkers_rollen_check;
alter table public.club_medewerkers add constraint club_medewerkers_rollen_check
  check (rollen <@ array['trainer','instructeur','manager','administratie']::text[]);

update public.club_dienst_soorten set rol = 'trainer' where rol = 'balie';
alter table public.club_dienst_soorten drop constraint if exists club_dienst_soorten_rol_check;
alter table public.club_dienst_soorten add constraint club_dienst_soorten_rol_check
  check (rol is null or rol in ('trainer','instructeur','manager','administratie'));
