-- 461: Club, ledenbetalingen via Stripe Connect, fase 3: facturen, betalingen, kasboek, audit, outbox.
-- Bouwplan: docs/aiyourgym/betalen/BOUWPLAN.md (secties 1.3 tot 1.5 en 2.3 tot 2.5). Alleen toevoegen, idempotent.
-- Vereist 460 (contracten, mandaten) en de functie club_betalen_alleen_toevoegen() uit 460.
--
--   club_betalen_factuurreeksen   teller per sportschool, soort en jaar (doorlopend, zonder gaten)
--   club_betalen_facturen         bevroren na definitief; unieke periode = harde rem tegen een dubbele maandfactuur
--   club_betalen_factuurregels    regels, onveranderlijk na definitief
--   club_betalen_betalingen       elke incassopoging; hooguit een lopende poging per factuur
--   club_betalen_terugbetalingen  som nooit meer dan betaald (trigger)
--   club_betalen_geschillen       disputes
--   club_betalen_herinneringen    uniek per factuur, stap en kanaal
--   club_betalen_boekingen        kasboek, alleen toevoegen (enige uitzondering: lid_id naar null voor de AVG)
--   club_betalen_audit            alleen toevoegen, sha256-hashketen per sportschool
--   club_betalen_opdrachten       outbox: elke opdracht aan Stripe, met unieke idempotentiesleutel
--   club_betalen_afstemming       uitkomsten van de dagelijkse controle
--   club_betalen_exports          welke exports gemaakt zijn
--   club_betalen_stripe_events    uitgebreid met status, pogingen, fout, verwerkt_op, account, object_id, user_id
--
-- Functies (security definer, vaste search_path, alleen service_role):
--   club_betalen_factuur_definitief   nummer zonder gaten via een rijslot, bevriest de factuur
--   club_betalen_boek                 een regel in het kasboek, uniek op (user_id, soort, oorzaak)
--   club_betalen_audit_schrijf        een regel in de hashketen
--   club_betalen_audit_controleer     controleert de keten; geeft het eerste foute volgnummer of null
--   club_betalen_betaling_overgang    toestandsmachine die alleen vooruit gaat
--   club_betalen_contract_overgang    toegestane overgangen van een contract
--
-- Alle tabellen: user_id (= club_organisaties.id), RLS aan en geforceerd, geen policies,
-- alles ingetrokken voor anon, authenticated en public. Bedragen zijn gehele centen.
-- De security-definer-functies lezen en schrijven als eigenaar van de tabellen
-- (rol met BYPASSRLS, net als in 449).
--
-- AVG: facturen, betalingen, terugbetalingen, geschillen en boekingen blijven zonder lid
-- bestaan (fiscale bewaarplicht, 7 jaar). Herinneringen en opdrachten gaan weg. De audit
-- bevat geen lid_id en geen persoonsgegevens, alleen ids en bedragen. Zie migratie 462.

-- ── Factuurreeksen ────────────────────────────────────────────────────────────
create table if not exists public.club_betalen_factuurreeksen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  soort text not null check (soort in ('factuur', 'creditnota')),
  jaar integer not null check (jaar between 2020 and 2200),
  prefix text not null default 'F' check (prefix ~ '^[A-Z0-9]{0,8}$'),
  laatste_nummer integer not null default 0 check (laatste_nummer >= 0),
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, soort, jaar)
);

-- ── Facturen ──────────────────────────────────────────────────────────────────
create table if not exists public.club_betalen_facturen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- null na het verwijderen van het lid (fiscale bewaarplicht).
  lid_id uuid references public.club_leden(id) on delete set null,
  contract_id uuid,
  soort text not null check (soort in ('periode', 'eerste', 'handmatig', 'creditnota')),
  creditnota_van uuid,
  nummer text check (nummer is null or char_length(nummer) between 3 and 40),
  reeks_id uuid references public.club_betalen_factuurreeksen(id),
  status text not null default 'concept' check (status in (
    'concept', 'definitief', 'open', 'betaald', 'deels_betaald', 'oninbaar', 'gecrediteerd'
  )),
  periode_van date,
  periode_tot date,
  uitgegeven_op date,
  vervaldatum date,
  subtotaal_excl_cent integer not null default 0 check (subtotaal_excl_cent between 0 and 100000000),
  btw_cent integer not null default 0 check (btw_cent between 0 and 100000000),
  totaal_cent integer not null default 0 check (totaal_cent between 0 and 100000000),
  betaald_cent integer not null default 0 check (betaald_cent >= 0),
  betaald_op date,
  -- Btw per tarief als lijst van { procent, excl_cent, btw_cent }.
  btw_specificatie jsonb not null default '[]'::jsonb check (jsonb_typeof(btw_specificatie) = 'array'),
  -- Bevroren gegevens van de verkoper: { naam, kvk, btw_nummer, adres }.
  verkoper jsonb not null default '{}'::jsonb check (jsonb_typeof(verkoper) = 'object'),
  -- Bevroren gegevens van de klant. Na bewaren_tot: naam 'Geanonimiseerd', adres leeg.
  klant_naam text check (klant_naam is null or char_length(klant_naam) <= 120),
  klant_adres text check (klant_adres is null or char_length(klant_adres) <= 300),
  klant_email text check (klant_email is null or char_length(klant_email) <= 200),
  pdf_pad text check (pdf_pad is null or char_length(pdf_pad) <= 300),
  pdf_hash text check (pdf_hash is null or pdf_hash ~ '^[0-9a-f]{64}$'),
  bewaren_tot date,
  anoniem_op timestamptz,
  herinnering_stap integer not null default 0 check (herinnering_stap between 0 and 10),
  notitie text check (notitie is null or char_length(notitie) <= 300),
  definitief_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  gewijzigd_op timestamptz not null default now(),
  constraint club_betalen_facturen_contract foreign key (user_id, contract_id)
    references public.club_betalen_contracten (user_id, id),
  constraint club_betalen_facturen_creditnota_van foreign key (user_id, creditnota_van)
    references public.club_betalen_facturen (user_id, id),
  constraint club_betalen_facturen_som check (totaal_cent = subtotaal_excl_cent + btw_cent),
  constraint club_betalen_facturen_betaald check (betaald_cent <= totaal_cent),
  constraint club_betalen_facturen_periode_volgorde check (periode_tot is null or periode_van is null or periode_tot >= periode_van),
  constraint club_betalen_facturen_periode_nodig check (
    (soort in ('periode', 'eerste') and periode_van is not null and periode_tot is not null and contract_id is not null)
    or soort in ('handmatig', 'creditnota')
  ),
  constraint club_betalen_facturen_creditnota check ((soort = 'creditnota') = (creditnota_van is not null)),
  constraint club_betalen_facturen_nummer_nodig check (status = 'concept' or (nummer is not null and uitgegeven_op is not null)),
  unique (user_id, id)
);
-- De harde rem tegen een dubbele maandfactuur: een factuur per contract per periode.
-- Concepten tellen mee, zodat de cyclus ook in schaduwmodus nooit dubbel maakt.
create unique index if not exists club_betalen_facturen_periode on public.club_betalen_facturen (user_id, contract_id, periode_van)
  where soort in ('periode', 'eerste');
