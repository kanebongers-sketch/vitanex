-- ============================================================
-- Vitanex – Uitgebreid check-in systeem
-- Voer dit uit in Supabase → SQL Editor
-- ============================================================

-- 1. Sessie-tabel: één per gebruiker per week (maandag)
create table if not exists checkin_sessies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  bedrijf_id  uuid,
  week_start  date not null,
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, week_start)
);

-- 2. Antwoorden-tabel: flexibel per vraagcode
create table if not exists checkin_antwoorden (
  id           uuid primary key default gen_random_uuid(),
  sessie_id    uuid not null references checkin_sessies(id) on delete cascade,
  vraag_code   text not null,
  categorie    text,
  waarde_schaal numeric(3,1) check (waarde_schaal between 1 and 5),
  waarde_tekst  text,
  aangemaakt_op timestamptz not null default now()
);

-- 3. RLS inschakelen
alter table checkin_sessies   enable row level security;
alter table checkin_antwoorden enable row level security;

-- ── Sessie policies ──────────────────────────────────────────

-- Gebruiker leest eigen sessies
create policy "sessies: eigen lezen"
  on checkin_sessies for select
  using (auth.uid() = user_id);

-- Gebruiker maakt eigen sessie aan
create policy "sessies: eigen aanmaken"
  on checkin_sessies for insert
  with check (auth.uid() = user_id);

-- HR leest sessies van eigen bedrijf
create policy "sessies: hr leest bedrijfssessies"
  on checkin_sessies for select
  using (
    exists (
      select 1
      from   profiles hr
      join   profiles mwd on mwd.id = checkin_sessies.user_id
      where  hr.id = auth.uid()
        and  hr.rol in ('hr', 'admin')
        and  hr.bedrijf_id = mwd.bedrijf_id
        and  hr.bedrijf_id is not null
    )
  );

-- Admin leest alles
create policy "sessies: admin leest alles"
  on checkin_sessies for select
  using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
  );

-- ── Antwoord policies ─────────────────────────────────────────

-- Gebruiker leest eigen antwoorden
create policy "antwoorden: eigen lezen"
  on checkin_antwoorden for select
  using (
    exists (
      select 1 from checkin_sessies
      where  id = sessie_id and user_id = auth.uid()
    )
  );

-- Gebruiker voegt eigen antwoorden toe
create policy "antwoorden: eigen aanmaken"
  on checkin_antwoorden for insert
  with check (
    exists (
      select 1 from checkin_sessies
      where  id = sessie_id and user_id = auth.uid()
    )
  );

-- HR leest antwoorden van eigen bedrijf (anoniem – enkel via sessie_id, geen naam)
create policy "antwoorden: hr leest bedrijfsantwoorden"
  on checkin_antwoorden for select
  using (
    exists (
      select 1
      from   checkin_sessies cs
      join   profiles mwd on mwd.id = cs.user_id
      join   profiles hr  on hr.bedrijf_id = mwd.bedrijf_id
      where  cs.id = sessie_id
        and  hr.id = auth.uid()
        and  hr.rol in ('hr', 'admin')
        and  hr.bedrijf_id is not null
    )
  );

-- Admin leest alles
create policy "antwoorden: admin leest alles"
  on checkin_antwoorden for select
  using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
  );

-- 4. Indexen voor performantie
create index if not exists idx_sessies_user_week
  on checkin_sessies (user_id, week_start);

create index if not exists idx_sessies_bedrijf
  on checkin_sessies (bedrijf_id);

create index if not exists idx_antwoorden_sessie
  on checkin_antwoorden (sessie_id);

create index if not exists idx_antwoorden_vraag_code
  on checkin_antwoorden (vraag_code);

create index if not exists idx_antwoorden_categorie
  on checkin_antwoorden (categorie);
