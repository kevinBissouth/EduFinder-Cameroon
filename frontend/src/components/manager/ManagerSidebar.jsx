import { useEffect, useRef } from 'react'
import {
  GraduationCap,
  LayoutDashboard,
  Building2,
  ClipboardList,
  WalletCards,
  ChartNoAxesColumn,
  Wrench,
  Settings,
  Check,
  LogOut,
} from 'lucide-react'

// Barre latérale sombre (dégradé vert soutenu) de l'espace responsable.
// Reconstruite fidèlement d'après la maquette : logo, navigation exacte,
// élément actif avec liseré vert clair, compteurs et pied (paramètres /
// repli / déconnexion). Le tiroir mobile réutilise la même structure.

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'schools', label: 'My Establishments', icon: Building2 },
  { id: 'submissions', label: 'Submissions', icon: ClipboardList },
  { id: 'fees', label: 'Fees & Payments', icon: WalletCards },
  { id: 'exam', label: 'Exam Results', icon: ChartNoAxesColumn },
  { id: 'services', label: 'Services', icon: Wrench },
]

// Liens latéraux n'ayant pas encore de vue dédiée : on les achemine vers la
// liste des établissements (l'endroit où leur contenu est géré).
const UNWIRED_NAV_IDS = new Set()

export default function ManagerSidebar({
  activeView,
  onViewChange,
  onSignOut,
  onOpenSettings,
  menuOpen,
  setMenuOpen,
}) {
  const drawerRef = useRef(null)

  // Fermeture du tiroir au clic extérieur et à la touche Échap.
  useEffect(() => {
    if (!menuOpen) return undefined
    function handleClick(event) {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen, setMenuOpen])

  function handleNavigate(id) {
    // Les entrées sans vue dédiée s'ouvrent sur la liste des établissements.
    onViewChange(UNWIRED_NAV_IDS.has(id) ? 'schools' : id)
    setMenuOpen(false)
  }

  const sidebarContent = (
    <>
      {/* Zone logo : icône éducation + nom (blanc) / pays (doré). */}
      <div className="flex flex-col items-center gap-2 px-6 pb-6 pt-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d7a4f] text-[#d9a406] shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
          <GraduationCap size={22} />
        </span>
        <span className="leading-none">
          <span className="block text-center text-[18px] font-bold tracking-tight text-white">
            EduFinder
          </span>
          <span className="mt-0.5 block text-center text-[9px] font-bold uppercase tracking-[0.22em] text-[#d9a406]">
            Cameroon
          </span>
        </span>
      </div>

      {/* Navigation principale */}
      {/* La liste remplit toute la hauteur du nav : les entrées sont réparties
          équitablement (justify-between) pour combler le vide vertical et
          rester sans repère quand le contenu dépasse (scroll). */}
      <nav className="flex-1 overflow-y-auto px-2.5">
        <ul className="flex h-full flex-col justify-between gap-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigate(item.id)}
                  className={`relative flex h-11 w-full items-center gap-3 px-5 text-left text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'border-l-[3px] border-[#2ec27e] bg-[linear-gradient(90deg,#0d7a4f_0%,rgba(13,122,79,0.72)_100%)] font-semibold text-white'
                      : 'border-l-[3px] border-transparent text-[#dbe8e2] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={17} strokeWidth={1.8} className="shrink-0" />
                  <span className="flex-1 truncate leading-tight">{item.label}</span>
                  {isActive && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d7efdd] text-[#0a5e3d]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Pied : paramètres, déconnexion */}
      <div className="border-t border-white/10 px-2.5 py-3">
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => {
                onOpenSettings()
                setMenuOpen(false)
              }}
              className={`flex h-11 w-full items-center gap-3 px-5 text-left text-[13px] font-medium ${
                activeView === 'settings'
                  ? 'border-l-[3px] border-[#2ec27e] bg-[linear-gradient(90deg,#0d7a4f_0%,rgba(13,122,79,0.72)_100%)] font-semibold text-white'
                  : 'border-l-[3px] border-transparent text-[#dbe8e2] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings size={17} strokeWidth={1.8} className="shrink-0" />
              <span className="leading-tight">Settings</span>
            </button>
          </li>
          <li>
            <button
              onClick={onSignOut}
              className="flex h-11 w-full items-center gap-3 px-5 text-left text-[13px] font-medium text-[#f2a08f] transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut size={17} strokeWidth={1.8} className="shrink-0" />
              <span className="leading-tight">Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </>
  )

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Tiroir mobile */}
      <aside
        ref={drawerRef}
        className={`fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col bg-[linear-gradient(180deg,#0a3d2c_0%,#06221b_100%)] shadow-[4px_0_28px_rgba(0,0,0,0.4)] transition-transform duration-300 lg:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Barre latérale desktop */}
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col bg-[linear-gradient(180deg,#0a3d2c_0%,#06221b_100%)] lg:flex">
        {sidebarContent}
      </aside>
    </>
  )
}
