-- 470: Club, rollenmodel v2: het profiel van een beheerderslogin telt niet als personeel. Alleen toevoegen, idempotent.
-- Uitgevoerd door Claude op 30-10-2026 (toestemming Kane: aanvullende migraties voor Club).
--
-- Migratie 469 gaf elke beheerder (eigenaar, clubmanager) een profiel in
-- club_medewerkers met actief = true. De oude code telt actieve medewerkers
-- (startwizard: stap Team en de poort, platformoverzicht, keuzelijsten). Een
-- nieuwe sportschool had daardoor meteen "een medewerker" en de wizard dacht
-- dat het team al stond. Daarom: zo'n profiel staat op actief = false zolang
-- het geen werkrol heeft (trainer, instructeur, manager, administratie in
-- club_medewerkers.rollen). Krijgt de eigenaar een werkrol in Team, dan zet de
-- API hem op actief (src/lib/club/rollen/opslag.ts, activeerVoorWerk).
-- Rollen v2 leest het profiel los van actief (haalProfiel); het aantal
-- eigenaren telt ook profielen met een actieve beheerderslogin (telEigenaren).

create or replace function public.club_profiel_voor_beheerder(p_org uuid, p_naam text, p_email text, p_rol text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_rol text := case when p_rol = 'clubmanager' then 'manager' else 'eigenaar' end;
begin
  -- Geen demo (een echte login hoort niet bij de demodata) en niet actief (geen personeel tot er een werkrol is).
  insert into public.club_medewerkers (user_id, naam, email, rollen, vestigingen, alle_vestigingen, actief, demo)
  values (p_org, left(coalesce(nullif(trim(p_naam), ''), 'Beheerder'), 80), case when p_email is null then null else left(lower(trim(p_email)), 160) end,
          '{}', '{}', true, false, false)
  returning id into v_id;
  insert into public.club_profiel_rollen (user_id, medewerker_id, rol, toegekend_door, demo)
  values (p_org, v_id, v_rol, 'Aanmelding', false)
  on conflict (medewerker_id, rol) do nothing;
  return v_id;
end
$$;

revoke all on function public.club_profiel_voor_beheerder(uuid, text, text, text) from public, anon, authenticated;

update public.club_medewerkers m
set actief = false
from public.club_beheerders b
where b.profiel_id = m.id
  and b.organisatie_id = m.user_id
  and m.actief
  and coalesce(array_length(m.rollen, 1), 0) = 0;
