// Ajoute la valeur si elle manque, la retire si elle est déjà choisie.
export function toggleValue(selectedValues, value) {
  return selectedValues.includes(value)
    ? selectedValues.filter((selectedValue) => selectedValue !== value)
    : [...selectedValues, value]
}

export function toChipOptions(labels) {
  return labels.map((label) => ({ value: label, label }))
}
