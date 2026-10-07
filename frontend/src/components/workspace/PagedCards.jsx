import { ChevronLeft, ChevronRight } from 'lucide-react'

import { usePagedItems } from '../../hooks/usePagedItems'

const PAGE_BUTTON_CLASSES =
  'inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-button border border-line bg-surface px-4 text-sm font-semibold text-navy transition-colors hover:border-primary hover:text-primary-deep disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line disabled:hover:text-navy'

function Pagination({ pageIndex, pageCount, onGoToPage }) {
  return (
    <nav aria-label="Pages" className="mt-6 flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={pageIndex === 0}
        onClick={() => onGoToPage(pageIndex - 1)}
        className={PAGE_BUTTON_CLASSES}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Previous
      </button>
      <p aria-live="polite" className="text-sm font-semibold text-ink">
        Page {pageIndex + 1} of {pageCount}
      </p>
      <button
        type="button"
        disabled={pageIndex === pageCount - 1}
        onClick={() => onGoToPage(pageIndex + 1)}
        className={PAGE_BUTTON_CLASSES}
      >
        Next
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </nav>
  )
}

// Grille de cartes limitée à une page : six cartes sur grand écran, trois sur
// téléphone. La pagination n'apparaît que s'il y a plus d'une page. Dans un
// conteneur étroit, l'appelant réduit le nombre de colonnes.
const DEFAULT_GRID_CLASSES = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'

function PagedCards({ items, renderCard, gridClassName = DEFAULT_GRID_CLASSES }) {
  const { pageItems, pageIndex, pageCount, goToPage } = usePagedItems(items)

  return (
    <>
      <ul className={`grid gap-4 ${gridClassName}`}>
        {pageItems.map(renderCard)}
      </ul>
      {pageCount > 1 && (
        <Pagination pageIndex={pageIndex} pageCount={pageCount} onGoToPage={goToPage} />
      )}
    </>
  )
}

export default PagedCards
