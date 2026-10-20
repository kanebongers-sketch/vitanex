// ─── Club, boekingswidget: de schakelaar ────────────────────────────────────
// CLUB_WIDGET_ACTIEF=1 in Render zet de widget op websites van sportscholen aan.
// Uit (standaard): elke widget-pagina en de aanvraag-API geven een gewone 404,
// behalve de voorvertoning voor Kane binnen Club. Pas aanzetten na de
// presentatie (besluit Kane): tot dan mag niemand behalve Kane iets van Club zien.

export function widgetActief(): boolean {
  return process.env.CLUB_WIDGET_ACTIEF === '1'
}
