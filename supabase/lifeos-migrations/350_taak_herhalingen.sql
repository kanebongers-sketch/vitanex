-- ─── LifeOS — herhalende taken ──────────────────────────────────────────────
-- Een taak kan een herhaalregel hebben ("elke maandag", "elke maand"). Vink je
-- hem af, dan maakt LifeOS de volgende keer aan en verhuist de regel naar die
-- nieuwe taak. Daarom hangt de regel aan de taak (primary key = taak_id): er is
-- altijd precies één "lopende" taak per reeks.
--
-- Los tabelletje i.p.v. een kolom op `taken`: zo blijft het lezen van taken
-- werken, ook zolang deze migratie nog niet gedraaid is.
-- Alleen de service-role schrijft/leest (RLS aan, geen policy — zoals de rest).

create table if not exists public.taak_herhalingen (
  taak_id uuid primary key references public.taken (id) on delete cascade,
  user_id uuid not null,
  regel text not null check (regel in ('dagelijks', 'werkdagen', 'wekelijks', 'tweewekelijks', 'maandelijks')),
  aangemaakt_op timestamptz not null default now()
);

create index if not exists taak_herhalingen_user on public.taak_herhalingen (user_id);

alter table public.taak_herhalingen enable row level security;
