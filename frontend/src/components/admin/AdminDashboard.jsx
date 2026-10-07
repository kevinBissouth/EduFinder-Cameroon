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

// Hauteurs fixes des rangées : tous les blocs d'une rangée s'alignent, et une
// liste qui grandit défile dans son bloc.
const ROW_CLASSES = 'grid grid-cols-1 gap-6 xl:grid-cols-3 *:h-[26rem]'
const TALL_ROW_CLASSES = 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 *:h-[30rem]'
const CATALOGUE_STATUSES = [
  { status: 'published', label: 'Published' },
  { status: 'pending', label: 'Awaiting review' },
  { status: 'suspended', label: 'Suspended' },
  { status: 'rejected', label: 'Rejected' },
]

function buildCatalogueSegments(establishments) {
  return CATALOGUE_STATUSES.map((catalogueStatus) => ({
    label: catalogueStatus.label,
    color: findStatusTheme(catalogueStatus.status).chartColor,
    value: establishments.filter(
      (establishment) => establishment.establishment_status === catalogueStatus.status,
    ).length,
  }))
}

function SchoolsRanking({ icon, tone, title, establishments, fieldName, barClass }) {
  const rankedRows = countByField(establishments, fieldName).map((entry) => ({
    label: entry.label,
    value: entry.count,
  }))

  return (
    <ChartCard
      icon={icon}
      tone={tone}
      title={title}
      count={rankedRows.length}
      status={rankedRows.length === 0 ? 'empty' : 'ready'}
      emptyMessage="No school has been proposed yet."
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
      label: 'Submissions awaiting review',
      value: submissionsByStatus.pending.length,
      onOpen: openSubmissions,
    },
    {
      icon: CircleCheck,
      tone: 'harmonyBlend',
      label: 'Submissions approved',
      value: submissionsByStatus.approved.length,
      onOpen: openSubmissions,
    },
    {
      icon: CircleX,
      tone: 'harmonyViolet',
      label: 'Submissions rejected',
      value: submissionsByStatus.rejected.length,
      onOpen: openSubmissions,
    },
    {
      icon: Building2,
      tone: 'harmonyBright',
      label: 'Schools on the platform',
      value: establishments.length,
      onOpen: () => onNavigate('establishments'),
    },
  ]
}

// Tableau de bord du super administrateur : d'abord ce qui attend une
// décision, puis l'état de la plateforme en graphiques.
function AdminDashboard({ submissionsByStatus, establishments, reviewDeskProps, onNavigate }) {
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
          title="Submissions per week"
          description="Sent by managers over the last 12 weeks, by outcome."
          className="xl:col-span-2"
          status={allSubmissions.length === 0 ? 'empty' : 'ready'}
          emptyMessage="No submission has been received yet."
        >
          <WeeklySubmissionsChart submissions={allSubmissions} />
        </ChartCard>
        <ChartCard
          icon={PieChart}
          tone="green"
          title="Catalogue"
          description={`${unmanagedCount} schools have no manager account`}
          status={establishments.length === 0 ? 'empty' : 'ready'}
          emptyMessage="No school has been proposed yet."
        >
          <DonutChart segments={buildCatalogueSegments(establishments)} totalLabel="schools" />
        </ChartCard>
      </div>

      <div className={TALL_ROW_CLASSES}>
        <SchoolsRanking
          icon={MapPin}
          tone="blue"
          title="Schools by city"
          establishments={establishments}
          fieldName="city"
          barClass="bg-primary"
        />
        <SchoolsRanking
          icon={GraduationCap}
          tone="violet"
          title="Schools by type"
          establishments={establishments}
          fieldName="type"
          barClass="bg-violet-deep"
        />
        <ActivityChart
          icon={TrendingUp}
          tone="amber"
          title="Visits to the platform"
          description="All public school pages together."
          activityState={activityState}
          className="md:col-span-2 xl:col-span-1"
        />
      </div>
    </div>
  )
}

export default AdminDashboard
