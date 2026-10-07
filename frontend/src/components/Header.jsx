import { useEffect, useRef, useState } from 'react'
import { ChevronDown, GraduationCap, Menu, Scale, Search, X } from 'lucide-react'

import Button from './ui/Button'
import Container from './ui/Container'

const SECTION_LINKS = [
  { label: 'Destinations', href: '#destinations' },
  { label: 'The global picture', href: '#global-picture' },
  { label: 'How it works', href: '#how-it-works' },
]

const NAV_PILL_CLASSES =
  'flex h-11 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-on-navy-soft transition-colors hover:bg-white/10 hover:text-white'
const ICON_BUTTON_CLASSES =
  'flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white/50 hover:bg-white/10'

function Brand() {
  return (
    <a href="#" className="flex min-h-11 items-center gap-2 rounded-control text-white">
      <GraduationCap aria-hidden="true" className="size-7 text-primary" />
      <span className="text-base">
        <span className="font-bold">EduFinder</span>
        <span className="font-light text-on-navy-soft">Cameroon</span>
      </span>
    </a>
  )
}

// Raccourci affiché seulement quand au moins un établissement est coché pour
// comparaison (demande produit).
function CompareCount({ count }) {
  if (count === 0) return null

  return (
    <span className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 px-4 text-sm font-semibold text-white">
      <Scale aria-hidden="true" className="size-4" />
      {count}
      <span className="sr-only">schools selected for comparison</span>
    </span>
  )
}

function TypeMenuItem({ type, isActive, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(type.id)}
      className={`flex min-h-11 w-full cursor-pointer items-center rounded-control px-3 text-left text-sm transition-colors hover:bg-white/10 hover:text-white ${
        isActive ? 'bg-white/10 font-semibold text-white' : 'text-on-navy-soft'
      }`}
    >
      {type.name}
    </button>
  )
}

function TypeMenu({ types, activeTypeId, onSelectType }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Le menu se referme dès qu'on clique ailleurs ou qu'on appuie sur Échap,
  // comme n'importe quel menu déroulant du système.
  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  if (types.length === 0) {
    return (
      <a href="#results" className={NAV_PILL_CLASSES}>
        Find schools
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
        Find schools
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <ul className="absolute left-0 top-full z-20 mt-2 w-64 rounded-panel border border-white/10 bg-navy p-2 shadow-raised">
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
  return (
    <nav id="mobile-menu" aria-label="Main" className="border-t border-white/10 lg:hidden">
      <Container className="py-3">
        <a href="#results" className={NAV_PILL_CLASSES}>
          Find schools
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
          <a key={link.label} href={link.href} className={NAV_PILL_CLASSES}>
            {link.label}
          </a>
        ))}
        <Button as="a" href="#/login" variant="accent" className="mt-3 w-full rounded-full">
          For schools
        </Button>
      </Container>
    </nav>
  )
}

function Header({ activeTypeId, onNavigateToType, types = [], compareCount = 0, featuredTypeIds = [] }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur-md [--focus-ring:var(--color-accent)]">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-20">
        <Brand />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <TypeMenu
            types={featuredTypes}
            activeTypeId={activeTypeId}
            onSelectType={onNavigateToType}
          />
          {SECTION_LINKS.map((link) => (
            <a key={link.label} href={link.href} className={NAV_PILL_CLASSES}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CompareCount count={compareCount} />
          <a href="#search" aria-label="Search schools" className={ICON_BUTTON_CLASSES}>
            <Search aria-hidden="true" className="size-4" />
          </a>
          <div className="hidden lg:block">
            <Button as="a" href="#/login" variant="accent" className="rounded-full">
              For schools
            </Button>
          </div>
          <button
            type="button"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
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
