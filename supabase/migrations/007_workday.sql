-- ============================================================
-- MentaForce — Workday features migratie
-- Uitvoeren in: Supabase → SQL Editor
-- ============================================================

-- ── 1. Verlof aanvragen ─────────────────────────────────────
create table if not exists public.verlof_aanvragen (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  bedrijf_id       uuid references public.profiles(id),  -- company ref
  type             text not null check (type in ('vakantie','ziekte','bijzonder','onbetaald','overig')),
  datum_van        date not null,
  datum_tot        date not null,
  reden            text,
  status           text not null default 'aangevraagd' check (status in ('aangevraagd','goedgekeurd','afgewezen')),
  reviewer_notitie text,
  created_at       timestamptz not null default now()
);

alter table public.verlof_aanvragen enable row level security;

create policy "Medewerker ziet eigen verlof" on public.verlof_aanvragen
  for select using (auth.uid() = user_id);

create policy "Medewerker maakt eigen verlof" on public.verlof_aanvragen
  for insert with check (auth.uid() = user_id);

create policy "HR ziet alle verlof van bedrijf" on public.verlof_aanvragen
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.rol in ('hr','admin')
        and p.bedrijf_id = verlof_aanvragen.bedrijf_id
    )
  );

create policy "HR bewerkt verlof van bedrijf" on public.verlof_aanvragen
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.rol in ('hr','admin')
        and p.bedrijf_id = verlof_aanvragen.bedrijf_id
    )
  );

-- ── 2. Tijdregistraties ─────────────────────────────────────
create table if not exists public.tijdregistraties (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  bedrijf_id   uuid,
  datum        date not null,
  uren         numeric(4,1) not null check (uren > 0 and uren <= 24),
  project      text not null default 'Overig',
  beschrijving text,
  goedgekeurd  boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.tijdregistraties enable row level security;

create policy "Medewerker ziet eigen uren" on public.tijdregistraties
  for select using (auth.uid() = user_id);

create policy "Medewerker maakt eigen uren" on public.tijdregistraties
  for insert with check (auth.uid() = user_id);

create policy "Medewerker verwijdert eigen uren" on public.tijdregistraties
  for delete using (auth.uid() = user_id);

create policy "HR ziet uren van bedrijf" on public.tijdregistraties
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.rol in ('hr','admin')
        and p.bedrijf_id = tijdregistraties.bedrijf_id
    )
  );

create policy "HR keurt uren goed" on public.tijdregistraties
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.rol in ('hr','admin')
        and p.bedrijf_id = tijdregistraties.bedrijf_id
    )
  );

-- ── 3. Declaraties ─────────────────────────────────────────
create table if not exists public.declaraties (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  bedrijf_id       uuid,
  datum            date not null,
  bedrag           numeric(10,2) not null check (bedrag > 0),
  categorie        text not null check (categorie in ('reiskosten','maaltijd','materiaal','training','representatie','overig')),
  beschrijving     text not null,
  status           text not null default 'ingediend' check (status in ('ingediend','goedgekeurd','afgewezen')),
  reviewer_notitie text,
  created_at       timestamptz not null default now()
);

alter table public.declaraties enable row level security;

create policy "Medewerker ziet eigen declaraties" on public.declaraties
  for select using (auth.uid() = user_id);

create policy "Medewerker maakt eigen declaratie" on public.declaraties
  for insert with check (auth.uid() = user_id);

create policy "HR ziet declaraties van bedrijf" on public.declaraties
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.rol in ('hr','admin')
        and p.bedrijf_id = declaraties.bedrijf_id
    )
  );

create policy "HR bewerkt declaraties van bedrijf" on public.declaraties
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.rol in ('hr','admin')
        and p.bedrijf_id = declaraties.bedrijf_id
    )
  );

-- ── 4. Bedrijfsnieuws ──────────────────────────────────────
create table if not exists public.bedrijf_nieuws (
  id              uuid primary key default gen_random_uuid(),
  bedrijf_id      uuid not null,
  auteur_id       uuid not null references public.profiles(id) on delete cascade,
  titel           text not null,
  inhoud          text not null,
  type            text not null default 'aankondiging' check (type in ('aankondiging','beleid','evenement','resultaten','overig')),
  belangrijk      boolean not null default false,
  gepubliceerd_op timestamptz not null default now()
);

alter table public.bedrijf_nieuws enable row level security;

create policy "Iedereen van bedrijf leest nieuws" on public.bedrijf_nieuws
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.bedrijf_id = bedrijf_nieuws.bedrijf_id
    )
  );

create policy "HR plaatst nieuws" on public.bedrijf_nieuws
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.rol in ('hr','admin')
        and p.bedrijf_id = bedrijf_nieuws.bedrijf_id
    )
  );

create policy "HR verwijdert nieuws" on public.bedrijf_nieuws
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.rol in ('hr','admin')
        and p.bedrijf_id = bedrijf_nieuws.bedrijf_id
    )
  );

-- ── 5. Optionele profielkolommen (voeg toe als ze nog niet bestaan) ──
alter table public.profiles add column if not exists afdeling  text;
alter table public.profiles add column if not exists functie   text;
alter table public.profiles add column if not exists telefoon  text;
alter table public.profiles add column if not exists locatie   text;

-- ── Klaar ──────────────────────────────────────────────────
-- Run deze SQL in: Supabase Dashboard > SQL Editor > New query
