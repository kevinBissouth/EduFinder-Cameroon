// Dans une ligne de champs côte à côte, chaque champ range son libellé, sa
// saisie et son erreur dans trois rangées partagées avec ses voisins
// (subgrid) : un libellé sur deux lignes ou une erreur sous un seul champ ne
// décale plus les autres. L'écart entre rangées vient alors de la grille parente.
export function fieldLayoutClasses(isGridAligned) {
  return isGridAligned ? 'row-span-3 grid grid-rows-subgrid' : 'flex flex-col gap-1.5'
}
