-- ─── LifeOS 110 — Kennis: titels + backlinks tussen notities ────────────────
--
-- Draaien op het LIFEOS-project (bbklogjersviaoocgrve), NIET op MentaForce.
-- Zie README.md in deze map.
--
-- Bouwt de notities uit 050 uit van "losse tekst op een dag" naar een netwerk:
-- schrijf `[[Marge-model]]` in een notitie en die verwijzing wordt een echte,
-- navigeerbare relatie. Wat een brain dump mist zodra hij groeit is niet zoeken
-- (dat werkt, 090) maar VERBAND: waar had ik dit eerder over?
--
-- ─── WAAROM `titel` NULLABLE IS (de kernkeuze van deze migratie) ────────────
--
--   Backlinks vereisen adresseerbaarheid: naar een notitie zonder naam kun je
--   niet verwijzen. De voor de hand liggende zet is dus `titel not null`.
--
--   Dat zou de functie uit 050 slopen. De brain dump is één tik zonder wrijving
--   — "Wat zit er in je hoofd?" en klaar. Een verplicht titelveld is precies de
--   drempel waardoor mensen hun hoofd niet meer leegmaken; dan hebben we een
--   perfect grafiekschema over een lege database.
--
--   Daarom: titel is OPTIONEEL en post-hoc, net als tags (090) en categorie.
--   Capture blijft één tik; je geeft een notitie pas een naam op het moment dat
--   je er iets anders aan wil hángen.
--
--   De eerlijke prijs: een titelloze notitie kan wél verwijzen, maar er kan niet
--   naar verwezen worden. Hij is een blad in de grafiek, nooit een knooppunt.
--   Dat is geen bug maar de ruil — en hij is omkeerbaar: geef 'm alsnog een
--   titel en alle wachtende `[[...]]`-verwijzingen klikken vanzelf vast (zie
--   `doel_id` hieronder).
--
-- Idempotent: opnieuw draaien is veilig.

-- ─── notities.titel ─────────────────────────────────────────────────────────

alter table public.notities
  add column if not exists titel text;

-- Bewust een APARTE `alter table`: de gegenereerde kolom hieronder leest `titel`,
-- en een kolom toevoegen die een kolom uit dezelfde statement gebruikt, is precies
-- het soort ding dat per Postgres-versie anders uitpakt. Twee statements kosten
-- niets en doen het altijd.
alter table public.notities
  -- De vergelijkingssleutel, door de DATABASE afgeleid i.p.v. door de API
  -- meegestuurd. Twee redenen:
  --
  --   1. `[[marge-model]]` moet de notitie "Marge-model" vinden. Een titel is
  --      leesbare prose (hoofdletters doen ertoe voor het oog), maar de MATCH
  --      moet hoofdletterloos zijn — anders krijg je twee knopen die er voor
  --      een mens hetzelfde uitzien.
  --   2. Als kolom i.p.v. als expressie-index is hij ook OPVRAAGBAAR:
  --      `.in('titel_sleutel', [...])` lost in één query een hele notitie vol
  --      verwijzingen op. Met een kale expressie-index (`lower(btrim(titel))`)
  --      is de uniciteit wél afgedwongen, maar kan PostgREST er niet op
  --      filteren en wordt het één query per link.
  --
  -- `nullif(..., '')`: een titel van alleen spaties is geen titel. Zonder deze
  -- zou '' een geldige sleutel zijn en zouden twee "lege" titels botsen.
  add column if not exists titel_sleutel text
    generated always as (nullif(lower(btrim(titel)), '')) stored;

do $$
begin
  -- Zelfde grens als projecten.naam (100). Een titel is een naam, geen tekst;
  -- wie een alinea als titel wil, bedoelt de tekst zelf.
  if not exists (select 1 from pg_constraint where conname = 'notities_titel_lengte') then
    alter table public.notities add constraint notities_titel_lengte
      check (titel is null or length(btrim(titel)) between 1 and 120);
  end if;
end $$;

-- Eén notitie per titel. Case-insensitief (via de sleutel hierboven) en
-- PARTIEEL: titelloze notities zijn er onbeperkt veel, en die mogen deze index
-- dus niet raken. Zonder deze index zou `[[Marge-model]]` twee notities kunnen
-- aanwijzen en zou "welke bedoel je?" een vraag zonder antwoord zijn.
create unique index if not exists notities_titel_uniek
  on public.notities (user_id, titel_sleutel)
  where titel_sleutel is not null;

