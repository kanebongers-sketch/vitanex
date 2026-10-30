-- 472: leden maken zelf een trainingsschema (besluit Kane 30-10-2026).
-- Alleen toevoegen. Hergebruikt club_schemas en club_schema_oefeningen.
--
-- maker: wie het schema maakte. 'trainer' (standaard, alle bestaande schema's)
--   of 'lid' (zelf gemaakt in de ledenapp). Een lid-schema hoort altijd bij een lid.
-- actief_gekozen_op: het moment dat dit schema het schema werd dat het lid in de
--   app ziet (het lid koos het, maakte het net, of de trainer zette het actief).
--   Het schema met het laatste moment (anders aangemaakt_op) is het actieve
--   schema in de app; zie src/lib/club/training/lid-schemas/regels.ts.
-- De instelling "lid mag het schema van de trainer aanpassen" staat in
-- club_organisaties.instellingen -> lid_schemas.trainer_aanpassen (standaard nee).
-- AVG: geen nieuwe tabel; club_schemas valt al onder export en verwijderen (lid_id).

alter table public.club_schemas add column if not exists maker text not null default 'trainer';
alter table public.club_schemas add column if not exists actief_gekozen_op timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_schemas_maker_check') then
    alter table public.club_schemas
      add constraint club_schemas_maker_check check (maker in ('trainer', 'lid'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'club_schemas_maker_lid_check') then
    alter table public.club_schemas
      add constraint club_schemas_maker_lid_check check (maker = 'trainer' or lid_id is not null);
  end if;
end $$;

create index if not exists club_schemas_lid_maker on public.club_schemas (user_id, lid_id, maker) where lid_id is not null;

comment on column public.club_schemas.maker is 'trainer of lid: wie het schema maakte (migratie 472).';
comment on column public.club_schemas.actief_gekozen_op is 'Moment dat dit het actieve schema in de ledenapp werd (migratie 472).';
