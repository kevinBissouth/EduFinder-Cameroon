import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

import {
  Building2,
  ChartColumn,
  CircleCheck,
  CircleX,
  Clock,
  GraduationCap,
  MapPin,
  PieChart,
  TrendingUp,
} from 'lucide-react'

import ActivityChart from '../charts/ActivityChart'
import ChartCard from '../charts/ChartCard'
import { countByField } from '../charts/chartData'
import DonutChart from '../charts/DonutChart'
import RankedBars from '../charts/RankedBars'
import WeeklySubmissionsChart from '../charts/WeeklySubmissionsChart'
import ScrollArea from '../workspace/ScrollArea'
import StatTiles from '../workspace/StatTiles'
import { findStatusTheme } from '../workspace/statusTheme'
import ReviewDesk from './ReviewDesk'
import { useActivity } from '../../hooks/useActivity'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'

// Hauteurs fixes des rangées : tous les blocs d'une rangée s'alignent, et une
// liste qui grandit défile dans son bloc.
const ROW_CLASSES = 'grid grid-cols-1 gap-6 xl:grid-cols-3 *:h-[26rem]'
const TALL_ROW_CLASSES = 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 *:h-[30rem]'
const CATALOGUE_STATUSES = [
  { status: 'published', labelKey: 'admin:dashboard.published' },
  { status: 'pending', labelKey: 'admin:dashboard.pending' },
  { status: 'suspended', labelKey: 'admin:dashboard.suspended' },
  { status: 'rejected', labelKey: 'admin:dashboard.rejected' },
]

function buildCatalogueSegments(establishments) {
  return CATALOGUE_STATUSES.map((catalogueStatus) => ({
    label: i18next.t(catalogueStatus.labelKey),
    color: findStatusTheme(catalogueStatus.status).chartColor,
    value: establishments.filter(
      (establishment) => establishment.establishment_status === catalogueStatus.status,
    ).length,
  }))
}

// referenceKind : la liste de référence du champ, quand ses valeurs se traduisent.
function SchoolsRanking({ icon, tone, title, establishments, fieldName, referenceKind, barClass }) {
  const { t } = useTranslation('admin')
  const translateReference = useReferenceLabel()
  const rankedRows = countByField(establishments, fieldName).map((entry) => ({
    label: referenceKind ? translateReference(referenceKind, entry.label) : entry.label,
    value: entry.count,
  }))

  return (
    <ChartCard
      icon={icon}
      tone={tone}
      title={title}
      count={rankedRows.length}
      status={rankedRows.length === 0 ? 'empty' : 'ready'}
      emptyMessage={t('dashboard.noSchool')}
    >
      <ScrollArea label={title}>
        <RankedBars rows={rankedRows} barClass={barClass} />
      </ScrollArea>
    </ChartCard>
  )
}

function buildTiles(submissionsByStatus, establishments, onNavigate) {
  const openSubmissions = () => onNavigate('submissions')
  return [
    {
      icon: Clock,
      tone: 'harmonyBlue',
      label: i18next.t('admin:dashboard.submissionsAwaiting'),
      value: submissionsByStatus.pending.length,
      onOpen: openSubmissions,
    },
    {
      icon: CircleCheck,
      tone: 'harmonyBlend',
      label: i18next.t('admin:dashboard.submissionsApproved'),
      value: submissionsByStatus.approved.length,
      onOpen: openSubmissions,
    },
    {
      icon: CircleX,
      tone: 'harmonyViolet',
      label: i18next.t('admin:dashboard.submissionsRejected'),
      value: submissionsByStatus.rejected.length,
      onOpen: openSubmissions,
    },
    {
      icon: Building2,
      tone: 'harmonyBright',
      label: i18next.t('admin:page.schoolsOnPlatform'),
      value: establishments.length,
      onOpen: () => onNavigate('establishments'),
    },
  ]
}

// Tableau de bord du super administrateur : d'abord ce qui attend une
// décision, puis l'état de la plateforme en graphiques.
function AdminDashboard({ submissionsByStatus, establishments, reviewDeskProps, onNavigate }) {
  const { t } = useTranslation('admin')
  const activityState = useActivity('/admin/activity')
  const { pending, approved, rejected } = submissionsByStatus
  const allSubmissions = [...pending, ...approved, ...rejected]
  const unmanagedCount = establishments.filter(
    (establishment) => establishment.owners.length === 0,
  ).length

  return (
    <div className="space-y-6">
      <StatTiles tiles={buildTiles(submissionsByStatus, establishments, onNavigate)} />
      <ReviewDesk pendingSubmissions={pending} {...reviewDeskProps} />

      <div className={ROW_CLASSES}>
        <ChartCard
          icon={ChartColumn}
          tone="blue"
          title={t('dashboard.weeklyTitle')}
          description={t('dashboard.weeklyDescription')}
          className="xl:col-span-2"
          status={allSubmissions.length === 0 ? 'empty' : 'ready'}
          emptyMessage={t('dashboard.noSubmission')}
        >
          <WeeklySubmissionsChart submissions={allSubmissions} />
        </ChartCard>
        <ChartCard
          icon={PieChart}
          tone="green"
          title={t('dashboard.catalogue')}
          description={t('dashboard.unmanaged', { count: unmanagedCount })}
          status={establishments.length === 0 ? 'empty' : 'ready'}
          emptyMessage={t('dashboard.noSchool')}
        >
          <DonutChart segments={buildCatalogueSegments(establishments)} totalLabel={t('dashboard.schoolsLabel', { count: establishments.length })} />
        </ChartCard>
      </div>

      <div className={TALL_ROW_CLASSES}>
        <SchoolsRanking
          icon={MapPin}
          tone="blue"
          title={t('dashboard.byCity')}
          establishments={establishments}
          fieldName="city"
          barClass="bg-primary"
        />
        <SchoolsRanking
          icon={GraduationCap}
          tone="violet"
          title={t('dashboard.byType')}
          establishments={establishments}
          fieldName="type"
          referenceKind="types"
          barClass="bg-violet-deep"
        />
        <ActivityChart
          icon={TrendingUp}
          tone="amber"
          title={t('dashboard.visitsTitle')}
          description={t('dashboard.visitsDescription')}
          activityState={activityState}
          className="md:col-span-2 xl:col-span-1"
        />
      </div>
    </div>
  )
}

export default AdminDashboard
