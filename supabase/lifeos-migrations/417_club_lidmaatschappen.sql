-- ─── Club: lidmaatschapsvormen en labels (zonder geld) ──────────────────────
-- Per sportschool (user_id) de nette lijst van lidmaatschapsvormen (zoals ze in
-- Sportivity heten) met de toegangsregels, en de labels boven club_leden.tags.
-- Geen prijzen, geen contracten: geld blijft in Sportivity (besluit Kane).
-- Een lid hoort bij een vorm via club_leden.abonnement (zelfde naam, hoofdletters
-- en spaties maken niet uit). Leden-tags blijven in club_leden.tags.
-- Idempotent; voegt alleen toe. Alleen de server schrijft (RLS aan, geen policies).

create table if not exists public.club_lidmaatschapsvormen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  naam text not null check (char_length(naam) between 1 and 80),
  omschrijving text not null default '' check (char_length(omschrijving) <= 300),
  -- null = alle vestigingen van de sportschool, anders de slugs.
  vestigingen text[],
  groepslessen boolean not null default true,
  max_lessen_per_week integer check (max_lessen_per_week between 1 and 21),
  -- Daluren: alleen binnen dit venster (Nederlandse klok). Beide leeg = altijd.
  daluren_van time,
  daluren_tot time,
  daluren_weekend_vrij boolean not null default false,
  kleur text not null default 'amber' check (kleur in ('amber', 'blauw', 'groen', 'roze', 'turkoois', 'geel', 'lila', 'zand')),
  actief boolean not null default true,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  constraint club_lidmaatschapsvormen_daluren check (
    (daluren_van is null and daluren_tot is null)
    or (daluren_van is not null and daluren_tot is not null and daluren_tot > daluren_van)
  )
);

create unique index if not exists club_lidmaatschapsvormen_naam on public.club_lidmaatschapsvormen (user_id, lower(btrim(naam)));
alter table public.club_lidmaatschapsvormen enable row level security;

create table if not exists public.club_labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- Genormaliseerd zoals normaliseerTag: kleine letters, cijfers en koppeltekens.
  naam text not null check (naam ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(naam) <= 30),
  omschrijving text not null default '' check (char_length(omschrijving) <= 200),
  kleur text not null default 'blauw' check (kleur in ('amber', 'blauw', 'groen', 'roze', 'turkoois', 'geel', 'lila', 'zand')),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);

create unique index if not exists club_labels_naam on public.club_labels (user_id, naam);
create index if not exists club_leden_tags_gin on public.club_leden using gin (tags);
alter table public.club_labels enable row level security;

-- ── Een label hernoemen: label en tags van alle leden in een transactie ─────
-- Volgorde van de tags blijft gelijk; staat de nieuwe naam al bij een lid, dan
-- blijft hij een keer staan. Geeft het aantal geraakte leden, of -1 als het
-- label niet bestaat. Alleen voor de server (service role).
create or replace function public.club_label_hernoemen(p_user uuid, p_id uuid, p_nieuw text)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_oud text;
  v_aantal integer;
begin
  select naam into v_oud from club_labels where id = p_id and user_id = p_user for update;
  if v_oud is null then return -1; end if;
  update club_labels set naam = p_nieuw where id = p_id and user_id = p_user;
  if v_oud = p_nieuw then return 0; end if;
  update club_leden l
     set tags = array(
           select s.t from (
             select case when u.t = v_oud then p_nieuw else u.t end as t, min(u.n) as n
             from unnest(l.tags) with ordinality as u(t, n)
             group by 1
           ) s order by s.n
         ),
         bijgewerkt_op = now()
   where l.user_id = p_user and v_oud = any(l.tags);
  get diagnostics v_aantal = row_count;
  return v_aantal;
end;
$$;

-- ── Een label verwijderen, desgewenst ook van alle leden af ─────────────────
create or replace function public.club_label_verwijderen(p_user uuid, p_id uuid, p_tags_ook boolean)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_naam text;
  v_aantal integer := 0;
begin
  delete from club_labels where id = p_id and user_id = p_user returning naam into v_naam;
  if v_naam is null then return -1; end if;
  if p_tags_ook then
    update club_leden set tags = array_remove(tags, v_naam), bijgewerkt_op = now()
     where user_id = p_user and v_naam = any(tags);
    get diagnostics v_aantal = row_count;
  end if;
  return v_aantal;
end;
$$;

