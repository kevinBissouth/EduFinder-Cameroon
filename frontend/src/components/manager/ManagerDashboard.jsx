import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

import {
  ChartNoAxesColumn,
  CircleCheck,
  Clock,
  Eye,
  TrendingUp,
} from 'lucide-react'

import ActivityChart from '../charts/ActivityChart'
import ChartCard from '../charts/ChartCard'
import PassRateChart from '../charts/PassRateChart'
import RankedBars from '../charts/RankedBars'
import ScrollArea from '../workspace/ScrollArea'
import StatTiles from '../workspace/StatTiles'
import BenchmarkCompare from './dashboard/BenchmarkCompare'
import SchoolBanner from './dashboard/SchoolBanner'
import SubmissionPipeline from './dashboard/SubmissionPipeline'
import { countSubmissionsByStatus } from './submissionCounts'
import { useActivity } from '../../hooks/useActivity'
import { typeSupportsExamResults } from '../../utils/establishmentType'
import { formatPercent } from '../../utils/format'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import SuspensionNotice from './SuspensionNotice'

// Un graphique n'a de sens qu'avec au moins deux points : en dessous,
// j'affiche les valeurs en clair.
const MINIMUM_CHART_POINTS = 2
// Hauteur fixe de la rangée : ses blocs s'alignent, et un contenu qui
// grandit défile à l'intérieur au lieu d'étirer le bloc.
const ROW_CLASSES = 'grid grid-cols-1 gap-6 *:h-[26rem]'

function PassRatesCard({ examResults }) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()
  const sessionCount = new Set(examResults.map((examResult) => examResult.session)).size

  return (
    <ChartCard
      icon={ChartNoAxesColumn}
      tone="blue"
      title={t('dashboard.passRatesTitle')}
      description={t('dashboard.passRatesDescription')}
      status={examResults.length === 0 ? 'empty' : 'ready'}
      emptyMessage={t('dashboard.noExamResult')}
    >
      {sessionCount < MINIMUM_CHART_POINTS ? (
        <ScrollArea label={t('dashboard.passRatesTitle')}>
          <RankedBars
            rows={examResults.map((examResult) => ({
              label: `${translateReference('exams', examResult.exam)}, ${examResult.session}`,
              value: Number(examResult.pass_rate),
            }))}
            formatValue={formatPercent}
          />
        </ScrollArea>
      ) : (
        <PassRateChart examResults={examResults} />
      )}
    </ChartCard>
  )
}

function buildTiles(detail, schoolSubmissions, onNavigate) {
  const openSubmissions = () => onNavigate('submissions')
  return [
    { icon: Eye, tone: 'harmonyBlue', label: i18next.t('manager:dashboard.visitsTotal'), value: detail.views_count },
    {
      icon: Clock,
      tone: 'harmonyBlend',
      label: i18next.t('manager:dashboard.changesAwaiting'),
      value: countSubmissionsByStatus(schoolSubmissions, 'pending'),
      onOpen: openSubmissions,
    },
    {
      icon: CircleCheck,
      tone: 'harmonyViolet',
      label: i18next.t('manager:dashboard.changesApproved'),
      value: countSubmissionsByStatus(schoolSubmissions, 'approved'),
      onOpen: openSubmissions,
    },
  ]
}

// Tableau de bord du responsable, pour l'établissement sélectionné : ce qui
// se passe sur la fiche publique, ce qu'il reste à faire, puis les chiffres.
function ManagerDashboard({
  detail,
  benchmarks,
  submissions,
  onNavigate,
  onEditSchool,
  onOpenSchool,
}) {
  const { t } = useTranslation('manager')
  const activityState = useActivity(`/my/establishments/${detail.uuid}/activity`)
  const schoolSubmissions = submissions.filter(
    (submission) => submission.establishment_uuid === detail.uuid,
  )
  const showExamResults = typeSupportsExamResults(detail.type)

  return (
    <div className="space-y-6">
      <SuspensionNotice detail={detail} />
      <SchoolBanner detail={detail} onEditSchool={onEditSchool} onOpenSchool={onOpenSchool} />
      <StatTiles tiles={buildTiles(detail, schoolSubmissions, onNavigate)} />

      <div className="h-[30rem]">
        <ActivityChart
          icon={TrendingUp}
          tone="blue"
          title={t('dashboard.activityTitle')}
          description={t('dashboard.activityDescription')}
          activityState={activityState}
        />
      </div>

      {/* Sans examens (primaire, maternelle), la comparaison occupe seule la rangée. */}
      <div className={`${ROW_CLASSES} ${showExamResults ? 'md:grid-cols-2' : ''}`}>
        {showExamResults && <PassRatesCard examResults={detail.exam_results} />}
        <BenchmarkCompare benchmarks={benchmarks} showExamResults={showExamResults} />
      </div>

      <div className="h-[26rem]">
        <SubmissionPipeline
          submissions={schoolSubmissions}
          onViewAll={() => onNavigate('submissions')}
        />
      </div>
    </div>
  )
}

export default ManagerDashboard
