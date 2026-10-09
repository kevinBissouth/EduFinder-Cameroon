import { useCallback, useEffect, useState } from 'react'
import { Building2, ClipboardList, LayoutDashboard, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const NAV_ITEMS = [
  {
    id: 'overview',
    labelKey: 'nav.dashboard',
    shortLabelKey: 'manager:nav.home',
    icon: LayoutDashboard,
  },
  { id: 'submissions', labelKey: 'nav.submissions', icon: ClipboardList },
  {
    id: 'establishments',
    labelKey: 'nav.schools',
    shortLabelKey: 'manager:nav.schools',
    icon: Building2,
  },
  { id: 'account', labelKey: 'nav.account', icon: Settings },
]
const DEFAULT_SUBMISSION_FILTER = 'pending'
const DECISION_MESSAGE_KEYS = { approve: 'page.approved', reject: 'page.rejected' }
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
  const { t } = useTranslation('admin')
  useDocumentTitle()
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
      showToast({ tone: 'success', message: t(DECISION_MESSAGE_KEYS[decision]) })
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
        roleLabel={t('role')}
        changeHint={t('page.changeHint')}
        extraDetails={[
          {
            icon: Building2,
            label: t('page.schoolsOnPlatform'),
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
          {t('manager:page.loadingWorkspace')}
        </p>
      )
    }
    if (loadStatus === 'error') {
      return (
        <StateMessage
          icon={Building2}
          tone="danger"
          title={t('page.errorTitle')}
          description={t('manager:page.serverError')}
          actionLabel={t('workspace:retry')}
          onAction={reload}
        />
      )
    }
    return viewRenderers[activeView]()
  }

  // Le menu ne porte que des clés : ses libellés suivent la langue affichée.
  // Le libellé court sert dans le rail et la barre d'onglets, trop étroits
  // pour « Tableau de bord » ou « Établissements ».
  const navItems = NAV_ITEMS.map((navItem) => ({
    ...navItem,
    label: t(navItem.labelKey),
    shortLabel: navItem.shortLabelKey ? t(navItem.shortLabelKey) : undefined,
  }))

  return (
    <WorkspaceShell
      navItems={navItems}
      activeView={activeView}
      onSelectView={setActiveView}
      title={
        activeView === 'overview'
          ? t('manager:page.hello', { name: findFirstName(profile.name) })
          : navItems.find((navItem) => navItem.id === activeView).label
      }
      subtitle={activeView === 'overview' ? t('page.subtitle') : ''}
      profile={profile}
      roleLabel={t('role')}
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
