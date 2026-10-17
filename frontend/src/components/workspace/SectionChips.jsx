import { useTranslation } from 'react-i18next'

const MAX_SHOWN_SECTIONS = 3

// Quelques rubriques suffisent à reconnaître une soumission ; la liste entière
// est dans son détail. Une pastille placée avant (le type de soumission, par
// exemple) se passe en enfant.
function SectionChips({ sections, children }) {
  const { t } = useTranslation('workspace')
  const shownSections = sections.slice(0, MAX_SHOWN_SECTIONS)
  const hiddenCount = sections.length - shownSections.length

  return (
    <span className="mt-1.5 flex flex-wrap gap-1">
      {children}
      {shownSections.map((section) => (
        <span key={section} className="rounded-full bg-muted px-2 py-0.5 text-xs text-navy">
          {section}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-primary-deep">
          {t('notifications.moreSections', { count: hiddenCount })}
        </span>
      )}
    </span>
  )
}

export default SectionChips
