-- ─── PT-app — contactmoment: notitie + status + volgende opvolging ─────────
-- Zoals in MyLeads: bij een lead leg je in één keer vast wat er gebeurde, de
-- nieuwe status en wanneer je weer opvolgt (met tijd). Het logboek bewaart per
-- moment de status en de afgesproken opvolging, zodat het verloop leesbaar is.

alter table public.pt_leads add column if not exists opvolgtijd time;

alter table public.pt_leadnotities add column if not exists status text
  check (status is null or status in ('nieuw', 'opvolgen', 'proefles', 'intake', 'later', 'geen_interesse', 'geen_klant', 'klant'));
alter table public.pt_leadnotities add column if not exists opvolgdatum date;
alter table public.pt_leadnotities add column if not exists opvolgtijd time;
