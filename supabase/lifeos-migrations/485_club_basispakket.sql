-- ─── 485: basis met add-ons, de basis is altijd afgenomen ───────────────────
-- Besluit Kane (31-10-2026): "Ledenadministratie is eigenlijk de basis. Er moet
-- een basispakket zijn." Vervangt "elk pakket los" (migratie 467). De basis
-- (sleutel 'administratie') zit altijd in club_organisaties.pakketten; de andere
-- vijf (lessen, training, afspraken, team, groei) zijn add-ons.
--
-- 1. Voeg 'administratie' toe waar het ontbreekt (alleen array_append, niets
--    verwijderen). Bij het schrijven (31-10-2026) miste alleen de testsportschool
--    "Stripetest" (slug stripetest, pakketten {lessen}).
-- 2. Een check zodat pakketten altijd de basis bevat. De app schrijft altijd met
--    de basis (metBasis in src/lib/aiyourgym/pakketten.ts).
--
-- ayg_aanmeldingen.pakketten blijft zonder check: dat is de geschiedenis van
-- een aanmelding; de app voegt de basis bij het lezen toe.
-- Alleen toevoegen, idempotent.

update public.club_organisaties
   set pakketten = array_append(pakketten, 'administratie'),
       bijgewerkt_op = now()
 where not ('administratie' = any(pakketten));

alter table public.club_organisaties drop constraint if exists club_organisaties_basis_check;
alter table public.club_organisaties add constraint club_organisaties_basis_check
  check ('administratie' = any(pakketten));

comment on constraint club_organisaties_basis_check on public.club_organisaties is
  'Basis met add-ons (besluit Kane 31-10-2026): de basis Ledenadministratie is altijd afgenomen.';
