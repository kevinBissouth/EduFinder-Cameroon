// Nom d'une classe dans une liste de choix : son nom officiel seul (« 6e »,
// « Form 1 »). Les classes proposées sont déjà celles du type et de la section
// de l'établissement, le cycle n'apporte donc rien — sauf quand deux classes
// de la liste portent le même nom : je le leur ajoute pour les distinguer.
//
// Le nom d'une classe ne se traduit pas ; translateStage traduit le cycle.
export function labelLevelOptions(levels, translateStage) {
  const levelCountByLabel = new Map()
  levels.forEach((level) =>
    levelCountByLabel.set(level.label, (levelCountByLabel.get(level.label) ?? 0) + 1),
  )

  return levels.map((level) => ({
    ...level,
    name:
      levelCountByLabel.get(level.label) > 1
        ? `${translateStage(level.stage)} — ${level.label}`
        : level.label,
  }))
}