create unique index if not exists club_betalen_facturen_nummer on public.club_betalen_facturen (user_id, nummer) where nummer is not null;
create index if not exists club_betalen_facturen_lid on public.club_betalen_facturen (lid_id, user_id);
create index if not exists club_betalen_facturen_contract on public.club_betalen_facturen (user_id, contract_id);
create index if not exists club_betalen_facturen_creditnota_van on public.club_betalen_facturen (user_id, creditnota_van) where creditnota_van is not null;
create index if not exists club_betalen_facturen_reeks on public.club_betalen_facturen (reeks_id) where reeks_id is not null;
create index if not exists club_betalen_facturen_open on public.club_betalen_facturen (user_id, status, vervaldatum)
  where status in ('definitief', 'open', 'deels_betaald');
create index if not exists club_betalen_facturen_datum on public.club_betalen_facturen (user_id, uitgegeven_op desc);
create index if not exists club_betalen_facturen_bewaren on public.club_betalen_facturen (bewaren_tot)
  where anoniem_op is null and bewaren_tot is not null;

create table if not exists public.club_betalen_factuurregels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  factuur_id uuid not null,
  volgorde integer not null default 0 check (volgorde between 0 and 1000),
  soort text not null default 'abonnement' check (soort in ('abonnement', 'inschrijving', 'korting', 'pauze', 'handmatig', 'correctie')),
  omschrijving text not null check (char_length(omschrijving) between 1 and 200),
  aantal integer not null default 1 check (aantal between 1 and 1000),
  periode_van date,
  periode_tot date,
  stukprijs_excl_cent integer not null check (stukprijs_excl_cent between -100000000 and 100000000),
  -- Kortingsregels zijn negatief.
  bedrag_excl_cent integer not null check (bedrag_excl_cent between -100000000 and 100000000),
  btw_procent integer not null check (btw_procent in (0, 9, 21)),
  btw_cent integer not null check (btw_cent between -100000000 and 100000000),
  bedrag_incl_cent integer not null check (bedrag_incl_cent between -100000000 and 100000000),
  constraint club_betalen_factuurregels_som check (bedrag_incl_cent = bedrag_excl_cent + btw_cent),
  constraint club_betalen_factuurregels_factuur foreign key (user_id, factuur_id)
    references public.club_betalen_facturen (user_id, id) on delete cascade
);
create index if not exists club_betalen_factuurregels_factuur on public.club_betalen_factuurregels (user_id, factuur_id, volgorde);

-- ── Betalingen ────────────────────────────────────────────────────────────────
create table if not exists public.club_betalen_betalingen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid references public.club_leden(id) on delete set null,
  factuur_id uuid not null,
  contract_id uuid,
  mandaat_id uuid references public.club_betalen_mandaten(id) on delete set null,
  soort text not null check (soort in ('incasso', 'ideal', 'checkout', 'handmatig', 'herhaling')),
  poging integer not null default 1 check (poging between 1 and 50),
  bedrag_cent integer not null check (bedrag_cent between 1 and 100000000),
  status text not null default 'klaar' check (status in (
    'klaar', 'aangeboden', 'in_behandeling', 'geslaagd', 'mislukt', 'geannuleerd', 'gestorneerd', 'storno_teruggedraaid'
  )),
  stripe_account_id text check (stripe_account_id is null or stripe_account_id ~ '^acct_[A-Za-z0-9]{6,250}$'),
  stripe_payment_intent text unique check (stripe_payment_intent is null or stripe_payment_intent ~ '^pi_[A-Za-z0-9_]{6,250}$'),
  stripe_charge_id text check (stripe_charge_id is null or stripe_charge_id ~ '^(ch|py)_[A-Za-z0-9_]{6,250}$'),
  fout_code text check (fout_code is null or char_length(fout_code) <= 80),
  fout_categorie text check (fout_categorie is null or fout_categorie in ('tijdelijk', 'saldo', 'mandaat', 'afgewezen', 'overig')),
  -- Vrije tekst van Stripe: leeg bij verwijderen van het lid.
  fout_bericht text check (fout_bericht is null or char_length(fout_bericht) <= 300),
  aangeboden_op timestamptz,
  verwerkt_op timestamptz,
  mislukt_op timestamptz,
  gestorneerd_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  gewijzigd_op timestamptz not null default now(),
  constraint club_betalen_betalingen_factuur foreign key (user_id, factuur_id)
    references public.club_betalen_facturen (user_id, id),
  constraint club_betalen_betalingen_contract foreign key (user_id, contract_id)
    references public.club_betalen_contracten (user_id, id),
  unique (user_id, factuur_id, poging),
  unique (user_id, id)
);
-- Hooguit een lopende poging per factuur: nooit twee keer tegelijk afschrijven.
create unique index if not exists club_betalen_betalingen_lopend on public.club_betalen_betalingen (user_id, factuur_id)
  where status in ('klaar', 'aangeboden', 'in_behandeling');
create index if not exists club_betalen_betalingen_factuur on public.club_betalen_betalingen (user_id, factuur_id);
create index if not exists club_betalen_betalingen_lid on public.club_betalen_betalingen (lid_id, user_id);
create index if not exists club_betalen_betalingen_contract on public.club_betalen_betalingen (user_id, contract_id) where contract_id is not null;
create index if not exists club_betalen_betalingen_mandaat on public.club_betalen_betalingen (mandaat_id) where mandaat_id is not null;
create index if not exists club_betalen_betalingen_status on public.club_betalen_betalingen (user_id, status, aangemaakt_op);

create table if not exists public.club_betalen_terugbetalingen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid references public.club_leden(id) on delete set null,
  betaling_id uuid not null references public.club_betalen_betalingen(id),
  factuur_id uuid not null,
  creditnota_id uuid,
  bedrag_cent integer not null check (bedrag_cent between 1 and 100000000),
  status text not null default 'aangevraagd' check (status in ('aangevraagd', 'in_behandeling', 'geslaagd', 'mislukt', 'geannuleerd')),
  reden_code text not null default 'overig' check (reden_code in ('verzoek_lid', 'dubbel', 'fout', 'creditnota', 'overig')),
  stripe_refund_id text unique check (stripe_refund_id is null or stripe_refund_id ~ '^re_[A-Za-z0-9_]{6,250}$'),
  -- Vrije tekst: leeg bij verwijderen van het lid.
  toelichting text check (toelichting is null or char_length(toelichting) <= 300),
  aangevraagd_door text check (aangevraagd_door is null or char_length(aangevraagd_door) <= 80),
  aangemaakt_op timestamptz not null default now(),
  verwerkt_op timestamptz,
  constraint club_betalen_terugbetalingen_factuur foreign key (user_id, factuur_id)
    references public.club_betalen_facturen (user_id, id),
  constraint club_betalen_terugbetalingen_creditnota foreign key (user_id, creditnota_id)
    references public.club_betalen_facturen (user_id, id)
);
create index if not exists club_betalen_terugbetalingen_betaling on public.club_betalen_terugbetalingen (betaling_id);
create index if not exists club_betalen_terugbetalingen_factuur on public.club_betalen_terugbetalingen (user_id, factuur_id);
create index if not exists club_betalen_terugbetalingen_lid on public.club_betalen_terugbetalingen (lid_id, user_id);
create index if not exists club_betalen_terugbetalingen_creditnota on public.club_betalen_terugbetalingen (user_id, creditnota_id) where creditnota_id is not null;

