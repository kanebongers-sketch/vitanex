-- ─── LifeOS — blokken in je agenda + taken uit je mail ──────────────────────
-- 1. agenda_blokken: elk blok dat LifeOS in je persoonlijke agenda zette (taak,
--    gebundelde mail, bouwblok "PT uitbouwen"). De sleutel is uniek: de insert is
--    het slot tegen dubbel plannen (twee klokken), én het geheugen — verplaats of
--    verwijder jij het blok, dan plant LifeOS die sleutel nooit opnieuw.
-- 2. mail_taken: welke mail al een taak werd. Uniek per bericht, zodat dezelfde
--    mail nooit twee taken oplevert; de thread is er om te zien of je al reageerde.
-- Alleen de service-role schrijft/leest (RLS aan, geen policy — zoals de rest).

create table if not exists public.agenda_blokken (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  soort text not null check (soort in ('taak', 'mail', 'bouw')),
  sleutel text not null,
  taak_ids uuid[] not null default '{}',
  extern_id text,
  titel text not null,
  start_op timestamptz,
  eind_op timestamptz,
  status text not null default 'gepland' check (status in ('gepland', 'opgeruimd')),
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, sleutel)
);

create index if not exists agenda_blokken_start on public.agenda_blokken (user_id, start_op);
alter table public.agenda_blokken enable row level security;

create table if not exists public.mail_taken (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  bericht_id text not null,
  thread_id text not null default '',
  taak_id uuid references public.taken (id) on delete set null,
  soort text not null check (soort in ('factuur', 'offerte', 'reageren')),
  afzender text,
  ontvangen_op timestamptz not null,
  beantwoord_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, bericht_id)
);

create index if not exists mail_taken_thread on public.mail_taken (user_id, thread_id);
alter table public.mail_taken enable row level security;