revoke all on function public.club_label_hernoemen(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.club_label_verwijderen(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.club_label_hernoemen(uuid, uuid, text) to service_role;
grant execute on function public.club_label_verwijderen(uuid, uuid, boolean) to service_role;

-- ── Demodata ────────────────────────────────────────────────────────────────
-- Fit Factory: de abonnementsnamen uit het ledenbestand, zonder verzonnen
-- limieten. Toegang: overal behalve Eersel (leden van Eersel sporten overal).
insert into public.club_lidmaatschapsvormen (user_id, naam, omschrijving, vestigingen, groepslessen, kleur, demo)
select '67b0a700-3f1d-425e-9646-98c237e34fd7'::uuid, v.naam, v.omschrijving,
       array['bergeijk', 'bladel', 'budel', 'eindhoven_boschdijk', 'eindhoven_tongelre', 'oisterwijk', 'someren'],
       true, v.kleur, true
from (values
  ('Premium + EGYM Programma', 'Fitness, groepslessen en het EGYM-circuit.', 'amber'),
  ('Premium + EGYM Flex Programma', 'Als Premium + EGYM, maandelijks opzegbaar.', 'geel'),
  ('Fit Programma', 'Fitness en groepslessen.', 'blauw'),
  ('Fit Flex Programma', 'Als Fit Programma, maandelijks opzegbaar.', 'turkoois'),
  ('Fit 1x p/wk', 'Een keer per week sporten.', 'lila'),
  ('Fit jeugd 16-21 jaar', 'Voor jongeren van 16 tot en met 21 jaar.', 'groen')
) as v(naam, omschrijving, kleur)
on conflict do nothing;

-- Voorbeeld Gym: elke soort regel een keer, zodat de toegangsregels te zien zijn.
insert into public.club_lidmaatschapsvormen
  (user_id, naam, omschrijving, vestigingen, groepslessen, max_lessen_per_week, daluren_van, daluren_tot, daluren_weekend_vrij, kleur, actief, demo)
values
  ('de000000-0000-4000-8000-0000000000c1', 'Onbeperkt 12 maanden', 'Alles, op beide vestigingen, voor een jaar.', null, true, null, null, null, false, 'amber', true, true),
  ('de000000-0000-4000-8000-0000000000c1', 'Onbeperkt maand', 'Alles, op beide vestigingen, per maand opzegbaar.', null, true, null, null, null, false, 'geel', true, true),
  ('de000000-0000-4000-8000-0000000000c1', 'Groepslessen', 'Alleen groepslessen, maximaal drie per week.', null, true, 3, null, null, false, 'roze', true, true),
  ('de000000-0000-4000-8000-0000000000c1', 'Fitness flex', 'Alleen de fitnessvloer van Centrum, geen groepslessen.', array['voorbeeld-centrum'], false, null, null, null, false, 'blauw', true, true),
  ('de000000-0000-4000-8000-0000000000c1', 'Dal-uren', 'Doordeweeks van 09:00 tot 16:00, in het weekend de hele dag.', null, true, 2, '09:00', '16:00', true, 'turkoois', true, true),
  ('de000000-0000-4000-8000-0000000000c1', 'Student', 'Op vertoon van een studentenpas, maximaal twee lessen per week.', null, true, 2, null, null, false, 'groen', true, true),
  ('de000000-0000-4000-8000-0000000000c1', 'Zomerkaart', 'Liep in juli en augustus; niet meer te koop.', array['voorbeeld-noord'], true, null, null, null, false, 'zand', false, true)
on conflict do nothing;

insert into public.club_labels (user_id, naam, omschrijving, kleur, demo) values
  ('67b0a700-3f1d-425e-9646-98c237e34fd7', 'pt-interesse', 'Wil meer weten over personal training.', 'amber', true),
  ('67b0a700-3f1d-425e-9646-98c237e34fd7', 'nieuw', 'De eerste weken lid: extra aandacht op de vloer.', 'groen', true),
  ('67b0a700-3f1d-425e-9646-98c237e34fd7', 'egym-intake', 'Moet nog een EGYM-intake plannen.', 'blauw', true),
  ('de000000-0000-4000-8000-0000000000c1', 'pt-interesse', 'Wil meer weten over personal training.', 'amber', true),
  ('de000000-0000-4000-8000-0000000000c1', 'studentenactie', 'Ingeschreven via de studentenactie.', 'groen', true),
  ('de000000-0000-4000-8000-0000000000c1', 'terugkerend-lid', 'Was eerder lid en is teruggekomen.', 'lila', true)
on conflict do nothing;
