import { useEffect, useState } from 'react'
import { ChevronDown, GraduationCap, Heart, Menu, Scale, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from './ui/Button'
import Container from './ui/Container'
import LanguageSwitch from './ui/LanguageSwitch'
import { useDismissibleMenu } from '../hooks/useDismissibleMenu'
import { useReferenceLabel } from '../hooks/useReferenceLabel'
import { useSchoolSelection } from '../hooks/useSchoolSelection'
import { buildComparisonPath } from '../utils/comparison'
import { HOME_PATH, LOGIN_PATH, SAVED_SCHOOLS_PATH, SEARCH_RESULTS_PATH } from '../routes'

const SECTION_LINKS = [
  { labelKey: 'header.destinations', href: '/#destinations' },
  { labelKey: 'header.globalPicture', href: '/#global-picture', isWideScreenOnly: true },
  { labelKey: 'header.howItWorks', href: '/#how-it-works', isWideScreenOnly: true },
]

const NAV_PILL_CLASSES =
  'flex h-11 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-medium text-on-navy-soft transition-colors hover:bg-white/10 hover:text-white'
const ICON_BUTTON_CLASSES =
  'flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white/50 hover:bg-white/10'

function Brand() {
  return (
    <a href={HOME_PATH} className="flex min-h-11 items-center gap-2 rounded-control text-white">
      <GraduationCap aria-hidden="true" className="size-7 text-primary" />
      <span className="text-base">
        <span className="font-bold">EduFinder</span>
        <span className="font-light text-on-navy-soft">Cameroon</span>
      </span>
    </a>
  )
}


// La barre ne descend qu'une fois, à l'ouverture du site : chaque page a sa
// propre barre, et la rejouer à chaque changement de page lasserait vite.
let hasHeaderEntered = false

// Pastille de l'en-tête vers une liste du visiteur, avec son nombre. Le nom
// de la liste reste lisible par les lecteurs d'écran et au survol.
function CountedLink({ href, icon: Icon, label, count }) {
  return (
    <a href={href} aria-label={label} title={label} className={`${ICON_BUTTON_CLASSES} relative`}>
      <Icon aria-hidden="true" className="size-4" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-navy tabular-nums"
        >
          {count}
        </span>
      )}
    </a>
  )
}

// Le lien est toujours là, même vide : on découvre ainsi que la comparaison
// existe avant d'avoir sélectionné quoi que ce soit.
function ComparisonLink() {
  const { t } = useTranslation()
  const { comparedIds } = useSchoolSelection()
  const selectedLabel =
    comparedIds.length > 0 ? `, ${t('compare:bar.selected', { count: comparedIds.length })}` : ''

  return (
    <CountedLink
      href={buildComparisonPath(comparedIds)}
      icon={Scale}
      label={`${t('compare:header.compare')}${selectedLabel}`}
      count={comparedIds.length}
    />
  )
}

function SavedSchoolsLink() {
  const { t } = useTranslation()
  const { savedIds } = useSchoolSelection()

  return (
    <CountedLink
      href={SAVED_SCHOOLS_PATH}
      icon={Heart}
      label={t('compare:saved.count', { count: savedIds.length })}
      count={savedIds.length}
    />
  )
}

// Dans le menu du téléphone, les deux listes sont des lignes de texte comme
// les autres liens : deux pastilles sans nom n'y disaient rien.
function MobileListLinks() {
  const { t } = useTranslation()
  const { comparedIds, savedIds } = useSchoolSelection()
  const listLinks = [
    {
      href: buildComparisonPath(comparedIds),
      icon: Scale,
      label: t('compare:header.compareTotal', { total: comparedIds.length }),
    },
    {
      href: SAVED_SCHOOLS_PATH,
      icon: Heart,
      label: t('compare:header.savedTotal', { total: savedIds.length }),
    },
  ]

  return listLinks.map(({ href, icon: Icon, label }) => (
    <a key={href} href={href} className={NAV_PILL_CLASSES}>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {label}
    </a>
  ))
}

function TypeMenuItem({ type, isActive, onSelect }) {
  const translateReference = useReferenceLabel()

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(type.id)}
      className={`flex min-h-11 w-full cursor-pointer items-center rounded-control px-3 text-left text-sm transition-colors hover:bg-white/10 hover:text-white ${
        isActive ? 'bg-white/10 font-semibold text-white' : 'text-on-navy-soft'
      }`}
    >
      {translateReference('types', type.name)}
    </button>
  )
}

