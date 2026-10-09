-- ─── MentaForce /1 — de Vandaag-kaart ──────────────────────────────────────
-- Twee kleine tabellen voor het nieuwe product (/1). Beide strikt per gebruiker
-- met RLS: de /1-API leest en schrijft met de sessie van de gebruiker zelf,
-- niet met de service-role (zie strategisch advies §15).
--
-- vandaag_plan     je weekplan: op welke dag train je, wat, hoe zwaar, hoe laat.
--                  Eén rij per weekdag; geen rij = rustdag.
-- vandaag_acties   wat je met een actie op de kaart deed (oké / later / nee).
--                  Dit meet de kernvraag van de pilot: veranderde de kaart echt
--                  een beslissing? Eén keuze per actie per dag.

create table if not exists public.vandaag_plan (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- 0 = zondag … 6 = zaterdag (zoals Date.getDay()).
  weekdag smallint not null check (weekdag between 0 and 6),
  soort text not null check (char_length(soort) between 1 and 40),
  intensiteit text not null check (intensiteit in ('zwaar', 'licht')),
  tijd time,
  bijgewerkt_op timestamptz not null default now(),
  primary key (user_id, weekdag)
);

alter table public.vandaag_plan enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'vandaag_plan' and policyname = 'vandaag_plan: eigen') then
    create policy "vandaag_plan: eigen" on public.vandaag_plan
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.vandaag_acties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  datum date not null,
  actie text not null check (actie in ('training', 'rust', 'bewegen', 'ademhaling', 'bedtijd', 'pauze', 'minder', 'checkin', 'plan')),
  keuze text not null check (keuze in ('oke', 'later', 'nee')),
  -- De grondtoon van de kaart op het moment van kiezen (voor de pilotmeting).
  toon text check (toon in ('normaal', 'aanpassen', 'rustig', 'onbekend')),
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, datum, actie)
);

create index if not exists vandaag_acties_user_datum on public.vandaag_acties (user_id, datum desc);

alter table public.vandaag_acties enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'vandaag_acties' and policyname = 'vandaag_acties: eigen') then
    create policy "vandaag_acties: eigen" on public.vandaag_acties
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
