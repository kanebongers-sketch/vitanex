# LifeOS-migraties (apart Supabase-project)

**Deze map hoort NIET bij `supabase/migrations/`.** Draai ze nooit op de
MentaForce-database.

## Twee databases, één repo

MentaForce en LifeOS delen een codebase maar géén database:

| | MentaForce | LifeOS |
|---|---|---|
| Supabase-project | de B2B-database | `bbklogjersviaoocgrve` (`lifeos`, EU-Frankfurt) |
| Migraties | `supabase/migrations/` | **deze map** |
| Tenancy | multi-tenant (bedrijven, rollen) | single-tenant (alleen Kane) |
| Belofte | anoniem, AVG-conform | persoonlijk, geen anonimiteitslaag |

De scheiding is een productbeslissing, geen ongeluk: MentaForce belooft
medewerkers dat het hen niet kan zien. Kane's inbox bevat persoonsgegevens van
derden die daar nooit toestemming voor gaven. Die twee horen niet in één
database. `src/lib/lifeos/admin.ts` is de enige brug — server-side, achter een
founder-gate.

## Waarom de migraties hier staan en niet in `C:\Users\Kaneb\lifeos`

De LifeOS-code is geport naar deze repo (juli 2026); de standalone repo is sinds
dat moment alleen nog historie. Het schema bleef daar achter, waardoor code en
schema uit elkaar konden lopen zonder dat iets dat merkte. Migraties horen bij de
code die ze gebruikt — vandaar deze map.

Nummering loopt door op de standalone-reeks (001…090), dus nieuwe migraties
beginnen bij **100**.

## Draaien

Via de Supabase-SQL-editor op het **lifeos**-project (niet MentaForce), op
volgorde van nummer. Elke migratie is idempotent (`if not exists` /
`pg_constraint`-checks), dus opnieuw draaien is veilig.

## Historie (al gedraaid, staan in de standalone-repo)

`001_fundament` · `010_herstel` · `020_agenda_taken` · `040_vita` ·
`050_notities` · `060_voeding` · `070_training` · `090_notities_tags`
