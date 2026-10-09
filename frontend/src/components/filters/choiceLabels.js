// Le nom à afficher sur le bouton d'un critère à choix unique : celui de
// l'option retenue, sinon le libellé « tout » du critère.
export function findSelectedName(choice) {
  const selectedOption = choice.options.find((option) => String(option.id) === String(choice.selectedId))
  return selectedOption?.name ?? choice.anyLabel
}
