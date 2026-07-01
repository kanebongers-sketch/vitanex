-- ================================================================
-- MentaForce – Migratie 029: extra achievements (Fit Level-mijlpalen + dag-streak)
-- ================================================================
-- Onderdeel van de gamification-unificatie: de DB wordt de canonieke
-- achievement-bron. Deze migratie voegt de mijlpaal- en dagelijkse-streak-
-- achievements toe die voorheen alleen in localStorage bestonden, zodat ze
-- server-side (uit user_xp.xp en gewoonte_logs) toegekend kunnen worden.
-- Idempotent: on conflict (slug) do nothing laat bestaande rijen ongemoeid.

insert into achievements (slug, naam, beschrijving, icon, xp_beloning, categorie) values
  ('level_5',       'Halverwege',   'Fit Level 5 bereikt — Gedreven',       '🌟', 150, 'mijlpaal'),
  ('level_8',       'Elite',        'Fit Level 8 bereikt — Elite',          '💎', 250, 'mijlpaal'),
  ('level_10',      'Legende',      'Fit Level 10 bereikt — het maximum',   '👑', 500, 'mijlpaal'),
  ('streak_dag_7',  'Week op rij',  '7 dagen op rij een gewoonte gelogd',   '🔥',  75, 'streak'),
  ('streak_dag_30', 'Maand op rij', '30 dagen op rij een gewoonte gelogd',  '🌟', 300, 'streak')
on conflict (slug) do nothing;
