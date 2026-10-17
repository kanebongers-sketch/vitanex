-- ─── Club: vestigingen per sportschool ──────────────────────────────────────
-- Tot nu toe waren de vestigingen de vaste acht van Fit Factory (een check met
-- de sleutels). Met meerdere sportscholen heeft elke organisatie haar eigen
-- vestigingen in club_vestigingen (user_id = organisatie). De sleutel blijft
-- uniek over alle organisaties (primary key), voortaan als slug.
--
-- 1. Checks met de acht vaste sleutels worden een slug-check (geen data weg).
-- 2. volgorde en standaard: de volgorde in de keuzelijst en de vestiging die
--    open gaat als er niets gekozen is (bij Fit Factory: Budel, de pilot).
-- Idempotent.

alter table public.club_vestigingen drop constraint if exists club_vestigingen_vestiging_check;
alter table public.club_vestigingen add constraint club_vestigingen_vestiging_check
  check (vestiging ~ '^[a-z0-9][a-z0-9_-]{1,59}$');

alter table public.club_kladblok drop constraint if exists club_kladblok_vestiging_check;
alter table public.club_kladblok add constraint club_kladblok_vestiging_check
  check (vestiging is null or vestiging ~ '^[a-z0-9][a-z0-9_-]{1,59}$');

alter table public.club_agenda drop constraint if exists club_agenda_vestiging_check;
alter table public.club_agenda add constraint club_agenda_vestiging_check
  check (vestiging ~ '^[a-z0-9][a-z0-9_-]{1,59}$');

alter table public.club_vestigingen add column if not exists volgorde int not null default 100;
alter table public.club_vestigingen add column if not exists standaard boolean not null default false;
create index if not exists club_vestigingen_org on public.club_vestigingen (user_id, volgorde);

-- Fit Factory: dezelfde volgorde als de PT-app, Budel (pilot) standaard.
update public.club_vestigingen v set volgorde = o.nr
from (values ('budel', 1), ('bergeijk', 2), ('someren', 3), ('eindhoven_boschdijk', 4),
             ('eindhoven_tongelre', 5), ('eersel', 6), ('oisterwijk', 7), ('bladel', 8)) as o(sleutel, nr)
where v.vestiging = o.sleutel and v.volgorde = 100;
update public.club_vestigingen set standaard = true
where vestiging = 'budel' and not exists (select 1 from public.club_vestigingen w where w.user_id = club_vestigingen.user_id and w.standaard);
