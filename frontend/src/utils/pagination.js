// Découpe une liste en pages. La page demandée est ramenée dans les bornes :
// si la liste raccourcit ou si la taille de page change, on ne tombe jamais
// sur une page vide.
export function paginate(items, pageSize, requestedPageIndex) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const pageIndex = Math.min(Math.max(requestedPageIndex, 0), pageCount - 1)
  const firstItemIndex = pageIndex * pageSize
  return {
    pageItems: items.slice(firstItemIndex, firstItemIndex + pageSize),
    pageIndex,
    pageCount,
  }
}
