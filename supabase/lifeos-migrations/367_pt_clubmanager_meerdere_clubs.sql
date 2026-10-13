-- ─── LifeOS — PT-app: een clubmanager kan meerdere clubs hebben ─────────────
-- Chris is manager van Someren én Eindhoven Boschdijk: één inlog voor beide.
-- Nieuw: `clubs` (lijst). `club` (migratie 366) blijft voorlopig staan zodat
-- een oudere app-versie tijdens de deploy blijft werken; de app leest `clubs`.

alter table public.pt_lead_links
  add column if not exists clubs text[] not null default '{}';

alter table public.pt_lead_links drop constraint if exists pt_lead_links_clubs_check;
alter table public.pt_lead_links add constraint pt_lead_links_clubs_check check (clubs <@ array[
  'budel', 'bergeijk', 'someren', 'eindhoven_boschdijk', 'eindhoven_tongelre', 'eersel', 'oisterwijk', 'bladel'
]::text[]);

-- Bestaande clubmanagers: hun ene club wordt de lijst.
update public.pt_lead_links set clubs = array[club] where club is not null and clubs = '{}';

-- Een clubmanager heeft minstens één club (vervangt de check uit 366).
alter table public.pt_lead_links drop constraint if exists pt_lead_links_clubmanager_club;
alter table public.pt_lead_links add constraint pt_lead_links_clubmanager_club check (rol <> 'clubmanager' or cardinality(clubs) > 0);
