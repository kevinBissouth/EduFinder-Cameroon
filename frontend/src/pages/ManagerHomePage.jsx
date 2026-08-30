import { useEffect, useState } from 'react'
import { Bell, Menu, LogOut } from 'lucide-react'

import ProposalForm from '../components/manager/ProposalForm'
import SubmissionsList from '../components/manager/SubmissionsList'
import ManagerDashboard from '../components/manager/ManagerDashboard'
import ManagerFeesView from '../components/manager/ManagerFeesView'
import ManagerExamResultsView from '../components/manager/ManagerExamResultsView'
import ManagerServicesView from '../components/manager/ManagerServicesView'
import ManagerSchoolDetail from '../components/manager/ManagerSchoolDetail'
import ManagerSidebar from '../components/manager/ManagerSidebar'
import ManagerKpiCards from '../components/manager/ManagerKpiCards'
import SchoolList from '../components/manager/SchoolList'
import { useManagerData } from '../hooks/useManagerData'
import { useManagerEstablishment } from '../hooks/useManagerEstablishment'
import { clearAuthToken, authedRequest } from '../utils/auth'

const VIEW_TITLES = {
  overview: 'Dashboard',
  'school-detail': 'My school',
  schools: 'My Establishments',
  submissions: 'Submissions',
  fees: 'Fees & Payments',
  exam: 'Exam Results',
  services: 'Services',
  'form-creation': 'New proposal',
  'form-modification': 'Modify school',
  settings: 'Settings',
}

