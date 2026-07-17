-- ─── LifeOS 120 — Vita's geheugen krijgt een schrijfpad, en een briefinglogboek ─
--
-- Draaien op het LIFEOS-project (bbklogjersviaoocgrve), NIET op MentaForce.
-- Zie README.md in deze map.
--
-- ─── WAAROM DEZE MIGRATIE BESTAAT ───────────────────────────────────────────
--
--   `vita_geheugen` staat er sinds 040. Het wordt GELEZEN (context.ts bouwt er de
--   sectie "Wat ik over Kane onthoud" mee) maar er was in de hele codebase geen
--   enkele INSERT. De sectie was dus permanent leeg — een kop zonder inhoud, elke
--   request opnieuw meebetaald in tokens.
--
--   Deze migratie voegt toe wat een schrijfpad nodig heeft dat 040 nog niet had,
--   en niets meer. De tabel zelf blijft zoals hij is.
--
-- Idempotent: opnieuw draaien is veilig.

-- ─── vita_geheugen: grenzen die het schrijfpad nodig heeft ──────────────────

-- 040 zette `check (length(btrim(inhoud)) > 0)` — een ondergrens, geen bovengrens.
-- Elk geheugen gaat bij ELKE Vita-request mee in de systeemprompt. Zonder plafond
-- is één geplakte e-mail van 8kB genoeg om de context te verdrinken én er per
-- vraag voor te betalen. 500 tekens is ruim voor "ik train liever 's ochtends" en
-- te krap voor een muur tekst — precies de bedoeling.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'vita_geheugen_inhoud_lengte') then
    alter table public.vita_geheugen add constraint vita_geheugen_inhoud_lengte
      check (length(inhoud) <= 500);
  end if;

  -- `bron` mag null zijn (040: "null = onbekend, behandel als onbevestigd"), maar
  -- een lege string is iets anders dan null: die ziet er in de UI uit als een
  -- ingevulde herkomst en is het niet. Verbied 'm, zodat "onbekend" precies één
  -- vorm heeft.
  if not exists (select 1 from pg_constraint where conname = 'vita_geheugen_bron_gevuld') then
    alter table public.vita_geheugen add constraint vita_geheugen_bron_gevuld
      check (bron is null or length(btrim(bron)) between 1 and 120);
  end if;
end $$;

-- Eén feit, één rij. Zonder deze index levert twee keer op "Bewaar" drukken twee
-- identieke regels in de prompt op — en dan lijkt een herhaald feit belangrijker
-- dan het is. Case-insensitief en getrimd, want "Ik woon in Eersel" en
-- "ik woon in eersel " zijn hetzelfde feit.
--
-- Dit index-aanmaken kan alleen falen als er al duplicaten staan. Dat kan niet:
-- er was tot deze migratie geen enkele schrijver (zie de kop). Faalt het tóch,
-- dan is dat een echte vondst — niet iets om weg te `on conflict`-en.
create unique index if not exists vita_geheugen_uniek
  on public.vita_geheugen (user_id, soort, lower(btrim(inhoud)));

comment on index public.vita_geheugen_uniek is
  'Eén feit per soort per gebruiker. Een dubbele insert is een 23505, geen tweede regel in de prompt.';

-- ─── vita_briefingen ────────────────────────────────────────────────────────
-- Het logboek van de dagbriefing die Vita uit zichzelf stuurt (Telegram).
--
-- ─── DIT IS EEN SLOT, GEEN ARCHIEF ──────────────────────────────────────────
--
--   De unieke index hieronder is de hele reden dat deze tabel bestaat. Een cron
--   draait niet één keer: hij wordt overgedaan na een timeout, hij wordt handmatig
--   getriggerd, en op een platform met meerdere instances kan hij dubbel vuren.
--   Zonder slot krijgt Kane zijn briefing twee keer — en een assistent die zichzelf
--   herhaalt leer je wegkijken. Dan is de hele proactieve laag stuk.
--
--   Het slot is de INSERT zelf, niet een `select` vooraf: "kijken of hij er al is
--   en dan schrijven" is precies waar de race in zit. Wie de rij weet te
--   inserten, mag sturen. De rest krijgt een 23505 en zwijgt.
--
-- `bezorgd_op` is null tussen claimen en versturen. Lukt het versturen niet, dan
-- geeft de route de claim terug (delete) zodat een retry wél kan. Een rij met
-- `bezorgd_op is null` die blijft staan betekent dus: het proces is halverwege
-- omgevallen. Dat is zichtbaar, en dat is de bedoeling.

