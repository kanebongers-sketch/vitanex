-- ─── PT-app — logboek per lead ──────────────────────────────────────────────
-- Korte, gedateerde notities bij een lead ("gebeld, voicemail", "proefles
-- dinsdag 18:00"), zodat je in één oogopslag ziet hoe het ervoor staat. Hoort
-- bij de lead: lead weg (ook via de bewaartermijn) → logboek weg. Rechten via
-- de lead (zelfde PT'er, of Kane); `door` is de naam van wie het schreef.

create table if not exists public.pt_leadnotities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.pt_leads (id) on delete cascade,
  user_id uuid not null,
  datum date not null,
  tekst text not null check (char_length(tekst) between 1 and 500),
  door text,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists pt_leadnotities_lead on public.pt_leadnotities (lead_id, aangemaakt_op desc);
alter table public.pt_leadnotities enable row level security;
revoke all on public.pt_leadnotities from anon, authenticated;