-- ─── notitie_links ──────────────────────────────────────────────────────────
-- Afgeleide data, bewust wél opgeslagen. Dat is een uitzondering op "leid af uit
-- de bron" (architecture.md), dus hij moet verdiend worden:
--
--   De bron is `notities.tekst` — daar staan de `[[...]]` in. De grafiek en de
--   backlinks live uit die tekst afleiden zou betekenen: élke notitie van de
--   gebruiker inlezen en parsen om één vraag te beantwoorden ("wie verwijst
--   hiernaar?"). Dat is een full scan per view.
--
--   Deze tabel is dus een INDEX op de tekst, geen tweede waarheid. De regel die
--   dat waar houdt: hij wordt bij élke schrijfactie op de tekst herbouwd vanuit
--   `parseLinks()` (src/lib/lifeos/notities/kennis.ts), nooit los bijgewerkt.
--   Loopt hij ooit uiteen, dan wint de tekst.

create table if not exists public.notitie_links (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,

  -- De notitie waarin de `[[...]]` staat. CASCADE: verdwijnt de tekst, dan
  -- verdwijnt de verwijzing — hij bestónd alleen in die tekst.
  bron_id       uuid        not null references public.notities (id) on delete cascade,

  -- De notitie waarnaar verwezen wordt, of NULL.
  --
  -- NULL is hier geen "onbekend/kapot" maar een echte, nuttige toestand: een
  -- verwijzing naar iets dat nog niet bestaat (Obsidian noemt dit een "wanted
  -- link"). Je schrijft `[[Marge-model]]` vóórdat je die notitie maakt — dat is
  -- niet fout, dat is hoe denken werkt. Zodra er een notitie met die titel
  -- komt, vult `hersyncTitel()` de doel_id alsnog in.
  --
  -- ON DELETE SET NULL en niet CASCADE: verwijder je de doelnotitie, dan is de
  -- verwijzing er nog steeds — je schreef 'm op. Hij valt netjes terug naar
  -- "wanted link" i.p.v. stil uit de tekst-context te verdwijnen. CASCADE zou
  -- hier data weggooien die de gebruiker zelf getypt heeft.
  doel_id       uuid        references public.notities (id) on delete set null,

  -- De titel zoals hij in de tekst stond. NOT NULL, want dít is wat de
  -- verwijzing ís: zonder doel_id is de titel het enige dat er nog is.
  doel_titel    text        not null,

  -- Zelfde truc als notities.titel_sleutel: afgeleid, opvraagbaar, en de basis
  -- van de uniciteit hieronder.
  doel_sleutel  text        generated always as (nullif(lower(btrim(doel_titel)), '')) stored,

  aangemaakt_op timestamptz not null default now(),

  constraint notitie_links_doel_titel_lengte
    check (length(btrim(doel_titel)) between 1 and 120)
);

-- Twee keer `[[Marge-model]]` in één notitie is één verwijzing, geen twee. De
-- parser ontdubbelt al (case-insensitief); deze index is de garantie eronder,
-- zodat een dubbele insert een 23505 geeft i.p.v. een dubbele kant in de
-- grafiek.
create unique index if not exists notitie_links_bron_doel_uniek
  on public.notitie_links (bron_id, doel_sleutel);

-- DE backlink-query: "wie verwijst naar deze notitie?". Partieel — een wanted
-- link heeft geen doel_id en wordt door deze vraag nooit opgehaald.
create index if not exists notitie_links_doel_idx
  on public.notitie_links (doel_id)
  where doel_id is not null;

-- De andere kant: "krijgt deze titel nu een notitie? vul dan de wachtende
-- verwijzingen in". Op sleutel, want dat is waar we op matchen.
create index if not exists notitie_links_user_doel_sleutel_idx
  on public.notitie_links (user_id, doel_sleutel);

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Zelfde patroon als 050: aparte policy per commando, `(select auth.uid())` als
-- initplan i.p.v. per rij. RLS zonder policy geeft stil 0 rijen — dus expliciet.
--
-- De routes praten met de service-role (die RLS omzeilt) achter een founder-gate;
-- deze policies zijn de tweede verdediging, voor als er ooit met een gewone
-- sleutel gelezen wordt.

alter table public.notitie_links enable row level security;

drop policy if exists notitie_links_select_eigen on public.notitie_links;
create policy notitie_links_select_eigen on public.notitie_links
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists notitie_links_insert_eigen on public.notitie_links;
create policy notitie_links_insert_eigen on public.notitie_links
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists notitie_links_update_eigen on public.notitie_links;
create policy notitie_links_update_eigen on public.notitie_links
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists notitie_links_delete_eigen on public.notitie_links;
create policy notitie_links_delete_eigen on public.notitie_links
  for delete to authenticated
  using (user_id = (select auth.uid()));

comment on table public.notitie_links is
  'Verwijzingen ([[titel]]) tussen notities. Afgeleid uit notities.tekst en bij '
  'elke schrijfactie herbouwd — de tekst is de waarheid, deze tabel is de index. '
  'doel_id null = wanted link: de doelnotitie bestaat (nog) niet.';

-- ─── Zelfcontrole ───────────────────────────────────────────────────────────
-- Faalt liever hier dan dat een tabel stil zonder RLS in productie staat, of dat
-- de uniciteit ontbreekt waar de hele resolutie op leunt. Kost niets en bewijst
-- de bedoeling hierboven.

do $$
begin
  if not exists (
    select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'notitie_links'
       and c.relrowsecurity = true
  ) then
    raise exception 'RLS staat uit op public.notitie_links';
  end if;

  if not exists (
    select 1 from pg_indexes
     where schemaname = 'public' and indexname = 'notities_titel_uniek'
  ) then
    raise exception 'Titels zijn niet uniek per gebruiker — [[verwijzingen]] kunnen niet oplossen';
  end if;

  if not exists (
    select 1 from pg_indexes
     where schemaname = 'public' and indexname = 'notitie_links_bron_doel_uniek'
  ) then
    raise exception 'Dubbele verwijzingen zijn niet uitgesloten';
  end if;
end $$;