create table if not exists public.club_betalen_geschillen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid references public.club_leden(id) on delete set null,
  betaling_id uuid not null references public.club_betalen_betalingen(id),
  factuur_id uuid not null,
  stripe_dispute_id text unique check (stripe_dispute_id is null or stripe_dispute_id ~ '^(dp|du)_[A-Za-z0-9_]{6,250}$'),
  bedrag_cent integer not null check (bedrag_cent between 1 and 100000000),
  status text not null default 'open' check (status in ('open', 'bewijs_nodig', 'in_beoordeling', 'gewonnen', 'verloren', 'teruggetrokken')),
  reden_code text check (reden_code is null or char_length(reden_code) <= 60),
  bewijs_voor date,
  -- Vrije tekst: leeg bij verwijderen van het lid.
  toelichting text check (toelichting is null or char_length(toelichting) <= 300),
  aangemaakt_op timestamptz not null default now(),
  gesloten_op timestamptz,
  constraint club_betalen_geschillen_factuur foreign key (user_id, factuur_id)
    references public.club_betalen_facturen (user_id, id)
);
create index if not exists club_betalen_geschillen_betaling on public.club_betalen_geschillen (betaling_id);
create index if not exists club_betalen_geschillen_factuur on public.club_betalen_geschillen (user_id, factuur_id);
create index if not exists club_betalen_geschillen_lid on public.club_betalen_geschillen (lid_id, user_id);
create index if not exists club_betalen_geschillen_open on public.club_betalen_geschillen (user_id, status)
  where status in ('open', 'bewijs_nodig', 'in_beoordeling');

create table if not exists public.club_betalen_herinneringen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid references public.club_leden(id) on delete cascade,
  factuur_id uuid not null,
  stap integer not null check (stap between 1 and 10),
  kanaal text not null check (kanaal in ('mail', 'app')),
  status text not null default 'gepland' check (status in ('gepland', 'verstuurd', 'mislukt', 'overgeslagen')),
  gepland_op timestamptz not null default now(),
  verstuurd_op timestamptz,
  fout text check (fout is null or char_length(fout) <= 200),
  aangemaakt_op timestamptz not null default now(),
  constraint club_betalen_herinneringen_factuur foreign key (user_id, factuur_id)
    references public.club_betalen_facturen (user_id, id),
  unique (user_id, factuur_id, stap, kanaal)
);
create index if not exists club_betalen_herinneringen_lid on public.club_betalen_herinneringen (lid_id, user_id);
create index if not exists club_betalen_herinneringen_gepland on public.club_betalen_herinneringen (status, gepland_op) where status = 'gepland';

-- ── Kasboek ───────────────────────────────────────────────────────────────────
-- Saldo per factuur = de som van de bedragen: factuur +, betaling -, creditnota -,
-- storno +, storno_terug -, terugbetaling +, afboeking -. Een fout herstel je met een tegenboeking.
create table if not exists public.club_betalen_boekingen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- Het enige veld dat ooit verandert: naar null bij het verwijderen van het lid.
  lid_id uuid references public.club_leden(id) on delete set null,
  factuur_id uuid,
  betaling_id uuid references public.club_betalen_betalingen(id),
  soort text not null check (soort in (
    'factuur', 'betaling', 'creditnota', 'storno', 'storno_terug', 'terugbetaling', 'afboeking', 'correctie'
  )),
  bedrag_cent integer not null check (bedrag_cent <> 0 and bedrag_cent between -100000000 and 100000000),
  -- Sleutel van de gebeurtenis (bijvoorbeeld 'betaling:<id>'); samen met soort uniek.
  oorzaak text not null check (char_length(oorzaak) between 3 and 200),
  boekdatum date not null default ((now() at time zone 'Europe/Amsterdam')::date),
  aangemaakt_op timestamptz not null default now(),
  constraint club_betalen_boekingen_factuur foreign key (user_id, factuur_id)
    references public.club_betalen_facturen (user_id, id),
  constraint club_betalen_boekingen_teken check (
    (soort in ('factuur', 'storno', 'terugbetaling') and bedrag_cent > 0)
    or (soort in ('betaling', 'creditnota', 'storno_terug', 'afboeking') and bedrag_cent < 0)
    or soort = 'correctie'
  ),
  unique (user_id, soort, oorzaak)
);
create index if not exists club_betalen_boekingen_factuur on public.club_betalen_boekingen (user_id, factuur_id);
create index if not exists club_betalen_boekingen_betaling on public.club_betalen_boekingen (betaling_id) where betaling_id is not null;
create index if not exists club_betalen_boekingen_lid on public.club_betalen_boekingen (lid_id, user_id) where lid_id is not null;
create index if not exists club_betalen_boekingen_datum on public.club_betalen_boekingen (user_id, boekdatum);

-- ── Controlelog met hashketen ─────────────────────────────────────────────────
-- Alleen ids, bedragen en codes: geen namen, adressen of vrije tekst. Het onderwerp
-- is een los id (onderwerp_id), geen koppeling met een lid.
create table if not exists public.club_betalen_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  volgnr bigint not null check (volgnr >= 1),
  op timestamptz not null,
  actor_rol text not null check (actor_rol in ('systeem', 'lid', 'medewerker', 'clubmanager', 'eigenaar', 'platform', 'stripe')),
  actor_ref text check (actor_ref is null or char_length(actor_ref) <= 80),
  actie text not null check (char_length(actie) between 3 and 80),
  onderwerp_soort text check (onderwerp_soort is null or char_length(onderwerp_soort) <= 40),
  onderwerp_id uuid,
  oud jsonb,
  nieuw jsonb,
  vorige_hash text not null check (vorige_hash ~ '^[0-9a-f]{64}$'),
  hash text not null check (hash ~ '^[0-9a-f]{64}$'),
  unique (user_id, volgnr)
);
create index if not exists club_betalen_audit_onderwerp on public.club_betalen_audit (user_id, onderwerp_soort, onderwerp_id);
create index if not exists club_betalen_audit_op on public.club_betalen_audit (user_id, op);