function initialsOf(fullName) {
  return fullName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function firstNameOf(fullName) {
  return fullName ? fullName.trim().split(/\s+/)[0] : ''
}

function ManagerHomePage({ profile, onSignOut }) {
  const managerData = useManagerData()
  const [activeView, setActiveView] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [formState, setFormState] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedUuid, setSelectedUuid] = useState(null)
  const { detail: establishmentDetail, status: detailStatus, reload: reloadDetail } =
    useManagerEstablishment(selectedUuid)
  const [benchmarks, setBenchmarks] = useState(null)

  // Repères de marché (frais / taux de réussite vs moyenne du même type) :
  // chargés pour l'établissement sélectionné, sans bloquer le reste de la vue.
  useEffect(() => {
    if (!selectedUuid) return undefined
    let cancelled = false
    authedRequest('get', `/my/establishments/${selectedUuid}/benchmarks`)
      .then((data) => {
        if (!cancelled) setBenchmarks(data)
      })
      .catch(() => {
        if (!cancelled) setBenchmarks(null)
      })
    return () => {
      cancelled = true
    }
  }, [selectedUuid])

  // Par défaut, on pilote le premier établissement géré (cas le plus courant :
  // un responsable = une école). Le sélecteur apparaît s'il en gère plusieurs.
  useEffect(() => {
    if (!selectedUuid && managerData.establishments.length > 0) {
      setSelectedUuid(managerData.establishments[0].establishment_uuid)
    }
  }, [selectedUuid, managerData.establishments])

  function handleEditSchool(school) {
    openModificationForm({
      establishment_uuid: school.uuid,
      name: school.name,
      establishment_status: school.status,
    })
  }

  function openCreationForm() {
    setServerError('')
    setFormState({ mode: 'creation', school: null })
    setActiveView('form-creation')
  }

  function openModificationForm(school) {
    setServerError('')
    setFormState({ mode: 'modification', school })
    setActiveView('form-modification')
  }

  function navigateToDetail(uuid) {
    setSelectedUuid(uuid)
    setActiveView('school-detail')
  }

  function closeForm() {
    setFormState(null)
    setServerError('')
    setActiveView('overview')
  }

  async function handleFormSubmit(payload) {
    setSubmitting(true)
    setServerError('')
    try {
      if (formState.mode === 'creation') {
        await managerData.submitCreationProposal(payload)
      } else {
        await managerData.submitModificationProposal(
          formState.school.establishment_uuid,
          payload,
        )
      }
      const submittedMode = formState.mode
      closeForm()
      reloadDetail()
      setActiveView(submittedMode === 'creation' ? 'submissions' : 'overview')
      setSuccessMessage(
        submittedMode === 'creation'
          ? 'Proposal submitted — an administrator will review it shortly.'
          : 'Modification submitted for review.',
      )
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (error) {
      setServerError(managerData.extractServerErrorMessage(error))
    } finally {
      setSubmitting(false)
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

  const isFormView = activeView === 'form-creation' || activeView === 'form-modification'
  const examSessionCount = establishmentDetail?.exam_results?.length ?? 0
  const roleLabel = profile.role === 'super_admin' ? 'Administrator' : 'Manager'

  return (
    <div className="flex min-h-screen overflow-x-clip bg-white">
      <ManagerSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onSignOut={handleSignOut}
        onOpenSettings={() => setActiveView('settings')}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* En-tête sombre : salutation + contrôles de compte (maquette). */}
        <header className="relative h-[64px] shrink-0 bg-[linear-gradient(90deg,#0a3d2c_0%,#0d7a4f_52%,#06221b_100%)] shadow-[0_3px_0_rgba(46,194,126,0.75)]">
          <div className="flex h-full items-center justify-between gap-4 px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Open menu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/20 text-white transition-colors hover:bg-white/10 lg:hidden"
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-display text-[18px] font-bold leading-tight text-white">
                  {activeView === 'overview'
                    ? `Welcome back, ${firstNameOf(profile.name)}!`
                    : VIEW_TITLES[activeView] ?? 'Dashboard'}
                </h1>
                <p className="truncate text-[12px] text-[rgba(251,240,211,0.85)]">
                  {activeView === 'overview'
                    ? "Here's what's happening with your establishments."
                    : ''}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {/* Notifications */}
              <button
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
              >
                <Bell size={18} strokeWidth={1.8} />
              </button>

              {/* Avatar + nom + badge de rôle + séparateur + déconnexion */}
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#d9a406] bg-[#0d7a4f] text-[13px] font-bold text-white">
                    {initialsOf(profile.name)}
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[13px] font-semibold text-white">
                      {profile.name}
                    </span>
                    <span className="mt-0.5 inline-block rounded-[999px] bg-[linear-gradient(135deg,#d9a406,#c29105)] px-2.5 py-0.5 text-[10px] font-bold text-white">
                      {roleLabel}
                    </span>
                  </span>
                </div>

                <span className="hidden h-7 w-px bg-white/25 sm:block" />

                <button
                  onClick={handleSignOut}
                  className="hidden items-center gap-1.5 text-[12px] font-semibold text-[rgba(251,240,211,0.85)] transition-colors hover:text-white sm:flex"
                >
                  <LogOut size={16} strokeWidth={1.8} /> Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <div className="flex-1 px-6 pb-8 pt-5">
          {successMessage && (
            <div className="mb-6 rounded-xl border border-[#0d7a4f]/25 bg-[#e5f3ec] px-4 py-3 text-sm font-medium text-[#0a5e3d]">
              {successMessage}
            </div>
          )}

          {managerData.status === 'error' && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to load your data. Make sure the server is running, then refresh.
            </div>
          )}

          {/* ═══════════ VUE DASHBOARD ═══════════ */}
          {activeView === 'overview' && managerData.status === 'ready' && (
            <ManagerDashboard
              establishments={managerData.establishments}
              onViewDetail={navigateToDetail}
              onViewSubmissions={() => setActiveView('submissions')}
              onCreateProposal={openCreationForm}
              submissions={managerData.submissions}
              examSessionCount={examSessionCount}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'overview' && managerData.status === 'loading' && (
            <p className="py-10 text-center text-sm text-[#8a90a0]">Loading your dashboard…</p>
          )}

          {/* Les 4 cartes KPI du dashboard, identiques dans chaque section
              (données réelles : établissements, soumissions et sessions). */}
          {['schools', 'submissions', 'fees', 'exam', 'services'].includes(activeView) &&
            managerData.status === 'ready' && (
              <div className="mb-[18px]">
                <ManagerKpiCards
                  establishments={managerData.establishments}
                  submissions={managerData.submissions}
                  examSessionCount={examSessionCount}
                  onNavigate={setActiveView}
                />
              </div>
            )}

          {/* ═══════════ VUE FICHE DÉTAILLÉE « MY SCHOOL » ═══════════ */}
          {activeView === 'school-detail' && managerData.status === 'ready' && (
            <ManagerSchoolDetail
              detail={establishmentDetail}
              detailStatus={detailStatus}
              benchmarks={benchmarks}
              onBack={() => setActiveView('overview')}
              onEditSchool={handleEditSchool}
              reloadDetail={reloadDetail}
            />
          )}

          {/* ═══════════ VUE FICHES / DÉTAIL ÉTABLISSEMENT ═══════════ */}
          {activeView === 'schools' && managerData.status === 'ready' && (
            managerData.establishments.length >= 2 ? (
              <SchoolList
                establishments={managerData.establishments}
                loading={managerData.status === 'loading'}
                onOpenSchool={navigateToDetail}
                onProposeModification={openModificationForm}
              />
            ) : managerData.establishments.length === 1 ? (
              <ManagerSchoolDetail
                detail={establishmentDetail}
                detailStatus={detailStatus}
                benchmarks={benchmarks}
                onBack={() => setActiveView('overview')}
                onEditSchool={handleEditSchool}
                reloadDetail={reloadDetail}
              />
            ) : (
              <div className="rounded-xl border border-[#dcebe3] bg-white px-6 py-10 text-center text-sm text-[#6e6e6e]">
                You don't manage any school yet.
              </div>
            )
          )}

          {/* ═══════════ VUE SOUMISSIONS ═══════════ */}
          {activeView === 'submissions' &&
            (managerData.status === 'loading' ? (
              <p className="py-6 text-sm text-[#8a90a0]">Loading submissions…</p>
            ) : (
              <SubmissionsList submissions={managerData.submissions} meta={managerData.meta} />
            ))}

          {/* ═══════════ VUE FEES & PAYMENTS (autonome, sans redirection) ═══════════ */}
          {activeView === 'fees' && managerData.status === 'ready' && (
            <ManagerFeesView
              establishments={managerData.establishments}
              selectedUuid={selectedUuid}
              onSelectSchool={setSelectedUuid}
              detail={establishmentDetail}
              detailStatus={detailStatus}
              reloadDetail={reloadDetail}
              paymentMethods={managerData.meta.payment_methods ?? []}
            />
          )}

          {activeView === 'fees' && managerData.status === 'loading' && (
            <p className="py-6 text-sm text-[#8a90a0]">Loading fees…</p>
          )}

          {/* ═══════════ VUE EXAMEN RESULTS (autonome, sans redirection) ═══════════ */}
          {activeView === 'exam' && managerData.status === 'ready' && (
            <ManagerExamResultsView
              establishments={managerData.establishments}
              selectedUuid={selectedUuid}
              onSelectSchool={setSelectedUuid}
              detail={establishmentDetail}
              detailStatus={detailStatus}
              reloadDetail={reloadDetail}
            />
          )}

          {activeView === 'exam' && managerData.status === 'loading' && (
            <p className="py-6 text-sm text-[#8a90a0]">Loading exam results…</p>
          )}

          {activeView === 'services' && managerData.status === 'ready' && (
            <ManagerServicesView
              establishments={managerData.establishments}
              selectedUuid={selectedUuid}
              onSelectSchool={setSelectedUuid}
              detail={establishmentDetail}
              detailStatus={detailStatus}
              reloadDetail={reloadDetail}
            />
          )}

          {activeView === 'services' && managerData.status === 'loading' && (
            <p className="py-6 text-sm text-[#8a90a0]">Loading services…</p>
          )}

          {/* ═══════════ VUE PARAMÈTRES ═══════════ */}
          {activeView === 'settings' && (
            <section className="rounded-[20px] border border-[#e7ece9] bg-white p-6">
              <h2 className="font-display mb-1 text-lg font-bold text-[#081220]">Settings</h2>
              <p className="mb-5 text-sm text-[#8a90a0]">
                Manage your account and communication preferences.
              </p>
              <div className="space-y-4">
                {[
                  { title: 'Profile', desc: 'Name and contact information', value: profile.name },
                  { title: 'Email', desc: 'Where review updates are sent', value: profile.email },
                  {
                    title: 'Role',
                    desc: 'Your level of access on EduFinder',
                    value: roleLabel,
                  },
                ].map((field) => (
                  <div
                    key={field.title}
                    className="flex items-center justify-between rounded-lg border border-[#eef1f8] p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#081220]">{field.title}</p>
                      <p className="text-xs text-[#8a90a0]">{field.desc}</p>
                    </div>
                    <span className="text-sm font-medium text-[#0d7a4f]">{field.value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ═══════════ VUE FORMULAIRE (pleine page) ═══════════ */}
          {isFormView && formState && (
            <ProposalForm
              mode={formState.mode}
              school={formState.school}
              meta={managerData.meta}
              submitting={submitting}
              serverError={serverError}
              onSubmit={handleFormSubmit}
              onClose={closeForm}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default ManagerHomePage
