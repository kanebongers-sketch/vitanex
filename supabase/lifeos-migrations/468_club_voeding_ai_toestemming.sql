-- 468: Club, voedingsdagboek: toestemming voor de AI-schatting (foto). Alleen toevoegen, idempotent.
-- Uitgevoerd door Claude op 29-10-2026 (toestemming Kane: aanvullende migraties voor Club).
--
-- Besluit Kane (29-10-2026): "Inspreken mag eruit. Ik wil wel graag de foto maken."
-- Voor het eerste gebruik geeft het lid uitdrukkelijk toestemming dat de foto (of
-- een omschrijving) naar de AI-dienst (Anthropic) gaat om de maaltijd te schatten;
-- de foto wordt niet bewaard. Vastgelegd met tijdstip en tekstversie, net als het
-- starten van het dagboek (gestart_op, tekst_versie). Intrekken zet beide op null.
--
-- Code: src/lib/club/voeding/dagboek/opslag.ts (AI_TEKST_VERSIE) en model.ts
-- (INSTELLING_KOLOMMEN). De rij hoort bij het lid: wissen van het dagboek en de
-- AVG-verwijdering van het lid nemen hem al mee (club_voeding_instellingen, migratie 466).
--
-- De check op club_voeding_logs.bron laat 'spraak' nog toe; de code gebruikt die
-- waarde niet meer. Niet aangepast: alleen toevoegen.

alter table public.club_voeding_instellingen
  add column if not exists ai_toestemming_op timestamptz,
  add column if not exists ai_tekst_versie text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'club_voeding_instellingen_ai_tekst_versie_lengte'
      and conrelid = 'public.club_voeding_instellingen'::regclass
  ) then
    alter table public.club_voeding_instellingen
      add constraint club_voeding_instellingen_ai_tekst_versie_lengte
      check (ai_tekst_versie is null or char_length(ai_tekst_versie) between 1 and 40);
  end if;
end $$;

comment on column public.club_voeding_instellingen.ai_toestemming_op is
  'Wanneer het lid toestemming gaf voor de AI-schatting (foto naar Anthropic, niet bewaard); null = geen of ingetrokken.';
comment on column public.club_voeding_instellingen.ai_tekst_versie is
  'Versie van de toestemmingstekst die het lid zag (AI_TEKST_VERSIE in opslag.ts).';
