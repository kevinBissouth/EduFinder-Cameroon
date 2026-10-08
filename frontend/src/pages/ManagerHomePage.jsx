import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  ChartNoAxesColumn,
  ClipboardList,
  LayoutDashboard,
  Settings,
  WalletCards,
  Wrench,
} from 'lucide-react'

import ProposalForm from '../components/manager/ProposalForm'
import SubmissionsList from '../components/manager/SubmissionsList'
import ManagerDashboard from '../components/manager/ManagerDashboard'
import ManagerFeesView from '../components/manager/ManagerFeesView'
import ManagerExamResultsView from '../components/manager/ManagerExamResultsView'
import ManagerServicesView from '../components/manager/ManagerServicesView'
import ManagerSchoolDetail from '../components/manager/ManagerSchoolDetail'
import SchoolList from '../components/manager/SchoolList'
import SchoolSection from '../components/manager/SchoolSection'
import SchoolSelect from '../components/manager/SchoolSelect'
import StateMessage from '../components/ui/StateMessage'
import AccountView from '../components/workspace/AccountView'
import { useToast } from '../components/workspace/toastContext'
import WorkspaceShell from '../components/workspace/WorkspaceShell'
import { useManagerData } from '../hooks/useManagerData'
import { useManagerEstablishment } from '../hooks/useManagerEstablishment'
import { readApiErrorMessage } from '../utils/apiError'
import { findFirstName } from '../utils/format'
import { authedRequest } from '../utils/auth'
import '../i18n/privateTexts'

const NAV_ITEMS = [
  { id: 'overview', labelKey: 'nav.dashboard', shortLabelKey: 'nav.home', icon: LayoutDashboard },
  { id: 'schools', labelKey: 'nav.yourSchools', shortLabelKey: 'nav.schools', icon: Building2 },
  { id: 'submissions', labelKey: 'nav.submissions', icon: ClipboardList },
  { id: 'fees', labelKey: 'nav.feesAndPayments', shortLabelKey: 'nav.fees', icon: WalletCards },
  { id: 'exam', labelKey: 'nav.examResults', shortLabelKey: 'nav.exams', icon: ChartNoAxesColumn },
  { id: 'services', labelKey: 'nav.services', icon: Wrench },
  { id: 'settings', labelKey: 'nav.account', icon: Settings },
]

// Vues atteintes par une action et non par la barre latérale.
const ACTION_VIEWS = ['school-detail', 'form-creation', 'form-modification']
const DEFAULT_ROLE = 'manager'

// Vues qui portent sur l'établissement sélectionné : elles seules affichent
// le sélecteur d'établissement.
const SCHOOL_SCOPED_VIEWS = ['overview', 'school-detail', 'fees', 'exam', 'services']

// Les libellés du menu sont traduits au moment de l'affichage : la liste
// elle-même ne porte que des clés, pour suivre un changement de langue.
function translateNavItems(t) {
  return NAV_ITEMS.map((navItem) => ({
    ...navItem,
    label: t(navItem.labelKey),
    shortLabel: navItem.shortLabelKey ? t(navItem.shortLabelKey) : undefined,
  }))
}

function findViewTitle(viewId, navItems, t) {
  const navItem = navItems.find((item) => item.id === viewId)
  if (navItem) return navItem.label
  return ACTION_VIEWS.includes(viewId) ? t(`views.${viewId}`) : ''
}

