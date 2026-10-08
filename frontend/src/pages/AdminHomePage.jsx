import { useCallback, useEffect, useState } from 'react'
import { Building2, ClipboardList, LayoutDashboard, Settings } from 'lucide-react'

import AdminDashboard from '../components/admin/AdminDashboard'
import AdminEstablishmentsView from '../components/admin/AdminEstablishmentsView'
import AdminSubmissionsView from '../components/admin/AdminSubmissionsView'
import SubmissionReviewModal from '../components/admin/SubmissionReviewModal'
import StateMessage from '../components/ui/StateMessage'
import AccountView from '../components/workspace/AccountView'
import Notice from '../components/workspace/Notice'
import { useToast } from '../components/workspace/toastContext'
import WorkspaceShell from '../components/workspace/WorkspaceShell'
import useFiltersMeta from '../hooks/useFiltersMeta'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { readApiErrorMessage } from '../utils/apiError'
import { authedRequest } from '../utils/auth'
import { findFirstName } from '../utils/format'
import '../i18n/privateTexts'

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'submissions', label: 'Submissions', icon: ClipboardList },
  { id: 'establishments', label: 'Schools', icon: Building2 },
  { id: 'account', label: 'Account', icon: Settings },
]
const ROLE_LABEL = 'Super administrator'
const DEFAULT_SUBMISSION_FILTER = 'pending'
const DECISION_MESSAGES = {
  approve: 'Submission approved. The manager has been notified.',
  reject: 'Submission rejected. The manager has been notified of the reason.',
}
const EMPTY_ADMIN_DATA = { pending: [], approved: [], rejected: [], establishments: [] }

// Les trois états de soumissions et tous les établissements partent en
// parallèle : le tableau de bord a besoin des quatre.
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
  const [submissionFilter, setSubmissionFilter] = useState(DEFAULT_SUBMISSION_FILTER)
  const [adminData, setAdminData] = useState(EMPTY_ADMIN_DATA)
  const [loadStatus, setLoadStatus] = useState('loading')
  const [openedSubmission, setOpenedSubmission] = useState(null)
  const [isDeciding, setIsDeciding] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const { meta } = useFiltersMeta()
  const showToast = useToast()
  const isDesktop = useIsDesktop()
  // Sur bureau, le tableau de bord montre la soumission ouverte à côté de la
  // file ; partout ailleurs elle s'ouvre en fenêtre.
  const showsInlineReview = isDesktop && activeView === 'overview'
  // Seule une soumission en attente se décide dans le panneau ; une soumission
  // déjà décidée (ouverte depuis une notification) se relit en fenêtre.
  const isReviewedInline =
    showsInlineReview && openedSubmission?.submission_status === 'pending'

  const reload = useCallback(async () => {
    try {
      setAdminData(await loadAdminData())
      setLoadStatus('ready')
    } catch {
      setLoadStatus('error')
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const openSubmission = useCallback(async (submissionUuid) => {
    setReviewError('')
    try {
      setOpenedSubmission(await authedRequest('get', `/admin/submissions/${submissionUuid}`))
    } catch (error) {
      setReviewError(readApiErrorMessage(error))
    }
  }, [])

  function closeSubmission() {
    setOpenedSubmission(null)
    setReviewError('')
  }

  async function decide(decision, requestBody) {
    setIsDeciding(true)
    setReviewError('')
    try {
      await authedRequest(
        'post',
        `/admin/submissions/${openedSubmission.submission_uuid}/${decision}`,
        requestBody,
      )
      await reload()
      closeSubmission()
      showToast({ tone: 'success', message: DECISION_MESSAGES[decision] })
    } catch (error) {
      setReviewError(readApiErrorMessage(error))
    } finally {
      setIsDeciding(false)
    }
  }

  function openNotification(notification) {
    if (notification.submission_uuid) openSubmission(notification.submission_uuid)
  }

  const reviewProps = {
    meta,
    isBusy: isDeciding,
    errorMessage: reviewError,
    onApprove: () => decide('approve'),
    onReject: (reason) => decide('reject', { reason }),
  }

  const viewRenderers = {
    overview: () => (
      <AdminDashboard
        submissionsByStatus={adminData}
        establishments={adminData.establishments}
        onNavigate={setActiveView}
        reviewDeskProps={{
          openedSubmission: isReviewedInline ? openedSubmission : null,
          isAnySubmissionOpened: openedSubmission !== null,
          showsInlineReview,
          reviewProps,
          onOpenSubmission: openSubmission,
        }}
      />
    ),
    submissions: () => (
      <AdminSubmissionsView
        submissions={[...adminData.pending, ...adminData.approved, ...adminData.rejected]}
        establishments={adminData.establishments}
        activeFilter={submissionFilter}
        onFilterChange={setSubmissionFilter}
        onOpenSubmission={openSubmission}
      />
    ),
    establishments: () => (
      <AdminEstablishmentsView establishments={adminData.establishments} onStatusChanged={reload} />
    ),
    account: () => (
      <AccountView
        profile={profile}
        roleLabel={ROLE_LABEL}
        changeHint="Accounts are managed on the server, outside this application."
        extraDetails={[
          {
            icon: Building2,
            label: 'Schools on the platform',
            value: adminData.establishments.length,
          },
        ]}
        onSignOut={onSignOut}
      />
    ),
  }

  function renderContent() {
    if (loadStatus === 'loading') {
      return (
        <p role="status" className="py-16 text-center text-sm text-ink-soft">
          Loading your workspace…
        </p>
      )
    }
    if (loadStatus === 'error') {
      return (
        <StateMessage
          icon={Building2}
          tone="danger"
          title="The workspace could not be loaded"
          description="The server did not answer. Check your connection, then try again."
          actionLabel="Try again"
          onAction={reload}
        />
      )
    }
    return viewRenderers[activeView]()
  }

  return (
    <WorkspaceShell
      navItems={NAV_ITEMS}
      activeView={activeView}
      onSelectView={setActiveView}
      title={
        activeView === 'overview'
          ? `Hello, ${findFirstName(profile.name)}`
          : NAV_ITEMS.find((navItem) => navItem.id === activeView).label
      }
      subtitle={activeView === 'overview' ? 'What is waiting for your decision.' : ''}
      profile={profile}
      roleLabel={ROLE_LABEL}
      onSignOut={onSignOut}
      onOpenNotification={openNotification}
      onOpenAccount={() => setActiveView('account')}
    >
      {reviewError && !openedSubmission && (
        <Notice tone="danger" className="mb-6">
          {reviewError}
        </Notice>
      )}
      {renderContent()}
      {openedSubmission && !isReviewedInline && (
        <SubmissionReviewModal
          key={openedSubmission.submission_uuid}
          submission={openedSubmission}
          onClose={closeSubmission}
          {...reviewProps}
        />
      )}
    </WorkspaceShell>
  )
}

export default AdminHomePage
