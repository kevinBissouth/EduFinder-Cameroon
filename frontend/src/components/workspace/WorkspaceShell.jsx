import NotificationBell from './NotificationBell'
import { WorkspaceRail, WorkspaceTabBar } from './WorkspaceNavigation'
import { useNotifications } from '../../hooks/useNotifications'
import { buildInitials } from '../../utils/format'

const AVATAR_CLASSES =
  'flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-violet-deep text-sm font-bold text-white shadow-soft ring-2 ring-surface lg:bg-navy lg:bg-none lg:shadow-none lg:ring-0'

// Pastille aux initiales du compte. Quand l'espace a une vue « compte », la
// pastille est un bouton qui l'ouvre ; sinon c'est un simple repère.
function Avatar({ fullName, onOpenAccount }) {
  if (!onOpenAccount) {
    return (
      <span aria-hidden="true" className={AVATAR_CLASSES}>
        {buildInitials(fullName)}
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-label="Open your account"
      onClick={onOpenAccount}
      className={`${AVATAR_CLASSES} cursor-pointer transition-transform hover:scale-105`}
    >
      {buildInitials(fullName)}
    </button>
  )
}

// Sur téléphone et tablette, la pastille passe à gauche du titre, comme une
// photo de profil ; sur bureau elle reste à droite, avec le nom et le rôle.
function AccountBadge({ profile, roleLabel, onOpenAccount }) {
  return (
    <div className="order-first flex items-center gap-3 lg:order-last">
      <span className="hidden text-right lg:block">
        <span className="block text-sm font-semibold text-navy">{profile.name}</span>
        <span className="block text-xs text-ink-soft">{roleLabel}</span>
      </span>
      <Avatar fullName={profile.name} onOpenAccount={onOpenAccount} />
    </div>
  )
}

// Coquille des deux espaces privés : rail (bureau) ou barre d'onglets
// (téléphone), barre du haut avec la cloche et le compte, puis le contenu.
function WorkspaceShell({
  navItems,
  activeView,
  onSelectView,
  title,
  subtitle,
  toolbar,
  profile,
  roleLabel,
  onSignOut,
  onOpenNotification,
  onOpenAccount,
  children,
}) {
  const inbox = useNotifications()
  const navigationProps = { navItems, activeView, onSelectView, onSignOut }

  return (
    <div className="flex min-h-screen bg-paper font-sans text-ink">
      <WorkspaceRail {...navigationProps} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sous lg, l'en-tête est une bande teintée aux coins bas arrondis ; sur
            bureau il reste la barre blanche d'origine. En application installée
            sur un téléphone à encoche, il laisse la place de la barre d'état. */}
        <header className="sticky top-0 z-30 rounded-b-panel bg-linear-to-b from-primary-soft to-surface pt-[env(safe-area-inset-top)] shadow-soft lg:rounded-none lg:border-b lg:border-line lg:bg-surface/95 lg:bg-none lg:shadow-none lg:backdrop-blur-md">
          <div className="flex min-h-18 items-center gap-3 px-4 py-3 sm:px-6 lg:min-h-20 lg:px-8 lg:py-2">
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-2xl leading-display text-navy">{title}</h1>
              {subtitle && <p className="truncate text-xs text-ink sm:text-sm">{subtitle}</p>}
            </div>
            {toolbar}
            <NotificationBell inbox={inbox} onOpenNotification={onOpenNotification} />
            <AccountBadge profile={profile} roleLabel={roleLabel} onOpenAccount={onOpenAccount} />
          </div>
        </header>
        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
      <WorkspaceTabBar {...navigationProps} />
    </div>
  )
}

export default WorkspaceShell
