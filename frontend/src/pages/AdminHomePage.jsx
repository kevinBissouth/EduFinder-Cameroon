import { useCallback, useEffect, useMemo, useState } from 'react'
import { Menu, Bell, Search, LogOut } from 'lucide-react'

import AdminSidebar from '../components/admin/AdminSidebar'
import AdminDashboard from '../components/admin/AdminDashboard'
import AdminSubmissionsView, {
  SubmissionDetailModal,
} from '../components/admin/AdminSubmissionsView'
import AdminEstablishmentsView from '../components/admin/AdminEstablishmentsView'
import { APP_BACKGROUND, ORBS } from '../components/admin/adminTokens'
import useFiltersMeta from '../hooks/useFiltersMeta'
import { clearAuthToken, authedRequest } from '../utils/auth'

const VIEW_TITLES = {
  overview: 'Dashboard',
  submissions: 'Submissions',
  establishments: 'Establishments',
}

// Je charge les trois états de soumissions et tous les établissements en
// parallèle, plus les libellés de référence (niveaux, pour les frais).
async function loadAdminData() {
  const [pending, approved, rejected, establishments] = await Promise.all([
    authedRequest('get', '/admin/submissions?status=pending'),
    authedRequest('get', '/admin/submissions?status=approved'),
    authedRequest('get', '/admin/submissions?status=rejected'),
    authedRequest('get', '/admin/establishments'),
  ])
  return { pending, approved, rejected, establishments }
}

function AdminHomePage({ profile, onSignOut }) {
  const [activeView, setActiveView] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [filter, setFilter] = useState('pending')
  const [data, setData] = useState({
    pending: [],
    approved: [],
    rejected: [],
    establishments: [],
  })
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [busy, setBusy] = useState(null) // null | 'approve' | 'reject'
  const [detailError, setDetailError] = useState('')
  const { meta } = useFiltersMeta()

  const reload = useCallback(async () => {
    setStatus('loading')
    try {
      setData(await loadAdminData())
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const allSubmissions = useMemo(
    () => [...data.pending, ...data.approved, ...data.rejected],
    [data],
  )

  const stats = useMemo(
    () => ({
      pending: data.pending.length,
      approved: data.approved.length,
      rejected: data.rejected.length,
      establishments: data.establishments.length,
    }),
    [data],
  )

  const levelNames = useMemo(
    () => new Map((meta?.levels ?? []).map((level) => [level.id, level.name])),
    [meta],
  )

  // Nom d'un état de soumission tel qu'attendu en filtre (liste).
  async function openDetail(submissionUuid) {
    setDetailError('')
    setDetailLoading(true)
    setDetail(null)
    // Je reprends un état propre : une action en cours sur une soumission
    // précédente ne doit jamais « fuiter » vers la suivante (bouton bloqué).
    setBusy(null)
    try {
      const fetched = await authedRequest(
        'get',
        `/admin/submissions/${submissionUuid}`,
      )
      setDetail(fetched)
    } catch (error) {
      setDetailError(
        error?.response?.data?.detail ?? 'Unable to load this submission.',
      )
    } finally {
      setDetailLoading(false)
    }
  }

  async function approve() {
    if (!detail) return
    setBusy('approve')
    setDetailError('')
    try {
      await authedRequest('post', `/admin/submissions/${detail.submission_uuid}/approve`)
      await reload()
      setBusy(null)
      setDetail(null)
    } catch (error) {
      setDetailError(error?.response?.data?.detail ?? 'Approval failed.')
      setBusy(null)
    }
  }

  async function reject(reason) {
    if (!detail) return
    setBusy('reject')
    setDetailError('')
    try {
      await authedRequest('post', `/admin/submissions/${detail.submission_uuid}/reject`, {
        reason,
      })
      await reload()
      setBusy(null)
      setDetail(null)
    } catch (error) {
      setDetailError(error?.response?.data?.detail ?? 'Rejection failed.')
      setBusy(null)
    }
  }

  async function handleSignOut() {
    try {
      await clearAuthToken()
    } catch {
      // Même si l'appel échoue, on poursuit la déconnexion locale.
    }
    onSignOut()
  }

  return (
    <div className={`flex min-h-screen overflow-x-clip ${APP_BACKGROUND}`}>
      {/* Orbes flottants en arrière-plan */}
      <div className={ORBS} aria-hidden="true">
        <span className="orb-1" />
        <span className="orb-2" />
        <span className="orb-3" />
      </div>

      <AdminSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onSignOut={handleSignOut}
        profile={profile}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Topbar « verre » : titre de page + recherche + notifications */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0f0d]/70 backdrop-blur-[10px]">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Open menu"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 backdrop-blur-[10px] transition-colors hover:bg-white/8 hover:text-white lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-[28px] font-semibold text-[#f5f5f4]">
                  {activeView === 'overview'
                    ? 'Admin Dashboard'
                    : VIEW_TITLES[activeView]}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {/* Recherche (non câblée pour l'instant). */}
              <div className="relative hidden md:block">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  disabled
                  placeholder="Search…"
                  className="w-[260px] rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-[14px] text-[#f5f5f4] placeholder:text-white/40 backdrop-blur-[10px]"
                />
              </div>

              <button
                aria-label="Notifications"
                className="relative flex h-[45px] w-[45px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 backdrop-blur-[10px] transition-colors hover:bg-white/8 hover:border-[#34d399] hover:text-white"
              >
                <Bell size={20} strokeWidth={1.8} />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#e07a5f] shadow-[0_0_10px_#e07a5f]" />
              </button>

              <button
                onClick={handleSignOut}
                className="flex h-[45px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[13px] font-medium text-white/80 backdrop-blur-[10px] transition-colors hover:bg-white/8 hover:border-[#34d399] hover:text-white"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <div className="relative flex-1 px-6 py-6">
          {status === 'loading' && (
            <p className="py-16 text-center text-sm text-white/50">Loading admin data…</p>
          )}

          {status === 'error' && (
            <div className="mx-auto mb-6 max-w-xl rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
              Unable to load admin data. Make sure the server is running, then refresh.
            </div>
          )}

          {status === 'ready' && activeView === 'overview' && (
            <AdminDashboard
              stats={stats}
              submissions={allSubmissions}
              establishments={data.establishments}
              onNavigate={setActiveView}
            />
          )}

          {status === 'ready' && activeView === 'submissions' && (
            <AdminSubmissionsView
              submissions={allSubmissions}
              filter={filter}
              onFilterChange={setFilter}
              onOpenDetail={openDetail}
            />
          )}

          {status === 'ready' && activeView === 'establishments' && (
            <AdminEstablishmentsView
              establishments={data.establishments}
              onStatusChanged={reload}
            />
          )}
        </div>
      </main>

      {detail && (
        <SubmissionDetailModal
          detail={detail}
          levelNames={levelNames}
          busy={busy}
          serverError={detailError}
          onApprove={approve}
          onReject={reject}
          onClose={() => {
            setBusy(null)
            setDetail(null)
          }}
        />
      )}
      {detailLoading && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50">
          <p className="rounded-xl border border-white/10 bg-[#0d1a14] px-5 py-3 text-sm font-medium text-white shadow-lg">
            Loading submission…
          </p>
        </div>
      )}
    </div>
  )
}

export default AdminHomePage
