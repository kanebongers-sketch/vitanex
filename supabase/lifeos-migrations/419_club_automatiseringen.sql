-- 419: Club, automatiseringen voor ledenbehoud en de opvolglijst voor het team.
-- Alleen toevoegen, idempotent. RLS aan zonder policies: alleen de server schrijft.
-- Club verstuurt zelf geen berichten; de regels vullen alleen de opvolglijst.

-- Regels per sportschool (user_id = club_organisaties.id).
create table if not exists club_automatiseringen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  regel text not null check (regel in ('welkom', 'proefles_opvolgen', 'niet_gezien', 'risico', 'verjaardag', 'opzegging', 'mijlpaal')),
  aan boolean not null default true,
  drempel integer check (drempel is null or (drempel >= 1 and drempel <= 500)),
  rol text check (rol is null or rol in ('trainer', 'instructeur', 'manager', 'administratie', 'iedereen')),
  medewerker_id uuid references club_medewerkers(id) on delete set null,
  sjabloon text not null check (char_length(sjabloon) between 1 and 600),
  demo boolean not null default false,
  bijgewerkt_op timestamptz not null default now(),
  unique (user_id, regel)
);
alter table club_automatiseringen enable row level security;

-- Opvolgtaken: per lid, regel en periode hooguit een taak.
create table if not exists club_opvolgtaken (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null,
  lid_id uuid not null references club_leden(id) on delete cascade,
  regel text not null check (regel in ('welkom', 'proefles_opvolgen', 'niet_gezien', 'risico', 'verjaardag', 'opzegging', 'mijlpaal')),
  periode text not null check (char_length(periode) between 1 and 40),
  waarde integer,
  reden text not null default '' check (char_length(reden) <= 200),
  status text not null default 'open' check (status in ('open', 'gedaan', 'overgeslagen', 'vervallen')),
  rol text check (rol is null or rol in ('trainer', 'instructeur', 'manager', 'administratie', 'iedereen')),
  medewerker_id uuid references club_medewerkers(id) on delete set null,
  notitie text check (notitie is null or char_length(notitie) <= 500),
  afgehandeld_door text check (afgehandeld_door is null or char_length(afgehandeld_door) <= 80),
  afgehandeld_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  demo boolean not null default false,
  unique (user_id, lid_id, regel, periode)
);
alter table club_opvolgtaken enable row level security;
create index if not exists club_opvolgtaken_lijst on club_opvolgtaken (user_id, vestiging, status);
create index if not exists club_opvolgtaken_afgehandeld on club_opvolgtaken (user_id, vestiging, afgehandeld_op desc) where status <> 'open';

-- Welke vestiging vandaag al een ronde had (zodat Club Vandaag niet elke keer alles narekent).
create table if not exists club_opvolg_rondes (
  user_id uuid not null,
  vestiging text not null,
  dag date not null,
  gedaan_op timestamptz not null default now(),
  primary key (user_id, vestiging, dag)
);
alter table club_opvolg_rondes enable row level security;

-- Bezoekdagen per lid van een vestiging: ooit en tot een moment (voor mijlpalen).
-- Een bezoek is een kalenderdag in Nederland, net als bij de behoudsscore.
create or replace function club_bezoek_totalen(p_user uuid, p_vestiging text, p_voor timestamptz)
returns table (lid_id uuid, totaal integer, voor integer)
language sql
stable
security invoker
set search_path = public
as $$
  select c.lid_id,
         count(distinct (c.op at time zone 'Europe/Amsterdam')::date)::integer as totaal,
         count(distinct (c.op at time zone 'Europe/Amsterdam')::date) filter (where c.op < p_voor)::integer as voor
  from club_checkins c
  join club_leden l on l.id = c.lid_id and l.user_id = p_user and l.vestiging = p_vestiging
  where c.user_id = p_user
  group by c.lid_id
$$;
revoke all on function club_bezoek_totalen(uuid, text, timestamptz) from public, anon, authenticated;

-- Demo: de standaardregels aan voor Fit Factory en Voorbeeld Gym.
insert into club_automatiseringen (user_id, regel, aan, drempel, rol, sjabloon, demo)
select o.user_id, r.regel, true, r.drempel, r.rol, r.sjabloon, true
from (values ('67b0a700-3f1d-425e-9646-98c237e34fd7'::uuid), ('de000000-0000-4000-8000-0000000000c1'::uuid)) as o(user_id)
cross join (values
  ('welkom', 7, 'trainer', 'Hoi {voornaam}, welkom bij {vestiging}! Fijn dat je erbij bent. Hoe bevallen je eerste trainingen? Als je ergens hulp bij wilt, spreek gerust een trainer aan.'),
  ('proefles_opvolgen', 3, 'trainer', 'Hoi {voornaam}, je traint nu {dagen} dagen bij ons in {vestiging}. Hoe bevalt het tot nu toe? Ik vertel je graag welk lidmaatschap bij je past.'),
  ('niet_gezien', 14, 'trainer', 'Hoi {voornaam}, we hebben je al {dagen} dagen niet gezien in {vestiging}. Alles goed? Als we je ergens mee kunnen helpen, bijvoorbeeld met een nieuw schema of een vaste trainingstijd, laat het weten.'),
  ('risico', 45, 'manager', 'Hoi {voornaam}, hoe gaat het met trainen? We merken dat je wat minder komt dan eerst. Zullen we samen kijken wat je weer op gang helpt? Je bent altijd welkom in {vestiging}.'),
  ('verjaardag', null, 'trainer', 'Gefeliciteerd met je verjaardag, {voornaam}! Een hele fijne dag gewenst namens iedereen van {vestiging}.'),
  ('opzegging', null, 'manager', 'Hoi {voornaam}, we zagen dat je je lidmaatschap hebt opgezegd. Jammer dat je gaat! Mogen we vragen waarom? Je antwoord helpt ons beter te worden. En als we nog iets voor je kunnen doen, horen we het graag.'),
  ('mijlpaal', 50, 'trainer', 'Wauw {voornaam}, dit is al je {bezoeken}e bezoek aan {vestiging}! Knap volgehouden. Op naar de volgende!')
) as r(regel, drempel, rol, sjabloon)
where exists (select 1 from club_organisaties co where co.id = o.user_id)
on conflict (user_id, regel) do nothing;

-- Demo: een paar afgehandelde taken van vorige week, zodat "Recent afgehandeld" iets laat zien.
insert into club_opvolgtaken (user_id, vestiging, lid_id, regel, periode, waarde, reden, status, rol, notitie, afgehandeld_door, afgehandeld_op, aangemaakt_op, demo)
select l.user_id, l.vestiging, l.id, 'niet_gezien', 'demo-' || to_char(current_date - 6, 'YYYY-MM-DD'), 15, 'Al 15 dagen niet geweest',
       case when x.n % 3 = 0 then 'overgeslagen' else 'gedaan' end, 'trainer',
       case x.n % 3 when 1 then 'Gebeld, had griep. Komt maandag weer.' when 2 then 'Appje gestuurd, traint nu op zondag.' else 'Niet bereikt, volgende week nog een keer.' end,
       'Demo', now() - ((x.n + 1) || ' days')::interval, now() - ((x.n + 3) || ' days')::interval, true
from (
  select id, row_number() over (partition by vestiging order by id) as n
  from club_leden
  where demo = true and status = 'actief' and vestiging in ('budel', 'voorbeeld-centrum', 'voorbeeld-noord')
) x
join club_leden l on l.id = x.id
where x.n <= 3
on conflict (user_id, lid_id, regel, periode) do nothing;
