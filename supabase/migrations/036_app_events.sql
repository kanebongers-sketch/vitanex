-- 036: app_events — interne product-analytics (retentie, feature-gebruik,
-- client-fouten). Bewust minimaal en EU-gehost (Supabase zelf): user_id,
-- eventnaam uit een vaste allowlist en een klein gesaneerd meta-object.
-- Geen third-party trackers; alleen leesbaar voor de service-role
-- (founder-metrics via /api/admin/metrics).

create table if not exists app_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  meta jsonb,
  aangemaakt_op timestamptz not null default now()
);

create index if not exists app_events_event_tijd_idx on app_events (event, aangemaakt_op desc);
create index if not exists app_events_user_tijd_idx on app_events (user_id, aangemaakt_op desc);

-- Clients raken deze tabel nooit rechtstreeks aan: schrijven gaat via
-- /api/events (service-role, na JWT-verificatie), lezen via /api/admin/metrics.
alter table app_events enable row level security;
revoke all on table app_events from anon, authenticated;
