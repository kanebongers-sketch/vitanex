-- ─────────────────────────────────────────────────────────────────────────────
-- 045 — uitnodiging_tokens: de publieke policies eraf
-- ─────────────────────────────────────────────────────────────────────────────
-- Lost de openstaande post uit 044 op ("NA HET DRAAIEN", regel 182).
--
-- Wat er stond (002_ontbrekende_tabellen.sql:346-350):
--
--   create policy "tokens: publiek token opzoeken"
--     on uitnodiging_tokens for select using (true);
--   create policy "tokens: bijwerken als gebruikt"
--     on uitnodiging_tokens for update using (true);
--
-- Geen van beide had `to authenticated`, dus ze golden ook voor `anon` — de
-- sleutel die in elke browserbundle meegaat. Dat is niet alleen enumeratie:
-- de UPDATE-policy had geen WITH CHECK, en dan valt WITH CHECK terug op de
-- USING-expressie (`true`). Anon mocht dus élke waarde in élke rij schrijven.
-- De keten: tokens uitlezen -> `email` van een ongebruikte uitnodiging naar je
-- eigen adres schrijven -> registreren -> binnen bij dat klantbedrijf.
--
-- Waarom de policies bestonden: de uitnodigingspagina is per definitie anoniem
-- (je hébt nog geen account) en zocht het token client-side op. Die lookup is
-- verplaatst naar /api/uitnodiging (service-role), en het als-gebruikt-markeren
-- naar /api/uitnodiging/accepteer. Beide routes leiden `bedrijf_id` server-side
-- uit het token af in plaats van uit client-state, en binden het token aan het
-- geverifieerde e-mailadres van de sessie.
--
-- Wat blijft staan: de drie HR-policies uit 002 (select/insert/delete, elk
-- gescoped op het eigen bedrijf). De HR-kant in src/app/(app)/team/page.tsx doet
-- geen UPDATE, dus na deze migratie is er geen UPDATE-policy meer — en dat is
-- precies goed: alleen de service-role (die RLS bypasst) markeert nog.
--
-- Idempotent: drop if exists. Veilig opnieuw te draaien.
--
-- LET OP bij deployen: dit raakt de live uitnodigingsflow. Draai deze migratie
-- samen met de bijbehorende routes — een oude client tegen een nieuwe database
-- ziet "Link niet geldig", omdat de client-side lookup dan geweigerd wordt.

drop policy if exists "tokens: publiek token opzoeken" on uitnodiging_tokens;
drop policy if exists "tokens: bijwerken als gebruikt" on uitnodiging_tokens;

-- Vangnet voor de toekomst: ook als iemand ooit per ongeluk een UPDATE-policy
-- terugzet, mag een niet-service-role-sessie nooit meer dan `gebruikt` omzetten.
-- Zo kan de aanvalsketen (email/bedrijf_id herschrijven) niet opnieuw ontstaan
-- door één policy-regel.
create or replace function public.guard_uitnodiging_token()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Server-/migratiecontext mag alles.
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if new.token      is distinct from old.token
     or new.email      is distinct from old.email
     or new.bedrijf_id is distinct from old.bedrijf_id then
    raise exception
      'Niet toegestaan: een uitnodiging kan client-side niet herschreven worden.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_uitnodiging_token on public.uitnodiging_tokens;
create trigger trg_guard_uitnodiging_token
  before update on public.uitnodiging_tokens
  for each row
  execute function public.guard_uitnodiging_token();
