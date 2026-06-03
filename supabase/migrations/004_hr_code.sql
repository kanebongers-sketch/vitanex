-- ================================================================
-- MentaForce – Migratie 004: HR CODE koppelsysteem
-- ================================================================

-- ── 1. Hulpfunctie: genereer unieke HR code (formaat AAA-NNA) ─────────────

create or replace function genereer_hr_code() returns text language plpgsql as $$
declare
  chars_letters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  chars_digits  text := '0123456789';
  kandidaat     text;
  pogingen      int := 0;
begin
  loop
    kandidaat :=
      substr(chars_letters, (floor(random() * length(chars_letters))::int + 1), 1) ||
      substr(chars_letters, (floor(random() * length(chars_letters))::int + 1), 1) ||
      substr(chars_letters, (floor(random() * length(chars_letters))::int + 1), 1) ||
      '-' ||
      substr(chars_digits,  (floor(random() * length(chars_digits))::int  + 1), 1) ||
      substr(chars_letters, (floor(random() * length(chars_letters))::int + 1), 1) ||
      substr(chars_digits,  (floor(random() * length(chars_digits))::int  + 1), 1);

    -- controleer uniciteit
    if not exists (select 1 from bedrijven where hr_code = kandidaat) then
      return kandidaat;
    end if;

    pogingen := pogingen + 1;
    if pogingen > 100 then
      raise exception 'Kon geen unieke HR code genereren na 100 pogingen';
    end if;
  end loop;
end;
$$;

-- ── 2. bedrijven tabel: aanmaken als die nog niet bestaat ─────────────────
--    (de migratie is idempotent: bestaande kolommen worden overgeslagen)

create table if not exists bedrijven (
  id         uuid primary key default gen_random_uuid(),
  naam       text not null,
  aangemaakt timestamptz not null default now()
);

alter table bedrijven enable row level security;

-- ── 3. hr_code kolommen toevoegen aan bedrijven ───────────────────────────

alter table bedrijven
  add column if not exists hr_code       text unique,
  add column if not exists hr_code_actief boolean not null default true;

-- Vul bestaande rijen die nog geen code hebben
update bedrijven
set hr_code = genereer_hr_code()
where hr_code is null;

-- Zet NOT NULL na de backfill
alter table bedrijven
  alter column hr_code set not null;

create index if not exists idx_bedrijven_hr_code on bedrijven(hr_code);

-- ── 4. RLS policies voor bedrijven ───────────────────────────────────────

-- Iedereen mag een bedrijfsnaam ophalen via de HR code (voor validatie)
create policy if not exists "bedrijven: publiek hr_code opzoeken"
  on bedrijven for select
  using (hr_code_actief = true);

-- HR/admin van het bedrijf mag het eigen bedrijf volledig lezen
create policy if not exists "bedrijven: eigen bedrijf lezen"
  on bedrijven for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and rol in ('hr', 'admin')
        and bedrijf_id = bedrijven.id
    )
  );

-- HR/admin mag de code regenereren (update hr_code)
create policy if not exists "bedrijven: hr_code bijwerken"
  on bedrijven for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and rol in ('hr', 'admin')
        and bedrijf_id = bedrijven.id
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and rol in ('hr', 'admin')
        and bedrijf_id = bedrijven.id
    )
  );

-- Admin mag bedrijven aanmaken
create policy if not exists "bedrijven: admin aanmaken"
  on bedrijven for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
  );

-- ── 5. Trigger: automatisch HR code genereren bij nieuw bedrijf ───────────

create or replace function bedrijf_hr_code_trigger() returns trigger language plpgsql as $$
begin
  if new.hr_code is null or new.hr_code = '' then
    new.hr_code := genereer_hr_code();
  end if;
  return new;
end;
$$;

drop trigger if exists set_hr_code on bedrijven;
create trigger set_hr_code
  before insert on bedrijven
  for each row execute function bedrijf_hr_code_trigger();

-- ── 6. hr_code_logs: auditlog van koppelingen via code ────────────────────

create table if not exists hr_code_logs (
  id           uuid primary key default gen_random_uuid(),
  bedrijf_id   uuid not null references bedrijven(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  gekoppeld_op timestamptz not null default now(),
  unique (user_id)   -- een user kan maar aan één bedrijf gekoppeld zijn
);

alter table hr_code_logs enable row level security;

create policy "hr_code_logs: eigen lezen"
  on hr_code_logs for select using (auth.uid() = user_id);

create policy "hr_code_logs: eigen aanmaken"
  on hr_code_logs for insert with check (auth.uid() = user_id);

create policy "hr_code_logs: hr leest eigen bedrijf"
  on hr_code_logs for select using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and rol in ('hr', 'admin')
        and bedrijf_id = hr_code_logs.bedrijf_id
    )
  );

create index if not exists idx_hr_code_logs_bedrijf on hr_code_logs(bedrijf_id, gekoppeld_op desc);
