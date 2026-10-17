-- 414: Club, voortgang van leden. Losse metingen tussen de intakes door.
--
-- AVG: lichaamsmetingen zijn gezondheidsgegevens (bijzondere persoonsgegevens).
-- Een meting bestaat daarom alleen met expliciete toestemming van het lid:
-- toestemming_gezondheid moet true zijn, anders weigert de database de rij.
-- Alleen de server schrijft (RLS aan, geen policies). Idempotent, alleen toevoegen.

create table if not exists public.club_metingen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid not null references public.club_leden(id) on delete cascade,
  medewerker_id uuid references public.club_medewerkers(id) on delete set null,
  datum date not null default current_date,
  gewicht_kg numeric(5,1) check (gewicht_kg between 30 and 300),
  lengte_cm numeric(4,1) check (lengte_cm between 100 and 230),
  vetpercentage numeric(4,1) check (vetpercentage between 3 and 70),
  buikomtrek_cm numeric(4,1) check (buikomtrek_cm between 40 and 200),
  heupomtrek_cm numeric(4,1) check (heupomtrek_cm between 50 and 200),
  spiermassa_kg numeric(4,1) check (spiermassa_kg between 10 and 120),
  rusthartslag int check (rusthartslag between 30 and 220),
  bloeddruk text check (bloeddruk ~ '^\d{2,3}/\d{2,3}$'),
  notitie text check (char_length(notitie) <= 1000),
  toestemming_gezondheid boolean not null check (toestemming_gezondheid = true),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  constraint club_metingen_iets_gemeten check (
    coalesce(gewicht_kg, lengte_cm, vetpercentage, buikomtrek_cm, heupomtrek_cm, spiermassa_kg, rusthartslag::numeric) is not null
    or bloeddruk is not null
  )
);
create index if not exists club_metingen_lid on public.club_metingen (user_id, lid_id, datum desc);

alter table public.club_metingen enable row level security;
revoke all on public.club_metingen from anon, authenticated;

-- ─── Demodata: drie maanden verloop voor een handvol demo-leden ─────────────
-- Fit Factory Budel: leden met een intake; het verloop sluit aan op het
-- gewicht en de lengte van die intake. Voorbeeld Gym: leden zonder intake,
-- met een eigen startwaarde. Alleen als er nog geen demo-metingen zijn.
do $$
declare
  ff uuid := '67b0a700-3f1d-425e-9646-98c237e34fd7';
  vg uuid := 'de000000-0000-4000-8000-0000000000c1';
  r record;
  stap int;
  dagen int;
  w numeric;
  helling numeric;
  vrouw boolean;
begin
  if exists (select 1 from public.club_metingen where demo) then
    return;
  end if;

  -- Fit Factory: zes demo-leden met een intake (gewicht en lengte bekend).
  for r in
    select l.id, l.user_id, i.medewerker_id,
           (i.metingen->>'gewicht_kg')::numeric as gewicht,
           (i.metingen->>'lengte_cm')::numeric as lengte,
           i.datum as intake_datum,
           row_number() over (order by l.id) as nr
    from public.club_leden l
    join lateral (
      select * from public.club_intakes ci
      where ci.lid_id = l.id and ci.user_id = l.user_id and ci.metingen ? 'gewicht_kg' and ci.metingen ? 'lengte_cm'
      order by ci.datum limit 1
    ) i on true
    where l.user_id = ff and l.demo and l.status = 'actief' and l.vestiging = 'budel'
    order by l.id
    limit 6
  loop
    -- Om en om afvallen en opbouwen, zodat de grafieken verschillend ogen.
    helling := case r.nr % 3 when 1 then -0.045 when 2 then -0.025 else 0.012 end;
    vrouw := r.nr % 2 = 0;
    -- Elke 2 weken een meting, van 13 weken geleden tot nu, behalve op de intakedag zelf.
    for stap in 0..6 loop
      dagen := 91 - stap * 14 - (r.nr::int % 3);
      if (current_date - dagen) = r.intake_datum then continue; end if;
      w := r.gewicht + helling * ((current_date - dagen) - r.intake_datum) + ((stap * 7 + r.nr::int) % 5 - 2) * 0.15;
      insert into public.club_metingen (user_id, lid_id, medewerker_id, datum, gewicht_kg, lengte_cm, vetpercentage,
        buikomtrek_cm, heupomtrek_cm, spiermassa_kg, rusthartslag, bloeddruk, notitie, toestemming_gezondheid, demo)
      values (
        r.user_id, r.id, r.medewerker_id, current_date - dagen,
        round(w, 1),
        case when stap = 0 then r.lengte else null end,
        round((case when vrouw then 29 else 22 end) + helling * 40 * stap / 6.0 * 3 + (stap % 2) * 0.2, 1),
        round((case when vrouw then 84 else 92 end) + helling * 60 * stap / 6.0 * 2 + (stap % 3) * 0.3, 1),
        case when vrouw then round(102 + helling * 40 * stap / 6.0, 1) else null end,
        case when stap % 2 = 0 then round((case when vrouw then 27 else 35 end) + 0.15 * stap, 1) else null end,
        case when stap % 2 = 0 then 68 - stap else null end,
        case when stap in (0, 6) then case when stap = 0 then '128/84' else '122/80' end else null end,
        case when stap = 0 then 'Startmeting, ochtend en nuchter.' when stap = 6 then 'Mooi verloop, zelfde tijdstip gemeten.' else null end,
        true, true
      );
    end loop;
  end loop;

  -- Voorbeeld Gym: twee leden per vestiging, zonder intake.
  for r in
    select l.id, l.user_id,
           (select m.id from public.club_medewerkers m where m.user_id = l.user_id and m.actief and l.vestiging = any(m.vestigingen) order by m.naam limit 1) as medewerker_id,
           row_number() over (partition by l.vestiging order by l.id) as nr,
           l.vestiging
    from public.club_leden l
    where l.user_id = vg and l.demo and l.status = 'actief' and l.vestiging in ('voorbeeld-centrum', 'voorbeeld-noord')
  loop
    continue when r.nr > 2;
    vrouw := r.nr = 2;
    helling := case when r.vestiging = 'voorbeeld-centrum' then -0.05 else 0.015 end;
    for stap in 0..6 loop
      dagen := 90 - stap * 14;
      w := (case when vrouw then 74 else 88 end) + helling * (90 - dagen) + ((stap * 3 + r.nr::int) % 5 - 2) * 0.15;
      insert into public.club_metingen (user_id, lid_id, medewerker_id, datum, gewicht_kg, lengte_cm, vetpercentage,
        buikomtrek_cm, heupomtrek_cm, spiermassa_kg, rusthartslag, bloeddruk, notitie, toestemming_gezondheid, demo)
      values (
        r.user_id, r.id, r.medewerker_id, current_date - dagen,
        round(w, 1),
        case when stap = 0 then (case when vrouw then 168 else 182 end) else null end,
        round((case when vrouw then 30 else 24 end) + helling * 30 * stap / 6.0 * 3, 1),
        round((case when vrouw then 86 else 96 end) + helling * 50 * stap / 6.0 * 2, 1),
        case when vrouw then round(104 + helling * 35 * stap / 6.0, 1) else null end,
        case when stap % 3 = 0 then round((case when vrouw then 26 else 36 end) + 0.2 * stap, 1) else null end,
        case when stap % 3 = 0 then 70 - stap else null end,
        null,
        case when stap = 0 then 'Startmeting.' else null end,
        true, true
      );
    end loop;
  end loop;
end $$;
