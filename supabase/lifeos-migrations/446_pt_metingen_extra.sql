-- 446 · Fit Factory PT · extra meetopties bij een meting of weging.
-- De PT'er kiest per klant zelf extra waarden (spiermassa, rusthartslag, enz.).
-- Opslag als jsonb-object { sleutel: getal }; welke sleutels er zijn en hun
-- bereik staat als data in src/lib/lifeos/pt-dashboard/meting-extra.ts en wordt
-- daar gevalideerd. Alleen toevoegen: bestaande rijen krijgen {}.

alter table public.pt_metingen
  add column if not exists extra jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pt_metingen_extra_object') then
    alter table public.pt_metingen add constraint pt_metingen_extra_object
      check (jsonb_typeof(extra) = 'object' and pg_column_size(extra) <= 4096);
  end if;
end $$;