create table if not exists public.vita_briefingen (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  -- Lokale dag (Europe/Amsterdam), niet UTC. Een briefing hoort bij de dag zoals
  -- Kane hem beleeft; om 01:00 CEST is het in UTC nog gisteren.
  datum         date        not null,
  kanaal        text        not null,
  -- Wat er letterlijk verstuurd is. Zonder dit kun je later niet nagaan wát Vita
  -- beweerde — en een assistent wiens uitspraken je niet kunt terugzoeken, kun je
  -- ook niet op een fout betrappen.
  inhoud        text,
  aangemaakt_op timestamptz not null default now(),
  bezorgd_op    timestamptz,

  -- Allowlist: een typfout ('telegramm') faalt hier bij het schrijven in plaats
  -- van stil een tweede briefing per dag toe te staan omdat het slot op een ander
  -- kanaal keek. Uitbreiden mag — bewust, hier.
  constraint vita_briefingen_kanaal_geldig check (kanaal in ('telegram')),
  constraint vita_briefingen_inhoud_lengte check (inhoud is null or length(inhoud) <= 8000)
);

comment on table public.vita_briefingen is
  'Logboek + idempotentieslot voor de proactieve dagbriefing. RLS: user_id = auth.uid().';
comment on column public.vita_briefingen.datum is
  'Lokale dag (Europe/Amsterdam) waarvoor de briefing gold.';
comment on column public.vita_briefingen.bezorgd_op is
  'null = geclaimd maar (nog) niet bezorgd. Niet hetzelfde als "niet verstuurd" — het kan er ook halverwege uit gelegen hebben.';
comment on column public.vita_briefingen.inhoud is
  'De verstuurde tekst. null bij een claim die nooit bezorgd is.';

-- Het slot. Eén briefing per gebruiker per dag per kanaal.
create unique index if not exists vita_briefingen_uniek
  on public.vita_briefingen (user_id, datum, kanaal);

comment on index public.vita_briefingen_uniek is
  'HET SLOT: hierdoor kan de cron dezelfde dag niet twee keer pushen. Niet weghalen.';

-- "Wanneer stuurde ik voor het laatst iets?" — de vraag die de Vita-kaart stelt om
-- te kunnen zeggen óf de dagbriefing echt loopt. Partieel: onbezorgde claims zijn
-- geen bezorging en horen dit antwoord niet te vervuilen.
create index if not exists vita_briefingen_bezorgd
  on public.vita_briefingen (user_id, bezorgd_op desc)
  where bezorgd_op is not null;

-- ─── RLS: vita_briefingen ───────────────────────────────────────────────────
-- Spiegelt `vita_signalen` uit 040: lezen mag, schrijven niet.
--
-- Geen insert/update-policy voor `authenticated`. Briefingen worden server-side
-- geschreven door de cron (service-role). Mocht de client ze mogen schrijven, dan
-- kon je je eigen slot zetten en daarmee je briefing voor die dag onderdrukken —
-- of er een verzinnen die nooit verstuurd is. Dan is het logboek geen bewijs meer
-- van wat er écht gestuurd is, en dat is het enige waar het voor bestaat.

alter table public.vita_briefingen enable row level security;

drop policy if exists vita_briefingen_select_eigen on public.vita_briefingen;
create policy vita_briefingen_select_eigen on public.vita_briefingen
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ─── Zelfcontrole ───────────────────────────────────────────────────────────
-- Faalt liever hier dan dat een tabel stil zonder RLS in productie staat, of dat
-- het slot ontbreekt en de dubbele-briefing pas opvalt als Kane 'm twee keer krijgt.

do $$
declare
  ontbreekt text;
begin
  select string_agg(c.relname, ', ')
    into ontbreekt
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind = 'r'
     and c.relname in ('vita_geheugen', 'vita_briefingen')
     and c.relrowsecurity = false;

  if ontbreekt is not null then
    raise exception 'RLS staat uit op: %', ontbreekt;
  end if;

  if not exists (select 1 from pg_class where relname = 'vita_briefingen_uniek' and relkind = 'i') then
    raise exception 'Het idempotentieslot vita_briefingen_uniek ontbreekt — de cron zou dubbel kunnen sturen.';
  end if;

  if not exists (select 1 from pg_class where relname = 'vita_geheugen_uniek' and relkind = 'i') then
    raise exception 'vita_geheugen_uniek ontbreekt — dubbele feiten zouden de prompt in kunnen.';
  end if;
end $$;