function TypeMenu({ types, activeTypeId, onSelectType }) {
  const { t } = useTranslation()
  const { isOpen, setIsOpen, menuRef } = useDismissibleMenu()

  if (types.length === 0) {
    return (
      <a href={SEARCH_RESULTS_PATH} className={NAV_PILL_CLASSES}>
        {t('header.findSchools')}
      </a>
    )
  }

  const selectType = (typeId) => {
    onSelectType(typeId)
    setIsOpen(false)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={NAV_PILL_CLASSES}
      >
        {t('header.findSchools')}
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <ul className="absolute left-0 top-full z-20 mt-2 w-64 animate-menu-drop rounded-panel border border-white/10 bg-navy p-2 shadow-raised">
          {types.map((type) => (
            <li key={type.id}>
              <TypeMenuItem
                type={type}
                isActive={String(type.id) === String(activeTypeId)}
                onSelect={selectType}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MobileMenu({ types, activeTypeId, onSelectType }) {
  const { t } = useTranslation()

  return (
    <nav
      id="mobile-menu"
      aria-label={t('header.mainNavigation')}
      className="animate-menu-drop border-t border-white/10 lg:hidden"
    >
      <Container className="py-3">
        <a href={SEARCH_RESULTS_PATH} className={NAV_PILL_CLASSES}>
          {t('header.findSchools')}
        </a>
        {types.length > 0 && (
          <ul className="ml-3 border-l border-white/10 pl-2">
            {types.map((type) => (
              <li key={type.id}>
                <TypeMenuItem
                  type={type}
                  isActive={String(type.id) === String(activeTypeId)}
                  onSelect={onSelectType}
                />
              </li>
            ))}
          </ul>
        )}
        {SECTION_LINKS.map((link) => (
          <a key={link.href} href={link.href} className={NAV_PILL_CLASSES}>
            {t(link.labelKey)}
          </a>
        ))}
        <MobileListLinks />
        <div className="mt-3 sm:hidden">
          <LanguageSwitch menuAlign="start" />
        </div>
        <Button as="a" href={LOGIN_PATH} variant="accent" className="mt-3 w-full rounded-full">
          {t('header.forSchools')}
        </Button>
      </Container>
    </nav>
  )
}

function Header({ activeTypeId, onNavigateToType, types = [], featuredTypeIds = [] }) {
  const { t } = useTranslation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isFirstAppearance] = useState(() => !hasHeaderEntered)

  useEffect(() => {
    hasHeaderEntered = true
  }, [])

  // Le menu ne propose que les types les plus représentés, dans l'ordre fourni
  // par l'API : aucun identifiant de référence n'est figé côté interface.
  // Sans onNavigateToType (fiche d'établissement), la page ne sait pas
  // filtrer : le menu des types reste alors vide et ne s'affiche pas.
  const featuredTypes = onNavigateToType
    ? featuredTypeIds.map((typeId) => types.find((type) => type.id === typeId)).filter(Boolean)
    : []

  const selectTypeFromMobileMenu = (typeId) => {
    onNavigateToType(typeId)
    setIsMobileMenuOpen(false)
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/10 bg-navy/95 pt-[env(safe-area-inset-top)] backdrop-blur-md [--focus-ring:var(--color-accent)] [view-transition-name:site-header] ${
        isFirstAppearance ? 'animate-header-drop' : ''
      }`}
    >
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-20">
        <Brand />

        <nav aria-label={t('header.mainNavigation')} className="hidden items-center gap-1 lg:flex">
          <TypeMenu
            types={featuredTypes}
            activeTypeId={activeTypeId}
            onSelectType={onNavigateToType}
          />
          {/* En français les libellés sont longs : entre 1024 et 1280 px les
              deux derniers liens cèdent leur place (ils restent dans le pied
              de page). */}
          {SECTION_LINKS.map((link) => (
            <div key={link.href} className={link.isWideScreenOnly ? 'hidden xl:block' : ''}>
              <a href={link.href} className={NAV_PILL_CLASSES}>
                {t(link.labelKey)}
              </a>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* La barre est étroite : la comparaison n'y entre qu'à partir de
              1366 px (la barre du bas y mène de toute façon), et sur bureau
              les favoris prennent la place de la loupe, la recherche étant
              déjà en haut de la page d'accueil. */}
          <div className="hidden min-[1366px]:block">
            <ComparisonLink />
          </div>
          <div className="hidden lg:block">
            <SavedSchoolsLink />
          </div>
          {/* Sous 640 px la barre n'a plus la place : le sélecteur passe dans le menu. */}
          <div className="hidden sm:block">
            <LanguageSwitch />
          </div>
          <a
            href="/#search"
            aria-label={t('header.searchSchools')}
            className={`${ICON_BUTTON_CLASSES} lg:hidden`}
          >
            <Search aria-hidden="true" className="size-4" />
          </a>
          <div className="hidden lg:block">
            <Button as="a" href={LOGIN_PATH} variant="accent" className="whitespace-nowrap rounded-full">
              {t('header.forSchools')}
            </Button>
          </div>
          <button
            type="button"
            aria-label={isMobileMenuOpen ? t('header.closeMenu') : t('header.openMenu')}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`${ICON_BUTTON_CLASSES} lg:hidden`}
          >
            {isMobileMenuOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </Container>

      {isMobileMenuOpen && (
        <MobileMenu
          types={featuredTypes}
          activeTypeId={activeTypeId}
          onSelectType={selectTypeFromMobileMenu}
        />
      )}
    </header>
  )
}

export default Header
