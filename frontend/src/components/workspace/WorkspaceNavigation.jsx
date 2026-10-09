import { useRef, useState } from 'react'
import { Ellipsis, Globe, GraduationCap, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useDismiss } from '../../hooks/useDismiss'
import { HOME_PATH } from '../../routes'

const TAB_COUNT = 4
const MORE_TAB_ID = 'more'
const ROUND_BUTTON_CLASSES = 'flex items-center justify-center rounded-full'
// Bouton rond de l'entrée active du rail : en dégradé, sur le bleu nuit.
const RAIL_ACTIVE_BUTTON_CLASSES = `${ROUND_BUTTON_CLASSES} bg-linear-to-br from-primary to-violet-deep text-white shadow-glow`
// Celui de la barre du bas est blanc, pour ressortir sur la barre en
// dégradé, avec une couronne de lumière.
const TAB_ACTIVE_BUTTON_CLASSES = `${ROUND_BUTTON_CLASSES} bg-surface text-primary-deep shadow-halo`

function findShortLabel(navItem) {
  return navItem.shortLabel ?? navItem.label
}

// --- Rail latéral (bureau) -----------------------------------------------------

// Encoche creusée dans le bord droit du rail : une cuvette de la couleur du
// fond de page, dans laquelle se loge le bouton de l'entrée active.
function RailNotch() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 34 84"
      className="absolute right-0 top-1/2 h-21 w-8.5 -translate-y-1/2 fill-paper"
    >
      <path d="M34 0 C34 16 0 16 0 42 C0 68 34 68 34 84 Z" />
    </svg>
  )
}

function RailItem({ navItem, isActive, onSelect }) {
  const Icon = navItem.icon

  if (isActive) {
    return (
      <button
        type="button"
        aria-current="page"
        onClick={() => onSelect(navItem.id)}
        className="relative flex h-21 w-full cursor-pointer items-center pl-3 pr-10 text-left text-xs font-bold text-white"
      >
        <RailNotch />
        {/* Le bouton déborde du rail vers le contenu, logé dans l'encoche. */}
        <span
          className={`${RAIL_ACTIVE_BUTTON_CLASSES} absolute -right-5 top-1/2 size-12 -translate-y-1/2`}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
        {findShortLabel(navItem)}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(navItem.id)}
      className="flex h-21 w-full cursor-pointer flex-col items-center justify-center gap-1 px-1 text-center text-xs font-medium text-on-navy-soft transition-colors hover:text-white"
    >
      <Icon aria-hidden="true" className="size-5" />
      {findShortLabel(navItem)}
    </button>
  )
}

