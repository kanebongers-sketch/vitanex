-- 474: Club, profielfoto: het profiel van een beheerderslogin houdt zijn foto. Alleen toevoegen, idempotent.
-- Uitgevoerd door Claude op 30-10-2026 (toestemming Kane: aanvullende migraties voor Club).
--
-- Migratie 473 haalt de foto van een medewerker weg zodra hij uit dienst gaat
-- (actief van true naar false). Sinds migratie 470 staat het profiel van een
-- eigenaar of clubmanager op actief = false zolang het geen werkrol heeft; een
-- werkrol weghalen zette het profiel dus "uit dienst" en wiste de eigen foto.
-- Nu: bij uit dienst alleen weg als er geen actieve beheerderslogin aan het
-- profiel hangt. Anonimiseren haalt de foto altijd weg.
-- Terugdraaien: de functie uit migratie 473 opnieuw zetten.

create or replace function public.club_profielfoto_weg_medewerker()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.geanonimiseerd_op is null
     and exists (select 1 from public.club_beheerders b where b.profiel_id = new.id and b.actief) then
    return new;
  end if;
  delete from public.club_profielfotos where medewerker_id = new.id;
  return new;
end;
$$;

revoke all on function public.club_profielfoto_weg_medewerker() from public, anon, authenticated;