-- ── Outbox ────────────────────────────────────────────────────────────────────
create table if not exists public.club_betalen_opdrachten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid references public.club_leden(id) on delete set null,
  soort text not null check (soort in (
    'incasso', 'terugbetaling', 'klant_aanmaken', 'klant_verwijderen', 'mandaat_loskoppelen',
    'checkout_sessie', 'betaling_annuleren'
  )),
  -- Vaste sleutel, ayg_<soort>_<id van de betaling of terugbetaling>: nooit twee keer afschrijven.
  idempotentie_sleutel text not null unique check (idempotentie_sleutel ~ '^ayg_[a-z_]{3,30}_[A-Za-z0-9-]{8,80}$'),
  status text not null default 'wacht' check (status in ('wacht', 'bezig', 'klaar', 'mislukt', 'vast', 'geannuleerd')),
  pogingen integer not null default 0 check (pogingen between 0 and 20),
  volgende_poging_op timestamptz not null default now(),
  bezig_sinds timestamptz,
  klaar_op timestamptz,
  laatste_fout text check (laatste_fout is null or char_length(laatste_fout) <= 300),
  factuur_id uuid references public.club_betalen_facturen(id) on delete set null,
  betaling_id uuid references public.club_betalen_betalingen(id) on delete set null,
  -- Ids en bedragen die de werker nodig heeft; geen namen of adressen.
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 10000),
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_betalen_opdrachten_werker on public.club_betalen_opdrachten (volgende_poging_op)
  where status in ('wacht', 'bezig');
create index if not exists club_betalen_opdrachten_user on public.club_betalen_opdrachten (user_id, status);
create index if not exists club_betalen_opdrachten_lid on public.club_betalen_opdrachten (lid_id, user_id) where lid_id is not null;
create index if not exists club_betalen_opdrachten_factuur on public.club_betalen_opdrachten (factuur_id) where factuur_id is not null;
create index if not exists club_betalen_opdrachten_betaling on public.club_betalen_opdrachten (betaling_id) where betaling_id is not null;

-- ── Afstemming en exports ─────────────────────────────────────────────────────
create table if not exists public.club_betalen_afstemming (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  soort text not null check (soort in ('stripe', 'intern', 'audit')),
  status text not null default 'lopend' check (status in ('lopend', 'schoon', 'afwijkend', 'fout')),
  periode_van date,
  periode_tot date,
  aantal_gecontroleerd integer not null default 0 check (aantal_gecontroleerd >= 0),
  -- Lijst van { soort, id, verwacht_cent, gevonden_cent }: alleen ids en bedragen.
  afwijkingen jsonb not null default '[]'::jsonb check (jsonb_typeof(afwijkingen) = 'array'),
  gestart_op timestamptz not null default now(),
  klaar_op timestamptz
);
create index if not exists club_betalen_afstemming_user on public.club_betalen_afstemming (user_id, gestart_op desc);

create table if not exists public.club_betalen_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  soort text not null check (soort in ('maand', 'boekhouding', 'facturen', 'afstemming')),
  periode_van date,
  periode_tot date,
  status text not null default 'gemaakt' check (status in ('gemaakt', 'mislukt')),
  bestand_pad text check (bestand_pad is null or char_length(bestand_pad) <= 300),
  bestand_hash text check (bestand_hash is null or bestand_hash ~ '^[0-9a-f]{64}$'),
  aantal_regels integer check (aantal_regels is null or aantal_regels >= 0),
  gemaakt_door text check (gemaakt_door is null or char_length(gemaakt_door) <= 80),
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_betalen_exports_user on public.club_betalen_exports (user_id, aangemaakt_op desc);

-- ── Inbox: Stripe-events uitbreiden ───────────────────────────────────────────
-- Bestaande events zijn al verwerkt (de oude code verwerkte ze meteen) en krijgen
-- status verwerkt. Alleen bij het toevoegen van de kolom, dus veilig opnieuw te draaien.
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'club_betalen_stripe_events' and column_name = 'status') then
    alter table public.club_betalen_stripe_events
      add column status text not null default 'ontvangen' check (status in ('ontvangen', 'bezig', 'verwerkt', 'afwijkend', 'fout', 'genegeerd'));
    update public.club_betalen_stripe_events set status = 'verwerkt';
  end if;
end $$;

alter table public.club_betalen_stripe_events
  add column if not exists pogingen integer not null default 0 check (pogingen between 0 and 50),
  add column if not exists laatste_fout text check (laatste_fout is null or char_length(laatste_fout) <= 300),
  add column if not exists verwerkt_op timestamptz,
  add column if not exists account text check (account is null or account ~ '^acct_[A-Za-z0-9]{6,250}$'),
  add column if not exists object_id text check (object_id is null or char_length(object_id) <= 255),
  -- De sportschool, zodra het account is opgezocht (bestaande events hebben dit niet).
  add column if not exists user_id uuid;

create index if not exists club_betalen_stripe_events_open on public.club_betalen_stripe_events (status, ontvangen_op)
  where status in ('ontvangen', 'bezig', 'fout');
create index if not exists club_betalen_stripe_events_object on public.club_betalen_stripe_events (account, object_id);
create index if not exists club_betalen_stripe_events_user on public.club_betalen_stripe_events (user_id) where user_id is not null;

-- ── Triggers ──────────────────────────────────────────────────────────────────
-- Kasboek: alleen toevoegen. Enige uitzondering: lid_id van een waarde naar null
-- (AVG), terwijl al het andere gelijk blijft.
create or replace function public.club_betalen_boekingen_bewaken()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and old.lid_id is not null and new.lid_id is null
     and (to_jsonb(new) - 'lid_id') = (to_jsonb(old) - 'lid_id') then
    return new;
  end if;
  raise exception 'het kasboek is alleen toevoegen (% geweigerd)', tg_op using errcode = 'AYG10';
end
$$;

drop trigger if exists club_betalen_boekingen_vast on public.club_betalen_boekingen;
create trigger club_betalen_boekingen_vast
  before update or delete on public.club_betalen_boekingen
  for each row execute function public.club_betalen_boekingen_bewaken();
drop trigger if exists club_betalen_boekingen_leeg on public.club_betalen_boekingen;
create trigger club_betalen_boekingen_leeg
  before truncate on public.club_betalen_boekingen
  for each statement execute function public.club_betalen_alleen_toevoegen();

-- Controlelog: helemaal alleen toevoegen.
drop trigger if exists club_betalen_audit_vast on public.club_betalen_audit;
create trigger club_betalen_audit_vast
  before update or delete on public.club_betalen_audit
  for each row execute function public.club_betalen_alleen_toevoegen();
drop trigger if exists club_betalen_audit_leeg on public.club_betalen_audit;
create trigger club_betalen_audit_leeg
  before truncate on public.club_betalen_audit
  for each statement execute function public.club_betalen_alleen_toevoegen();

-- Factuur: na definitief veranderen bedragen en bevroren gegevens nooit meer.
-- Mag wel: status, betaald_cent, betaald_op, mailadres, notitie, herinneringstap,
-- pdf (een keer), lid_id naar null, en de anonimisering na bewaren_tot (naam
-- 'Geanonimiseerd', adres leeg, anoniem_op gezet).
create or replace function public.club_betalen_factuur_bewaken()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_vrij text[] := array[
    'status', 'betaald_cent', 'betaald_op', 'klant_email', 'notitie', 'herinnering_stap', 'gewijzigd_op',
    'anoniem_op', 'pdf_hash', 'pdf_pad', 'lid_id', 'klant_naam', 'klant_adres'
  ];
