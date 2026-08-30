import { useState } from 'react'

import { NAV_ITEMS } from '../constants'
import { ChevronDownIcon, GradCapIcon, ScaleIcon } from './icons'

function Header({ activeTypeId, onNavigateToType, types = [], compareCount = 0, featuredTypeIds = [] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)

  // Le menu « Explore » est alimenté par les types renvoyés par l'API
  // (meta.types), filtrés selon featuredTypeIds dérivé de la base — aucun
  // identifiant de référence n'est figé côté front.
  const exploreItems = featuredTypeIds
    .map((typeId) => types.find((type) => type.id === typeId))
    .filter(Boolean)
    .map((type) => ({ label: type.name, typeId: type.id }))
  const navItems = NAV_ITEMS.map((item) =>
    item.label === 'Explore' ? { ...item, items: exploreItems } : item,
  )

  const isSubActive = (sub) =>
    sub.typeId && String(sub.typeId) === String(activeTypeId)

  const handleSubClick = (sub) => {
    if (sub.typeId) {
      onNavigateToType(sub.typeId)
      setOpenDropdown(null)
      setMenuOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#0a3d2c] via-[#0d7a4f] to-[#0a5e3d] shadow-[0_4px_24px_rgba(8,18,32,0.10)]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-2.5">
          <div className="rounded-lg bg-gradient-to-br from-[#0d7a4f] to-[#d9a406] p-2 text-white">
            <GradCapIcon />
          </div>
          <div className="leading-tight">
            <span className="font-display text-lg font-bold text-white">EduFinder</span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-[#dcebe3]/70">Cameroon</span>
          </div>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <div key={item.label} className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  item.label === 'Home' ? 'text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <a
                  href={item.href}
                  onClick={(event) => event.stopPropagation()}
                  className={item.label === 'Home' ? 'text-white' : ''}
                >
                  {item.label}
                </a>
                {item.items && (
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 ${
                      openDropdown === item.label ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {item.items && openDropdown === item.label && (
                <div className="dropdown-panel absolute left-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#0e4a36] p-2 shadow-[0_22px_54px_rgba(8,18,32,0.4)]">
                  {item.items.map((sub) =>
                    sub.typeId ? (
                      <button
                        key={sub.label}
                        onClick={() => handleSubClick(sub)}
                        className={`block w-full rounded-lg px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-white/10 ${
                          isSubActive(sub) ? 'bg-white/10 font-semibold text-white' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ) : (
                      <a
                        key={sub.label}
                        href={sub.href}
                        className="block rounded-lg px-3.5 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        {sub.label}
                      </a>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {/* Compteur de comparaison : visible seulement si au moins une école
              est sélectionnée (demande produit). */}
          {compareCount > 0 && (
            <button
              type="button"
              title="Schools selected for comparison"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f2c14e] px-3.5 py-2 text-sm font-bold text-[#081220] shadow-[0_0_18px_rgba(242,193,78,0.45)] transition-transform hover:scale-105"
            >
              <ScaleIcon className="h-4 w-4" />
              {compareCount}
              <span className="sr-only">schools selected for comparison</span>
            </button>
          )}
          <a
            href="#/login"
            className="rounded-full border border-white/30 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Sign in
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {compareCount > 0 && (
            <span
              title="Schools selected for comparison"
              className="flex h-10 min-w-10 items-center justify-center gap-1 rounded-full bg-[#f2c14e] px-3 text-sm font-bold text-[#081220]"
            >
              <ScaleIcon className="h-4 w-4" />
              {compareCount}
            </span>
          )}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen ? <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="menu-slide border-t border-white/10 bg-[#0a3d2c] px-6 py-4 lg:hidden">
          {navItems.map((item) => (
            <div key={item.label}>
              <a href={item.href} className={`block py-2.5 text-sm ${item.label === 'Home' ? 'font-semibold text-white' : 'text-white/70'}`}>
                {item.label}
              </a>
              {item.items && (
                <div className="ml-4 space-y-1 pb-1">
                  {item.items.map((sub) =>
                    sub.typeId ? (
                      <button
                        key={sub.label}
                        onClick={() => handleSubClick(sub)}
                        className={`block py-1.5 text-left text-sm transition-colors hover:text-white ${
                          isSubActive(sub) ? 'font-semibold text-white' : 'text-white/50'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ) : (
                      <a key={sub.label} href={sub.href} className="block py-1.5 text-sm text-white/50 hover:text-white">
                        {sub.label}
                      </a>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
          <a
            href="#/login"
            className="mt-3 inline-block rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Sign in
          </a>
        </div>
      )}
    </header>
  )
}

export default Header