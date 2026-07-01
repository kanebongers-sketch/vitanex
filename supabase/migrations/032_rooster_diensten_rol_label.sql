-- ================================================================
-- MentaForce – Migratie 032: rooster_diensten.rol_label
-- ================================================================
-- De rooster-UI (inplannen + weergave) gebruikt een rol-label per dienst
-- (bv. "Ochtenddienst", "Kok"). Die kolom ontbrak, waardoor het inplannen
-- (INSERT) en laden (SELECT) van diensten faalde zodra de code draaide.

alter table rooster_diensten add column if not exists rol_label text;