begin
  if tg_op = 'DELETE' then
    if old.status <> 'concept' then
      raise exception 'een definitieve factuur kan niet worden verwijderd' using errcode = 'AYG11';
    end if;
    return old;
  end if;

  if old.status = 'concept' then
    if new.status <> 'concept' and (new.nummer is null or new.definitief_op is null) then
      raise exception 'definitief maken kan alleen via club_betalen_factuur_definitief' using errcode = 'AYG11';
    end if;
    return new;
  end if;

  if new.status = 'concept' then
    raise exception 'een definitieve factuur wordt nooit weer een concept' using errcode = 'AYG11';
  end if;
  if (to_jsonb(old) - v_vrij) is distinct from (to_jsonb(new) - v_vrij) then
    raise exception 'bedragen en gegevens van een definitieve factuur zijn vast (factuur %)', old.nummer using errcode = 'AYG11';
  end if;
  if new.lid_id is not null and new.lid_id is distinct from old.lid_id then
    raise exception 'een definitieve factuur kan niet naar een ander lid' using errcode = 'AYG11';
  end if;
  if (new.klant_naam is distinct from old.klant_naam or new.klant_adres is distinct from old.klant_adres)
     and not (new.anoniem_op is not null and old.anoniem_op is null and new.klant_naam = 'Geanonimiseerd' and new.klant_adres is null) then
    raise exception 'klantgegevens op een definitieve factuur veranderen alleen via anonimiseren' using errcode = 'AYG11';
  end if;
  if old.pdf_hash is not null and new.pdf_hash is distinct from old.pdf_hash then
    raise exception 'de pdf-hash van een definitieve factuur is vast' using errcode = 'AYG11';
  end if;
  if old.pdf_pad is not null and new.pdf_pad is not null and new.pdf_pad is distinct from old.pdf_pad then
    raise exception 'het pdf-pad van een definitieve factuur is vast' using errcode = 'AYG11';
  end if;
  return new;
end
$$;

drop trigger if exists club_betalen_factuur_vast on public.club_betalen_facturen;
create trigger club_betalen_factuur_vast
  before update or delete on public.club_betalen_facturen
  for each row execute function public.club_betalen_factuur_bewaken();

-- Factuurregels: alleen wijzigen zolang de factuur een concept is.
create or replace function public.club_betalen_factuurregel_bewaken()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  if tg_op in ('INSERT', 'UPDATE') then
    -- for share: wacht op een factuur die net definitief wordt gemaakt.
    select f.status into v_status from public.club_betalen_facturen f where f.id = new.factuur_id for share;
    if found and v_status <> 'concept' then
      raise exception 'regels van een definitieve factuur zijn vast' using errcode = 'AYG11';
    end if;
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    select f.status into v_status from public.club_betalen_facturen f where f.id = old.factuur_id for share;
    -- Niet gevonden = de factuur (een concept) wordt zelf verwijderd: toegestaan.
    if found and v_status <> 'concept' then
      raise exception 'regels van een definitieve factuur zijn vast' using errcode = 'AYG11';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

drop trigger if exists club_betalen_factuurregel_vast on public.club_betalen_factuurregels;
create trigger club_betalen_factuurregel_vast
  before insert or update or delete on public.club_betalen_factuurregels
  for each row execute function public.club_betalen_factuurregel_bewaken();

-- Terugbetalingen: de som van lopende en geslaagde terugbetalingen is nooit meer dan
-- betaald. Het betalingsrij-slot zorgt dat twee gelijktijdige verzoeken op elkaar wachten.
create or replace function public.club_betalen_terugbetaling_bewaken()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_betaling public.club_betalen_betalingen%rowtype;
  v_som bigint;
begin
  select * into v_betaling from public.club_betalen_betalingen b where b.id = new.betaling_id for update;
  if not found then
    raise exception 'betaling niet gevonden' using errcode = 'P0002';
  end if;
  if v_betaling.user_id <> new.user_id or v_betaling.factuur_id <> new.factuur_id then
    raise exception 'terugbetaling hoort niet bij deze betaling' using errcode = 'AYG12';
  end if;
  if tg_op = 'INSERT' and v_betaling.status <> 'geslaagd' then
    raise exception 'alleen een geslaagde betaling kan worden terugbetaald' using errcode = 'AYG12';
  end if;
  if new.status in ('aangevraagd', 'in_behandeling', 'geslaagd') then
    select coalesce(sum(t.bedrag_cent), 0) into v_som
      from public.club_betalen_terugbetalingen t
     where t.betaling_id = new.betaling_id and t.id <> new.id
       and t.status in ('aangevraagd', 'in_behandeling', 'geslaagd');
    if v_som + new.bedrag_cent > v_betaling.bedrag_cent then
      raise exception 'terugbetalingen zijn meer dan betaald (% van %)', v_som + new.bedrag_cent, v_betaling.bedrag_cent using errcode = 'AYG12';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists club_betalen_terugbetaling_som on public.club_betalen_terugbetalingen;
create trigger club_betalen_terugbetaling_som
  before insert or update of bedrag_cent, status, betaling_id on public.club_betalen_terugbetalingen
  for each row execute function public.club_betalen_terugbetaling_bewaken();

