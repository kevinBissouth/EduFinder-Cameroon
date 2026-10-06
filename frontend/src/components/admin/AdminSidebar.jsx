import { useEffect, useRef } from 'react'
import {
  GraduationCap,
  LayoutDashboard,
  ClipboardList,
  Building2,
  LogOut,
  Check,
} from 'lucide-react'

// Barre latérale « verre » de l'espace super admin, calquée sur le template
// Glass Admin : logo dégradé émeraude->or, sections de navigation, entrée
// active avec fond translucide et coche, pied avec profil + déconnexion.
// Le tiroir mobile réutilise exactement la même structure que le desktop.

const NAV_SECTIONS = [
  {
    title: 'Main Menu',
    items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'submissions', label: 'Submissions', icon: ClipboardList },
      { id: 'establishments', label: 'Establishments', icon: Building2 },
    ],
  },
]

function initialsOf(fullName) {
  return fullName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function SidebarContent({ activeView, onNavigate, profile, onSignOut }) {
  return (
    <>
      {/* Zone logo : dégradé émeraude->or, nom + pays */}
      <div className="flex items-center gap-3 px-6 pb-6 pt-6">
        <span className="flex h-[45px] w-[45px] items-center justify-center rounded-xl bg-[linear-gradient(135deg,#059669,#d4a574)] text-white shadow-[0_8px_32px_rgba(5,150,105,0.3)]">
          <GraduationCap size={24} />
        </span>
        <span className="text-[22px] font-semibold tracking-tight text-transparent bg-[linear-gradient(135deg,#34d399,#d4a574)] bg-clip-text">
          EduFinder Admin
        </span>
      </div>

      {/* Navigation par sections */}
      <nav className="flex-1 overflow-y-auto px-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[1.5px] text-white/40">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = activeView === item.id
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-[14px] transition-colors duration-200 ${
                        isActive
                          ? 'bg-white/8 text-[#f5f5f4]'
                          : 'text-white/70 hover:bg-white/8 hover:text-[#f5f5f4]'
                      }`}
                    >
                      <Icon
                        size={22}
                        strokeWidth={2}
                        className={`shrink-0 ${isActive ? 'opacity-100' : 'opacity-80'}`}
                      />
                      <span className="flex-1 leading-tight">{item.label}</span>
                      {isActive && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#34d399] text-[#0a0f0d]">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pied : profil super admin + déconnexion */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-2 flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/8">
          <span className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[linear-gradient(135deg,#059669,#d4a574)] text-[16px] font-semibold text-white">
            {initialsOf(profile.name)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[14px] font-medium text-[#f5f5f4]">{profile.name}</p>
            <p className="text-[12px] text-white/40">Super Administrator</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[14px] font-medium text-[#ff9d8f] transition-colors hover:bg-white/8 hover:text-white"
        >
          <LogOut size={20} strokeWidth={2} />
          Logout
        </button>
      </div>
    </>
  )
}

export default function AdminSidebar({
  activeView,
  onViewChange,
  onSignOut,
  profile,
  menuOpen,
  setMenuOpen,
}) {
  const drawerRef = useRef(null)

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
    onViewChange(id)
    setMenuOpen(false)
  }

  const content = (
    <SidebarContent
      activeView={activeView}
      onNavigate={handleNavigate}
      profile={profile}
      onSignOut={onSignOut}
    />
  )

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Tiroir mobile */}
      <aside
        ref={drawerRef}
        className={`fixed bottom-0 left-0 top-0 z-50 flex w-[280px] flex-col bg-white/5 backdrop-blur-[20px] border-r border-white/10 transition-transform duration-300 lg:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>

      {/* Barre latérale desktop */}
      <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col border-r border-white/10 bg-white/5 backdrop-blur-[20px] lg:flex">
        {content}
      </aside>
    </>
  )
}