// Rail latéral du bureau. L'entrée active est un bouton rond qui déborde du
// rail, dans une encoche courbe ; les autres restent à plat. Toutes ont la
// même hauteur, pour qu'aucune ne se déplace quand on change de vue. Le rail ne coupe
// pas ce qui dépasse, sinon le bouton serait rogné. Sa largeur laisse la
// place du plus long libellé (« Submissions ») à gauche de l'encoche.
export function WorkspaceRail({ navItems, activeView, onSelectView, onSignOut }) {
  const { t } = useTranslation('workspace')

  return (
    <aside className="sticky top-0 z-40 hidden h-screen w-32 shrink-0 flex-col bg-navy [--focus-ring:var(--color-accent)] lg:flex">
      {/* Retour au site des visiteurs, sans se déconnecter : la session reste
          ouverte et « Mon espace » y ramène. Le libellé sous le logo le dit ;
          placé ici, il n'allonge pas le rail sur un écran peu haut. */}
      <a
        href={HOME_PATH}
        aria-label={t('backToPublicSite')}
        className="flex h-20 flex-col items-center justify-center gap-0.5 text-xs font-medium text-on-navy-soft transition-colors hover:text-white"
      >
        <GraduationCap aria-hidden="true" className="size-8 text-primary" />
        {t('publicSite')}
      </a>
      <nav aria-label={t('navigation')} className="flex-1">
        <ul>
          {navItems.map((navItem) => (
            <li key={navItem.id}>
              <RailItem
                navItem={navItem}
                isActive={navItem.id === activeView}
                onSelect={onSelectView}
              />
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-white/10">
        <button
          type="button"
          onClick={onSignOut}
          className="flex h-16 w-full cursor-pointer flex-col items-center justify-center gap-1 text-xs font-medium text-on-navy-soft transition-colors hover:text-white"
        >
          <LogOut aria-hidden="true" className="size-5" />
          {t('signOut')}
        </button>
      </div>
    </aside>
  )
}

// --- Barre d'onglets (téléphone) ------------------------------------------------

// La découpe n'est jamais plus large qu'un onglet sur le plus petit écran
// visé (320 px, cinq onglets), sinon elle mordrait sur le bord de l'écran.
const NOTCH_WIDTH_PX = 64
// Dégradé vertical de la barre, du bleu vif vers le violet de la marque.
// Il est vertical exprès : les trois morceaux de la barre le dessinent chacun
// de leur côté, et seul un dégradé vertical se raccorde sans couture. Le
// mode srgb aligne le calcul du CSS sur celui du SVG de la découpe.
const BAR_FILL_CLASSES = 'bg-linear-to-b/srgb from-primary to-violet-deep'
const BAR_GRADIENT_ID = 'tab-bar-fill'
const PERCENT = 100

// Fond de la barre, en trois morceaux : un pan, la pièce découpée en courbe
// sous l'onglet actif, puis un pan. La découpe est un vrai vide : la page
// se voit à travers. Changer d'onglet fait glisser la pièce découpée.
function BarSurface({ activeCenterPercent }) {
  if (activeCenterPercent === null) {
    return (
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-16 drop-shadow-bar ${BAR_FILL_CLASSES}`}
      />
    )
  }

  return (
    <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-16 drop-shadow-bar">
      <div
        className={`shrink-0 transition-[flex-basis] duration-300 ${BAR_FILL_CLASSES}`}
        style={{ flexBasis: `calc(${activeCenterPercent}% - ${NOTCH_WIDTH_PX / 2}px)` }}
      />
      {/* Les marges négatives évitent un filet d'un pixel entre les morceaux. */}
      <svg viewBox="0 0 64 64" className="-mx-px h-16 w-16.5 shrink-0">
        <defs>
          <linearGradient id={BAR_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="var(--color-violet-deep)" />
          </linearGradient>
        </defs>
        <path d="M0 0 C13 0 9 31 32 31 C55 31 51 0 64 0 V64 H0 Z" fill={`url(#${BAR_GRADIENT_ID})`} />
      </svg>
      <div className={`flex-1 ${BAR_FILL_CLASSES}`} />
    </div>
  )
}

// Bouton rond de l'onglet actif : centré sur le bord supérieur de la barre,
// moitié au-dessus, moitié dans la découpe, il glisse avec elle. Purement visuel : le vrai bouton est l'onglet.
function FloatingActiveButton({ icon: Icon, activeCenterPercent }) {
  return (
    <span
      aria-hidden="true"
      className={`${TAB_ACTIVE_BUTTON_CLASSES} pointer-events-none absolute -top-5.5 size-11 -translate-x-1/2 transition-[left] duration-300`}
      style={{ left: `${activeCenterPercent}%` }}
    >
      <Icon className="size-5" />
    </span>
  )
}

function Tab({ icon: Icon, label, isActive, ...buttonProps }) {
  return (
    <li className="flex flex-1">
      <button
        type="button"
        {...buttonProps}
        className={`relative flex h-16 flex-1 cursor-pointer flex-col items-center justify-end pb-2 text-xs text-white ${
          isActive ? 'font-bold' : 'font-medium'
        }`}
      >
        {!isActive && (
          <Icon aria-hidden="true" className="absolute left-1/2 top-3 size-5 -translate-x-1/2" />
        )}
        {label}
      </button>
    </li>
  )
}

// Sur téléphone, l'accueil (la première entrée) se place au milieu de la
// barre, sous le pouce ; le rail du bureau garde l'ordre d'origine. Le calcul
// compte l'onglet « More », toujours en dernier.
function moveHomeToCentre(tabItems) {
  const [homeItem, ...otherItems] = tabItems
  const centreIndex = Math.floor(tabItems.length / 2)
  return [...otherItems.slice(0, centreIndex), homeItem, ...otherItems.slice(centreIndex)]
}

function MoreSheet({ navItems, activeView, onSelect, onSignOut }) {
  const { t } = useTranslation('workspace')
  const sheetItemClasses =
    'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control px-3 text-left text-sm font-medium'

  return (
    <div className="absolute inset-x-2 bottom-full mb-8 rounded-panel border border-line bg-surface p-2 shadow-raised [--focus-ring:var(--color-primary)]">
      <ul>
        {navItems.map((navItem) => {
          const Icon = navItem.icon
          const isActive = navItem.id === activeView
          return (
            <li key={navItem.id}>
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelect(navItem.id)}
                className={`${sheetItemClasses} ${
                  isActive ? 'bg-primary-soft text-primary-deep' : 'text-navy hover:bg-muted'
                }`}
              >
                <Icon aria-hidden="true" className="size-5" />
                {navItem.label}
              </button>
            </li>
          )
        })}
        <li className="mt-1 border-t border-line pt-1">
          <a href={HOME_PATH} className={`${sheetItemClasses} text-navy hover:bg-muted`}>
            <Globe aria-hidden="true" className="size-5" />
            {t('publicSite')}
          </a>
        </li>
        <li>
          <button
            type="button"
            onClick={onSignOut}
            className={`${sheetItemClasses} text-navy hover:bg-muted`}
          >
            <LogOut aria-hidden="true" className="size-5" />
            {t('signOut')}
          </button>
        </li>
      </ul>
    </div>
  )
}

// Barre d'onglets du téléphone, à portée de pouce. L'onglet actif est un
// bouton rond surélevé dans une encoche de la barre. Les premières entrées
// sont des onglets ; les suivantes et la déconnexion passent sous « More »,
// qui se surélève à son tour quand la vue ouverte en fait partie.
export function WorkspaceTabBar({ navItems, activeView, onSelectView, onSignOut }) {
  const { t } = useTranslation('workspace')
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const barRef = useRef(null)
  useDismiss(barRef, isMoreOpen, () => setIsMoreOpen(false))

  const tabItems = moveHomeToCentre(navItems.slice(0, TAB_COUNT))
  const moreItems = navItems.slice(TAB_COUNT)
  const isMoreActive = moreItems.some((navItem) => navItem.id === activeView)

  const selectFromSheet = (viewId) => {
    onSelectView(viewId)
    setIsMoreOpen(false)
  }

  const tabs = [
    ...tabItems.map((navItem) => ({ ...navItem, isActive: navItem.id === activeView })),
    { id: MORE_TAB_ID, icon: Ellipsis, isActive: isMoreActive },
  ]
  const activeTabIndex = tabs.findIndex((tab) => tab.isActive)
  // Centre de l'onglet actif, en pourcentage de la largeur de la barre ; null
  // quand la vue ouverte n'est pas dans la navigation : la barre reste plate.
  const activeCenterPercent =
    activeTabIndex === -1 ? null : ((activeTabIndex + 0.5) / tabs.length) * PERCENT

  return (
    <nav
      ref={barRef}
      aria-label={t('navigation')}
      className="fixed inset-x-0 bottom-0 z-40 [--focus-ring:var(--color-accent)] lg:hidden"
    >
      {isMoreOpen && (
        <MoreSheet
          navItems={moreItems}
          activeView={activeView}
          onSelect={selectFromSheet}
          onSignOut={onSignOut}
        />
      )}
      <BarSurface activeCenterPercent={activeCenterPercent} />
      {activeCenterPercent !== null && (
        <FloatingActiveButton
          icon={tabs[activeTabIndex].icon}
          activeCenterPercent={activeCenterPercent}
        />
      )}
      <ul className="relative flex">
        {tabItems.map((navItem) => (
          <Tab
            key={navItem.id}
            icon={navItem.icon}
            label={findShortLabel(navItem)}
            isActive={navItem.id === activeView}
            aria-current={navItem.id === activeView ? 'page' : undefined}
            onClick={() => onSelectView(navItem.id)}
          />
        ))}
        <Tab
          icon={Ellipsis}
          label={t('more')}
          isActive={isMoreActive}
          aria-expanded={isMoreOpen}
          onClick={() => setIsMoreOpen(!isMoreOpen)}
        />
      </ul>
      {/* Sur les téléphones à barre de gestes, la barre se prolonge jusqu'en bas. */}
      <div className="relative h-[env(safe-area-inset-bottom)] bg-violet-deep" />
    </nav>
  )
}