function ManagerHomePage({ profile, onSignOut }) {
  const { t } = useTranslation('manager')
  const managerData = useManagerData()
  const [activeView, setActiveView] = useState('overview')
  const [formState, setFormState] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [preparing, setPreparing] = useState(false)
  const showToast = useToast()
  const [selectedUuid, setSelectedUuid] = useState(null)
  const { detail: establishmentDetail, status: detailStatus, reload: reloadDetail } =
    useManagerEstablishment(selectedUuid)
  const [benchmarks, setBenchmarks] = useState(null)

  // Repères de marché (frais / taux de réussite vs moyenne du même type) :
  // chargés pour l'établissement sélectionné, sans bloquer le reste de la vue.
  useEffect(() => {
    if (!selectedUuid) return undefined
    let cancelled = false
    // Les repères de l'établissement précédent ne doivent pas rester affichés.
    setBenchmarks(null)
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

  async function handleEditSchool(school) {
    setPreparing(true)
    setServerError('')
    const establishmentUuid = school.establishment_uuid ?? school.uuid
    const baseSchool = {
      establishment_uuid: establishmentUuid,
      name: school.name,
      establishment_status: school.establishment_status ?? school.status,
    }
    try {
      // Je pré-charge le détail de l'établissement pour pré-remplir le
      // formulaire de modification (frais, services, programmes actuels) :
      // l'envoi d'une liste vide signifiera « tout retirer ».
      const detail = await authedRequest('get', `/my/establishments/${establishmentUuid}`)
      openModificationForm({ ...baseSchool, detail })
    } catch {
      // En cas d'échec du détail, j'ouvre quand même le formulaire, sans
      // pré-remplissage : mieux vaut un formulaire vierge qu'une page bloquée.
      openModificationForm(baseSchool)
    } finally {
      setPreparing(false)
    }
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
      showToast({
        tone: 'success',
        message:
          submittedMode === 'creation'
            ? t('page.proposalSent')
            : t('page.changesSent'),
      })
    } catch (error) {
      setServerError(readApiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const roleLabel = t(`roles.${profile.role}`, { defaultValue: t(`roles.${DEFAULT_ROLE}`) })
  const navItems = translateNavItems(t)
  const isOverview = activeView === 'overview'
  const isSchoolScopedView = SCHOOL_SCOPED_VIEWS.includes(activeView)
  const schoolSelectProps = {
    establishments: managerData.establishments,
    selectedUuid,
    onSelectSchool: setSelectedUuid,
  }

  // Une proposition envoyée change à la fois la fiche (marquée en attente)
  // et la liste des soumissions.
  const refreshAfterProposal = () => {
    reloadDetail()
    managerData.refresh()
  }

  const schoolDetailView = (
    <ManagerSchoolDetail
      detail={establishmentDetail}
      detailStatus={detailStatus}
      benchmarks={benchmarks}
      paymentMethods={managerData.meta.payment_methods ?? []}
      onRetry={reloadDetail}
      onEditSchool={handleEditSchool}
      onProposalSubmitted={refreshAfterProposal}
    />
  )
  const schoolSectionProps = {
    establishments: managerData.establishments,
    detail: establishmentDetail,
    detailStatus,
    onRetry: reloadDetail,
    onProposalSubmitted: refreshAfterProposal,
  }

  function renderSchoolsView() {
    if (managerData.establishments.length === 0) {
      return (
        <StateMessage
          icon={Building2}
          title={t('page.noSchoolTitle')}
          description={t('page.noSchoolDescription')}
          actionLabel={t('actions.proposeSchool')}
          onAction={openCreationForm}
        />
      )
    }
    // Avec une seule fiche, la liste n'apporte rien : j'ouvre directement le détail.
    if (managerData.establishments.length === 1) return schoolDetailView

    return (
      <SchoolList
        establishments={managerData.establishments}
        onOpenSchool={navigateToDetail}
        onProposeModification={handleEditSchool}
        onCreateProposal={openCreationForm}
      />
    )
  }

  // Une décision sur une soumission mène à l'historique des soumissions ; une
  // suspension ou une réactivation mène à la fiche concernée.
  function openNotification(notification) {
    if (notification.submission_uuid) {
      setActiveView('submissions')
      return
    }
    navigateToDetail(notification.establishment_uuid)
  }

  const viewRenderers = {
    overview: () => (
      <SchoolSection {...schoolSectionProps}>
        {(detail) => (
          <ManagerDashboard
            key={detail.uuid}
            detail={detail}
            benchmarks={benchmarks}
            submissions={managerData.submissions}
            onNavigate={setActiveView}
            onEditSchool={handleEditSchool}
            onOpenSchool={navigateToDetail}
          />
        )}
      </SchoolSection>
    ),
    'school-detail': () => schoolDetailView,
    schools: renderSchoolsView,
    submissions: () => (
      <SubmissionsList
        submissions={managerData.submissions}
        establishments={managerData.establishments}
        meta={managerData.meta}
      />
    ),
    fees: () => (
      <ManagerFeesView
        {...schoolSectionProps}
        paymentMethods={managerData.meta.payment_methods ?? []}
      />
    ),
    exam: () => <ManagerExamResultsView {...schoolSectionProps} />,
    services: () => <ManagerServicesView {...schoolSectionProps} />,
    settings: () => (
      <AccountView
        profile={profile}
        roleLabel={roleLabel}
        changeHint={t('page.changeHint')}
        extraDetails={[
          {
            icon: Building2,
            label: t('page.schoolsYouManage'),
            value: managerData.establishments.length,
          },
        ]}
        onSignOut={onSignOut}
      />
    ),
    'form-creation': renderProposalForm,
    'form-modification': renderProposalForm,
  }

  function renderProposalForm() {
    if (!formState) return null

    return (
      <ProposalForm
        mode={formState.mode}
        school={formState.school}
        meta={managerData.meta}
        submitting={submitting}
        serverError={serverError}
        onSubmit={handleFormSubmit}
        onClose={closeForm}
      />
    )
  }

  function renderContent() {
    if (managerData.status === 'loading') {
      return (
        <p role="status" className="py-16 text-center text-sm text-ink-soft">
          {t('page.loadingWorkspace')}
        </p>
      )
    }
    if (managerData.status === 'error') {
      return (
        <StateMessage
          icon={Building2}
          tone="danger"
          title={t('page.workspaceErrorTitle')}
          description={t('page.serverError')}
          actionLabel={t('workspace:retry')}
          onAction={managerData.refresh}
        />
      )
    }
    return viewRenderers[activeView]()
  }

  return (
    <WorkspaceShell
      navItems={navItems}
      activeView={activeView}
      onSelectView={setActiveView}
      title={
        isOverview
          ? t('page.hello', { name: findFirstName(profile.name) })
          : findViewTitle(activeView, navItems, t)
      }
      subtitle={isOverview ? t('page.subtitle') : ''}
      toolbar={
        isSchoolScopedView && (
          <SchoolSelect {...schoolSelectProps} className="hidden w-64 md:block" />
        )
      }
      profile={profile}
      roleLabel={roleLabel}
      onSignOut={onSignOut}
      onOpenNotification={openNotification}
      onOpenAccount={() => setActiveView('settings')}
    >
      {/* Sur téléphone, la fiche détaillée commence par sa photo, collée à la
          barre du haut : le sélecteur n'y apparaît pas. On change
          d'établissement depuis « Schools » ou le tableau de bord. */}
      {isSchoolScopedView && activeView !== 'school-detail' && (
        <SchoolSelect {...schoolSelectProps} className="mb-6 md:hidden" />
      )}
      {renderContent()}
      {preparing && (
        <div
          role="status"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
        >
          <p className="rounded-control bg-surface px-5 py-3 text-sm font-semibold text-navy shadow-raised">
            {t('page.loadingSchoolDetails')}
          </p>
        </div>
      )}
    </WorkspaceShell>
  )
}

export default ManagerHomePage
