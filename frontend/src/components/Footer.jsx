import { ArrowUp, GraduationCap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from './ui/Button'
import Container from './ui/Container'

const FOOTER_LINK_CLASSES =
  'flex min-h-11 cursor-pointer items-center rounded-control text-left text-sm text-on-navy-soft transition-colors hover:text-white'
const COLUMN_TITLE_CLASSES = 'text-xs font-semibold uppercase tracking-eyebrow text-violet'

const DIRECTORY_LINKS = [
  { labelKey: 'footer.findSchools', href: '#results' },
  { labelKey: 'footer.popularDestinations', href: '#destinations' },
  { labelKey: 'footer.globalPicture', href: '#global-picture' },
  { labelKey: 'footer.howItWorks', href: '#how-it-works' },
]

// Le filtre par type n'a de sens que sur la page de recherche : sans
// onNavigateToType (fiche d'établissement), la colonne n'est pas affichée.
function Footer({ types = [], onNavigateToType }) {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer id="footer" className="bg-navy text-white [--focus-ring:var(--color-accent)]">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.5fr_1fr_1fr] lg:gap-16 lg:py-20">
        <div className="max-w-sm">
          <p className="flex items-center gap-2 text-lg">
            <GraduationCap aria-hidden="true" className="size-8 text-primary" />
            <span>
              <span className="font-bold">EduFinder</span>
              <span className="font-light text-on-navy-soft">Cameroon</span>
            </span>
          </p>
          <p className="mt-5 text-pretty text-sm text-on-navy-soft">
            {t('footer.tagline')}
          </p>
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="font-display text-2xl text-white">{t('footer.runSchool')}</p>
            <p className="mt-2 text-balance text-sm text-on-navy-soft">
              {t('footer.runSchoolLead')}
            </p>
            <Button as="a" href="#/login" variant="accent" className="mt-5 rounded-full">
              {t('footer.manageSchoolPage')}
            </Button>
          </div>
        </div>

        <nav aria-label={t('footer.directoryNavigation')}>
          <h2 className={COLUMN_TITLE_CLASSES}>{t('footer.schools')}</h2>
          <ul className="mt-4">
            {DIRECTORY_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={FOOTER_LINK_CLASSES}>
                  {t(link.labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {onNavigateToType && (
          <nav aria-label={t('footer.typesNavigation')}>
            <h2 className={COLUMN_TITLE_CLASSES}>{t('footer.schoolTypes')}</h2>
            <ul className="mt-4">
              {types.map((type) => (
                <li key={type.id}>
                  <button
                    type="button"
                    onClick={() => onNavigateToType(type.id)}
                    className={FOOTER_LINK_CLASSES}
                  >
                    {type.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex items-center justify-between gap-4 py-4 text-xs text-on-navy-soft">
          <p>© {currentYear} EduFinder Cameroon</p>
          <a
            href="#"
            className="flex min-h-11 items-center gap-2 rounded-control font-semibold transition-colors hover:text-white"
          >
            {t('footer.backToTop')}
            <ArrowUp aria-hidden="true" className="size-4" />
          </a>
        </Container>
      </div>
    </footer>
  )
}

export default Footer