-- ── Functie: een regel in de hashketen ────────────────────────────────────────
-- Per sportschool een eigen keten. Een slot per sportschool maakt de volgnummers
-- doorlopend. hash = sha256 van alle velden plus de vorige hash.
create or replace function public.club_betalen_audit_schrijf(
  p_user uuid, p_rol text, p_ref text, p_actie text, p_soort text, p_id uuid,
  p_oud jsonb default null, p_nieuw jsonb default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_volgnr bigint;
  v_vorige text;
  v_op timestamptz := clock_timestamp();
  v_hash text;
  v_ref text := left(p_ref, 80);
begin
  perform pg_advisory_xact_lock(hashtextextended('club_betalen_audit:' || p_user::text, 0));
  select a.volgnr, a.hash into v_volgnr, v_vorige
    from public.club_betalen_audit a where a.user_id = p_user order by a.volgnr desc limit 1;
  if not found then
    v_volgnr := 0;
    v_vorige := repeat('0', 64);
  end if;
  v_volgnr := v_volgnr + 1;
  v_hash := encode(sha256(convert_to(concat_ws('|',
    v_volgnr::text,
    to_char(v_op at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
    p_rol, coalesce(v_ref, ''), p_actie, coalesce(p_soort, ''), coalesce(p_id::text, ''),
    coalesce(p_oud::text, ''), coalesce(p_nieuw::text, ''), v_vorige
  ), 'UTF8')), 'hex');
  insert into public.club_betalen_audit
    (user_id, volgnr, op, actor_rol, actor_ref, actie, onderwerp_soort, onderwerp_id, oud, nieuw, vorige_hash, hash)
  values
    (p_user, v_volgnr, v_op, p_rol, v_ref, p_actie, p_soort, p_id, p_oud, p_nieuw, v_vorige, v_hash);
  return v_volgnr;
end
$$;

-- Controleert de keten van een sportschool: het eerste foute volgnummer, of null als alles klopt.
create or replace function public.club_betalen_audit_controleer(p_user uuid)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_verwacht bigint := 1;
  v_vorige text := repeat('0', 64);
  v_hash text;
begin
  for r in select * from public.club_betalen_audit a where a.user_id = p_user order by a.volgnr loop
    if r.volgnr <> v_verwacht or r.vorige_hash <> v_vorige then
      return r.volgnr;
    end if;
    v_hash := encode(sha256(convert_to(concat_ws('|',
      r.volgnr::text,
      to_char(r.op at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
      r.actor_rol, coalesce(r.actor_ref, ''), r.actie, coalesce(r.onderwerp_soort, ''), coalesce(r.onderwerp_id::text, ''),
      coalesce(r.oud::text, ''), coalesce(r.nieuw::text, ''), r.vorige_hash
    ), 'UTF8')), 'hex');
    if v_hash <> r.hash then
      return r.volgnr;
    end if;
    v_vorige := r.hash;
    v_verwacht := v_verwacht + 1;
  end loop;
  return null;
end
$$;

-- ── Functie: een regel in het kasboek ─────────────────────────────────────────
-- true = nieuw toegevoegd; false = bestond al met hetzelfde bedrag (herhalen is onschadelijk).
-- Een bestaande boeking met een ander bedrag of een andere factuur is een fout (AYG13).
create or replace function public.club_betalen_boek(
  p_user uuid, p_soort text, p_bedrag_cent integer, p_oorzaak text,
  p_factuur uuid default null, p_betaling uuid default null, p_lid uuid default null,
  p_boekdatum date default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
  v_bestaand public.club_betalen_boekingen%rowtype;
begin
  insert into public.club_betalen_boekingen (user_id, lid_id, factuur_id, betaling_id, soort, bedrag_cent, oorzaak, boekdatum)
  values (p_user, p_lid, p_factuur, p_betaling, p_soort, p_bedrag_cent, p_oorzaak,
          coalesce(p_boekdatum, (now() at time zone 'Europe/Amsterdam')::date))
  on conflict (user_id, soort, oorzaak) do nothing;
  get diagnostics n = row_count;
  if n = 1 then
    return true;
  end if;
  select * into v_bestaand from public.club_betalen_boekingen b
   where b.user_id = p_user and b.soort = p_soort and b.oorzaak = p_oorzaak;
  if v_bestaand.bedrag_cent <> p_bedrag_cent or v_bestaand.factuur_id is distinct from p_factuur then
    raise exception 'boeking % bestaat al met een ander bedrag of een andere factuur', p_oorzaak using errcode = 'AYG13';
  end if;
  return false;
end
$$;

-- ── Functie: een factuur definitief maken ─────────────────────────────────────
-- Geeft het factuurnummer. Een factuur die al definitief is geeft zijn bestaande
-- nummer terug (herhalen is onschadelijk). Het nummer komt uit de teller van de
-- sportschool met een rijslot: geen gaten (een mislukte transactie rolt de teller
-- terug) en geen dubbele nummers. Zonder volledige verkopergegevens (naam, KvK,
-- btw-nummer, adres) is er geen definitieve factuur.
create or replace function public.club_betalen_factuur_definitief(
  p_user uuid, p_factuur uuid, p_uitgegeven date default null, p_betaaltermijn_dagen integer default 14,
  p_rol text default 'systeem', p_ref text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  f public.club_betalen_facturen%rowtype;
  v_orig public.club_betalen_facturen%rowtype;
  v_reeks public.club_betalen_factuurreeksen%rowtype;
  v_soort text;
  v_jaar integer;
  v_nr integer;
  v_nummer text;
  v_uitgegeven date;
  v_regels integer;
  v_som_excl bigint;
  v_som_btw bigint;
  v_gecrediteerd bigint;
begin
  if p_betaaltermijn_dagen is null or p_betaaltermijn_dagen < 0 or p_betaaltermijn_dagen > 90 then
    raise exception 'ongeldige betaaltermijn' using errcode = 'AYG05';
  end if;
  select * into f from public.club_betalen_facturen x where x.id = p_factuur and x.user_id = p_user for update;
  if not found then
    raise exception 'factuur niet gevonden' using errcode = 'P0002';
  end if;
  if f.status <> 'concept' then
    return f.nummer;
  end if;

  if coalesce(f.verkoper ->> 'naam', '') = '' or coalesce(f.verkoper ->> 'kvk', '') = ''
     or coalesce(f.verkoper ->> 'btw_nummer', '') = '' or coalesce(f.verkoper ->> 'adres', '') = '' then
    raise exception 'verkopergegevens onvolledig: naam, KvK, btw-nummer en adres zijn verplicht' using errcode = 'AYG04';
  end if;

  select count(*), coalesce(sum(r.bedrag_excl_cent), 0), coalesce(sum(r.btw_cent), 0)
    into v_regels, v_som_excl, v_som_btw
    from public.club_betalen_factuurregels r where r.factuur_id = f.id and r.user_id = p_user;
  if v_regels = 0 then
    raise exception 'een factuur zonder regels kan niet definitief' using errcode = 'AYG05';
  end if;
  if v_som_excl <> f.subtotaal_excl_cent or v_som_btw <> f.btw_cent then
    raise exception 'de regels (% excl, % btw) kloppen niet met de totalen van de factuur', v_som_excl, v_som_btw using errcode = 'AYG05';
  end if;

  if f.soort = 'creditnota' then
    select * into v_orig from public.club_betalen_facturen o where o.id = f.creditnota_van and o.user_id = p_user for update;
    if not found or v_orig.status = 'concept' then
      raise exception 'een creditnota hoort bij een definitieve factuur' using errcode = 'AYG06';
    end if;
    select coalesce(sum(c.totaal_cent), 0) into v_gecrediteerd
      from public.club_betalen_facturen c
     where c.user_id = p_user and c.creditnota_van = f.creditnota_van and c.soort = 'creditnota' and c.status <> 'concept';
    if v_gecrediteerd + f.totaal_cent > v_orig.totaal_cent then
      raise exception 'creditnota is groter dan het gefactureerde bedrag' using errcode = 'AYG06';
    end if;
  end if;

  v_soort := case when f.soort = 'creditnota' then 'creditnota' else 'factuur' end;
  v_uitgegeven := coalesce(p_uitgegeven, f.uitgegeven_op, (now() at time zone 'Europe/Amsterdam')::date);
  v_jaar := extract(year from v_uitgegeven)::integer;

  -- De teller: eerst zorgen dat de rij bestaat, dan met een slot ophogen.
  insert into public.club_betalen_factuurreeksen (user_id, soort, jaar, prefix)
  values (p_user, v_soort, v_jaar, case when v_soort = 'creditnota' then 'CN' else 'F' end)
  on conflict (user_id, soort, jaar) do nothing;
  select * into v_reeks from public.club_betalen_factuurreeksen s
   where s.user_id = p_user and s.soort = v_soort and s.jaar = v_jaar for update;
  v_nr := v_reeks.laatste_nummer + 1;
  update public.club_betalen_factuurreeksen set laatste_nummer = v_nr where id = v_reeks.id;
  v_nummer := v_reeks.prefix || v_jaar::text || '-' || case when v_nr < 100000 then lpad(v_nr::text, 5, '0') else v_nr::text end;

  update public.club_betalen_facturen
     set nummer = v_nummer,
         reeks_id = v_reeks.id,
         status = 'definitief',
         uitgegeven_op = v_uitgegeven,
         vervaldatum = case when v_soort = 'creditnota' then null else v_uitgegeven + p_betaaltermijn_dagen end,
         definitief_op = now(),
         -- 7 jaar na het einde van het jaar van uitgifte.
         bewaren_tot = make_date(v_jaar + 8, 1, 1) - 1,
         gewijzigd_op = now()
   where id = f.id;

  -- Kasboek: een factuur telt +, een creditnota - (op de oorspronkelijke factuur).
  if f.totaal_cent > 0 then
    if v_soort = 'creditnota' then
      perform public.club_betalen_boek(p_user, 'creditnota', -f.totaal_cent, 'creditnota:' || f.id::text, f.creditnota_van, null, f.lid_id, v_uitgegeven);
    else
      perform public.club_betalen_boek(p_user, 'factuur', f.totaal_cent, 'factuur:' || f.id::text, f.id, null, f.lid_id, v_uitgegeven);
    end if;
  end if;

  if v_soort = 'creditnota' and v_gecrediteerd + f.totaal_cent = v_orig.totaal_cent then
    update public.club_betalen_facturen set status = 'gecrediteerd', gewijzigd_op = now() where id = v_orig.id;
  end if;

  perform public.club_betalen_audit_schrijf(
    p_user, p_rol, p_ref, 'factuur_definitief', 'factuur', f.id, null,
    jsonb_build_object('nummer', v_nummer, 'totaal_cent', f.totaal_cent, 'soort', f.soort)
  );
  return v_nummer;
end
$$;

-- ── Functie: de toestand van een betaling, alleen vooruit ─────────────────────
-- klaar > aangeboden > in_behandeling > geslaagd | mislukt | geannuleerd,
-- geslaagd > gestorneerd > storno_teruggedraaid. Vooruit overslaan mag (events komen
-- in willekeurige volgorde). Uitkomst:
--   'ok'         overgang toegepast (met kasboek, factuur en audit in dezelfde transactie)
--   'genegeerd'  dezelfde of een oudere toestand: niets doen
--   'afwijkend'  onmogelijke overgang (bijvoorbeeld mislukt na geslaagd) of ander
--                payment intent: niets doen, melden
--   'onbekend'   betaling bestaat niet voor deze sportschool
create or replace function public.club_betalen_betaling_overgang(
  p_user uuid, p_betaling uuid, p_naar text,
  p_intent text default null, p_charge text default null,
  p_fout_code text default null, p_fout_categorie text default null, p_fout_bericht text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  b public.club_betalen_betalingen%rowtype;
  f public.club_betalen_facturen%rowtype;
  v_rang_nu integer;
  v_rang_naar integer;
  v_ok boolean;
  v_nieuw_betaald integer;
begin
  if p_naar not in ('klaar', 'aangeboden', 'in_behandeling', 'geslaagd', 'mislukt', 'geannuleerd', 'gestorneerd', 'storno_teruggedraaid') then
    raise exception 'onbekende toestand %', p_naar using errcode = 'AYG03';
  end if;
  select * into b from public.club_betalen_betalingen x where x.id = p_betaling and x.user_id = p_user for update;
  if not found then
    return 'onbekend';
  end if;
  if b.status = p_naar then
    return 'genegeerd';
  end if;
  if p_intent is not null and b.stripe_payment_intent is not null and b.stripe_payment_intent <> p_intent then
    return 'afwijkend';
  end if;

  v_ok := case b.status
    when 'klaar' then p_naar in ('aangeboden', 'in_behandeling', 'geslaagd', 'mislukt', 'geannuleerd')
    when 'aangeboden' then p_naar in ('in_behandeling', 'geslaagd', 'mislukt', 'geannuleerd')
    when 'in_behandeling' then p_naar in ('geslaagd', 'mislukt', 'geannuleerd')
    when 'geslaagd' then p_naar = 'gestorneerd'
    when 'gestorneerd' then p_naar = 'storno_teruggedraaid'
    else false
  end;
  if not v_ok then
    v_rang_nu := case b.status when 'klaar' then 1 when 'aangeboden' then 2 when 'in_behandeling' then 3
                   when 'geslaagd' then 4 when 'mislukt' then 4 when 'geannuleerd' then 4
                   when 'gestorneerd' then 5 else 6 end;
    v_rang_naar := case p_naar when 'klaar' then 1 when 'aangeboden' then 2 when 'in_behandeling' then 3
                     when 'geslaagd' then 4 when 'mislukt' then 4 when 'geannuleerd' then 4
                     when 'gestorneerd' then 5 else 6 end;
    if v_rang_naar < v_rang_nu then
      return 'genegeerd';
    end if;
    return 'afwijkend';
  end if;

  update public.club_betalen_betalingen
     set status = p_naar,
         stripe_payment_intent = coalesce(stripe_payment_intent, p_intent),
         stripe_charge_id = coalesce(p_charge, stripe_charge_id),
         aangeboden_op = case when p_naar = 'aangeboden' then coalesce(aangeboden_op, now()) else aangeboden_op end,
         verwerkt_op = case when p_naar = 'geslaagd' then now() else verwerkt_op end,
         mislukt_op = case when p_naar = 'mislukt' then now() else mislukt_op end,
         gestorneerd_op = case when p_naar = 'gestorneerd' then now() else gestorneerd_op end,
         fout_code = case when p_naar in ('mislukt', 'gestorneerd') then left(p_fout_code, 80) else fout_code end,
         fout_categorie = case when p_naar in ('mislukt', 'gestorneerd') then p_fout_categorie else fout_categorie end,
         fout_bericht = case when p_naar in ('mislukt', 'gestorneerd') then left(p_fout_bericht, 300) else fout_bericht end,
         gewijzigd_op = now()
   where id = b.id;

  -- Geldgevolgen in dezelfde transactie: kasboek en factuur.
  if p_naar in ('geslaagd', 'gestorneerd', 'storno_teruggedraaid') then
    select * into f from public.club_betalen_facturen x where x.id = b.factuur_id and x.user_id = p_user for update;
    if p_naar = 'geslaagd' then
      perform public.club_betalen_boek(p_user, 'betaling', -b.bedrag_cent, 'betaling:' || b.id::text, b.factuur_id, b.id, b.lid_id);
      v_nieuw_betaald := least(f.totaal_cent, f.betaald_cent + b.bedrag_cent);
    elsif p_naar = 'gestorneerd' then
      perform public.club_betalen_boek(p_user, 'storno', b.bedrag_cent, 'storno:' || b.id::text, b.factuur_id, b.id, b.lid_id);
      v_nieuw_betaald := greatest(0, f.betaald_cent - b.bedrag_cent);
    else
      perform public.club_betalen_boek(p_user, 'storno_terug', -b.bedrag_cent, 'storno_terug:' || b.id::text, b.factuur_id, b.id, b.lid_id);
      v_nieuw_betaald := least(f.totaal_cent, f.betaald_cent + b.bedrag_cent);
    end if;
    update public.club_betalen_facturen
       set betaald_cent = v_nieuw_betaald,
           status = case
             when status in ('definitief', 'open', 'deels_betaald', 'oninbaar', 'betaald') then
               case when v_nieuw_betaald >= totaal_cent then 'betaald'
                    when v_nieuw_betaald > 0 then 'deels_betaald'
                    else 'open' end
             else status end,
           betaald_op = case when v_nieuw_betaald >= totaal_cent then (now() at time zone 'Europe/Amsterdam')::date else null end,
           gewijzigd_op = now()
     where id = f.id;
  end if;

  perform public.club_betalen_audit_schrijf(
    p_user, case when p_naar in ('klaar', 'aangeboden') then 'systeem' else 'stripe' end, null,
    'betaling_' || p_naar, 'betaling', b.id,
    jsonb_build_object('status', b.status),
    jsonb_build_object('status', p_naar, 'bedrag_cent', b.bedrag_cent, 'factuur_id', b.factuur_id)
  );
  return 'ok';
end
$$;

-- ── Functie: de toestand van een contract ─────────────────────────────────────
-- Plan 1.5: concept > wacht_op_machtiging > proef > actief, actief <> gepauzeerd,
-- actief > opgezegd > beeindigd, actief > gestopt_wegens_achterstand.
-- Praktische aanvullingen (in de code van de aanroeper getest): een concept of nog niet
-- getekend contract kan vervallen (beeindigd), proef en gepauzeerd kunnen opzeggen,
-- opzeggen kan worden ingetrokken (opgezegd > actief), en een contract dat wegens
-- achterstand stopte kan weer actief worden. Uitkomst 'ok', 'genegeerd' (al in die
-- toestand) of 'onbekend'; een niet toegestane overgang geeft de fout AYG03.
create or replace function public.club_betalen_contract_overgang(
  p_user uuid, p_contract uuid, p_naar text,
  p_rol text default 'systeem', p_ref text default null, p_reden_code text default null,
  p_einddatum date default null, p_opzeg_einddatum date default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c public.club_betalen_contracten%rowtype;
  v_ok boolean;
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  v_soort text;
begin
  select * into c from public.club_betalen_contracten x where x.id = p_contract and x.user_id = p_user for update;
  if not found then
    return 'onbekend';
  end if;
  if c.status = p_naar then
    return 'genegeerd';
  end if;
  v_ok := case c.status
    when 'concept' then p_naar in ('wacht_op_machtiging', 'proef', 'actief', 'beeindigd')
    when 'wacht_op_machtiging' then p_naar in ('proef', 'actief', 'beeindigd')
    when 'proef' then p_naar in ('actief', 'opgezegd', 'beeindigd')
    when 'actief' then p_naar in ('gepauzeerd', 'opgezegd', 'gestopt_wegens_achterstand')
    when 'gepauzeerd' then p_naar in ('actief', 'opgezegd')
    when 'opgezegd' then p_naar in ('actief', 'beeindigd')
    when 'gestopt_wegens_achterstand' then p_naar in ('actief', 'beeindigd')
    else false
  end;
  if not v_ok then
    raise exception 'overgang van % naar % is niet toegestaan', c.status, p_naar using errcode = 'AYG03';
  end if;

  v_soort := case
    when p_naar = 'opgezegd' then 'opzegging'
    when c.status = 'opgezegd' and p_naar = 'actief' then 'opzegging_ingetrokken'
    when p_naar = 'gepauzeerd' or c.status = 'gepauzeerd' then 'pauze'
    else 'status' end;

  update public.club_betalen_contracten
     set status = p_naar,
         einddatum = coalesce(p_einddatum, einddatum),
         opgezegd_op = case when p_naar = 'opgezegd' then v_vandaag
                            when c.status = 'opgezegd' and p_naar = 'actief' then null
                            else opgezegd_op end,
         opzeg_einddatum = case when p_naar = 'opgezegd' then coalesce(p_opzeg_einddatum, opzeg_einddatum)
                                when c.status = 'opgezegd' and p_naar = 'actief' then null
                                else opzeg_einddatum end,
         gewijzigd_op = now()
   where id = c.id;

  insert into public.club_betalen_contract_wijzigingen
    (user_id, contract_id, soort, van_status, naar_status, oud, nieuw, reden_code, door_rol, door_ref)
  values
    (p_user, c.id, v_soort, c.status, p_naar,
     jsonb_build_object('status', c.status, 'einddatum', c.einddatum),
     jsonb_build_object('status', p_naar, 'einddatum', coalesce(p_einddatum, c.einddatum), 'opzeg_einddatum', p_opzeg_einddatum),
     left(p_reden_code, 40), p_rol, left(p_ref, 80));

  perform public.club_betalen_audit_schrijf(
    p_user, p_rol, p_ref, 'contract_' || p_naar, 'contract', c.id,
    jsonb_build_object('status', c.status), jsonb_build_object('status', p_naar)
  );
  return 'ok';
end
$$;

-- ── Alleen de server ──────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'club_betalen_factuurreeksen', 'club_betalen_facturen', 'club_betalen_factuurregels',
    'club_betalen_betalingen', 'club_betalen_terugbetalingen', 'club_betalen_geschillen',
    'club_betalen_herinneringen', 'club_betalen_boekingen', 'club_betalen_audit',
    'club_betalen_opdrachten', 'club_betalen_afstemming', 'club_betalen_exports'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon, authenticated, public', t);
  end loop;
end $$;

revoke all on function public.club_betalen_boekingen_bewaken() from public, anon, authenticated;
revoke all on function public.club_betalen_factuur_bewaken() from public, anon, authenticated;
revoke all on function public.club_betalen_factuurregel_bewaken() from public, anon, authenticated;
revoke all on function public.club_betalen_terugbetaling_bewaken() from public, anon, authenticated;
revoke all on function public.club_betalen_audit_schrijf(uuid, text, text, text, text, uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.club_betalen_audit_controleer(uuid) from public, anon, authenticated;
revoke all on function public.club_betalen_boek(uuid, text, integer, text, uuid, uuid, uuid, date) from public, anon, authenticated;
revoke all on function public.club_betalen_factuur_definitief(uuid, uuid, date, integer, text, text) from public, anon, authenticated;
revoke all on function public.club_betalen_betaling_overgang(uuid, uuid, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.club_betalen_contract_overgang(uuid, uuid, text, text, text, text, date, date) from public, anon, authenticated;
grant execute on function public.club_betalen_audit_schrijf(uuid, text, text, text, text, uuid, jsonb, jsonb) to service_role;
grant execute on function public.club_betalen_audit_controleer(uuid) to service_role;
grant execute on function public.club_betalen_boek(uuid, text, integer, text, uuid, uuid, uuid, date) to service_role;
grant execute on function public.club_betalen_factuur_definitief(uuid, uuid, date, integer, text, text) to service_role;
grant execute on function public.club_betalen_betaling_overgang(uuid, uuid, text, text, text, text, text, text) to service_role;
grant execute on function public.club_betalen_contract_overgang(uuid, uuid, text, text, text, text, date, date) to service_role;
