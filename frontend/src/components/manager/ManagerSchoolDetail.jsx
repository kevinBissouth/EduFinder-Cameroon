import { useTranslation } from 'react-i18next'

import {
  Building2,
  ChartNoAxesColumn,
  FileText,
  GraduationCap,
  Images,
  Phone,
  Scale,
  UserRound,
  WalletCards,
  Wrench,
} from 'lucide-react'

import ExamResultsChart from '../school-profile/ExamResultsChart'
import StateMessage from '../ui/StateMessage'
import OverflowList from '../workspace/OverflowList'
import Panel from '../workspace/Panel'
import ManagerFeesSection from './ManagerFeesSection'
import { BenchmarkComparisons } from './dashboard/BenchmarkCompare'
import { describeBenchmarkSample } from './dashboard/benchmarkText'
import { InlineField } from './ManagerShared'
import SchoolDetailHero from './SchoolDetailHero'
import SchoolGallery from './SchoolGallery'
import SchoolLeadership from './SchoolLeadership'
import { useModificationProposal } from '../../hooks/useModificationProposal'
import { typeSupportsExamResults, typeSupportsPrograms } from '../../utils/establishmentType'
import { toExternalUrl } from '../school-profile/helpers'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import SuspensionNotice from './SuspensionNotice'

const GALLERY_NARROW_GRID = 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-2'
const GALLERY_WIDE_GRID = 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5'

const TAGS_SHOWN_WHEN_COLLAPSED = 8

function TagList({ title, tags, emptyMessage }) {
  if (tags.length === 0) return <p className="text-sm text-ink-soft">{emptyMessage}</p>

  return (
    <OverflowList
      items={tags}
      collapsedCount={TAGS_SHOWN_WHEN_COLLAPSED}
      title={title}
      renderItems={(shownTags) => (
        <ul className="flex flex-wrap gap-2">
          {shownTags.map((tag) => (
            <li key={tag} className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-navy">
              {tag}
            </li>
          ))}
        </ul>
      )}
    />
  )
}

// Sur grand écran, les blocs sont rangés deux par deux : un bloc large à
// gauche, un bloc étroit à droite, de même hauteur. Chaque bloc porte sa
// place dans la grille ; l'ordre du code reste l'ordre d'affichage sur
// téléphone, où tout s'empile sur une colonne.
const WIDE_CELL = 'h-full xl:col-span-2 xl:col-start-1'
const NARROW_CELL = 'h-full xl:col-start-3'
const FULL_ROW_CELL = 'h-full xl:col-span-3 xl:col-start-1'
const ROW_CLASSES = ['xl:row-start-1', 'xl:row-start-2', 'xl:row-start-3', 'xl:row-start-4']

function placeCell(cellClasses, rowIndex) {
  return `${cellClasses} ${ROW_CLASSES[rowIndex]}`
}

function ComparePanel({ benchmarks, showExamResults, className }) {
  const { t } = useTranslation('manager')

  return (
    <Panel
      icon={Scale}
      tone="violet"
      title={t('detail.compare')}
      description={benchmarks ? describeBenchmarkSample(benchmarks) : ''}
      className={className}
    >
      {benchmarks ? (
        <BenchmarkComparisons benchmarks={benchmarks} showExamResults={showExamResults} />
      ) : (
        <p role="status" className="text-sm text-ink-soft">
          {t('detail.loadingComparison')}
        </p>
      )}
    </Panel>
  )
}

function SchoolDetailContent({
  detail,
  benchmarks,
  paymentMethods,
  onEditSchool,
  onProposalSubmitted,
}) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()
  const proposal = useModificationProposal(detail.uuid, onProposalSubmitted)
  const showExamResults = typeSupportsExamResults(detail.type)
  const submitField = (fieldName) => (fieldValue) =>
    proposal.submitProposal({ [fieldName]: fieldValue })
  const inlineFieldProps = { isSubmitting: proposal.isSubmitting }
  const hasExamChart = showExamResults && detail.exam_results.length > 0

  return (
    <div className="space-y-6">
      <SuspensionNotice detail={detail} />
      <SchoolDetailHero detail={detail} onEditSchool={onEditSchool} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel
          icon={FileText}
          tone="blue"
          title={t('detail.about')}
          className={placeCell(WIDE_CELL, 0)}
        >
          <InlineField
            {...inlineFieldProps}
            label={t('detail.description')}
            value={detail.description}
            isMultiline
            onSubmit={submitField('description')}
          />
        </Panel>

        <Panel
          icon={UserRound}
          tone="violet"
          title={t('detail.headOfSchool')}
          className={placeCell(WIDE_CELL, 1)}
        >
          <SchoolLeadership detail={detail} onProposalSubmitted={onProposalSubmitted} />
        </Panel>

        <Panel
          icon={WalletCards}
          tone="green"
          title={t('fees.title')}
          description={t('fees.panelDescription')}
          className={placeCell(WIDE_CELL, 2)}
        >
          <ManagerFeesSection
            fees={detail.fees}
            establishmentUuid={detail.uuid}
            paymentMethods={paymentMethods}
            isCompact
            onProposalSubmitted={onProposalSubmitted}
          />
        </Panel>

        {hasExamChart && (
          <Panel
            icon={ChartNoAxesColumn}
            tone="blue"
            title={t('detail.examResults')}
            className={placeCell(WIDE_CELL, 3)}
          >
            <ExamResultsChart examResults={detail.exam_results} />
          </Panel>
        )}

        {/* Sans graphique d'examens à côté d'elle, la galerie prend toute la rangée. */}
        <Panel
          icon={Images}
          tone="amber"
          title={t('detail.media')}
          description={t('detail.mediaDescription')}
          className={placeCell(hasExamChart ? NARROW_CELL : FULL_ROW_CELL, 3)}
        >
          <SchoolGallery
            establishmentUuid={detail.uuid}
            schoolName={detail.name}
            media={detail.media}
            gridClassName={hasExamChart ? GALLERY_NARROW_GRID : GALLERY_WIDE_GRID}
            onProposalSubmitted={onProposalSubmitted}
          />
        </Panel>

        <Panel icon={Phone} tone="blue" title={t('detail.contact')} className={placeCell(NARROW_CELL, 0)}>
          <div className="divide-y divide-line">
            <InlineField
              {...inlineFieldProps}
              label={t('detail.phone')}
              value={detail.phone}
              onSubmit={submitField('phone')}
            />
            <InlineField
              {...inlineFieldProps}
              label={t('detail.email')}
              value={detail.contact_email}
              onSubmit={submitField('contact_email')}
            />
            <InlineField
              {...inlineFieldProps}
              label={t('detail.website')}
              value={detail.website}
              href={toExternalUrl(detail.website)}
              onSubmit={submitField('website')}
            />
            <InlineField
              {...inlineFieldProps}
              label={t('detail.address')}
              value={detail.address}
              onSubmit={submitField('address')}
            />
          </div>
        </Panel>

        {/* Services et programmes se partagent la hauteur du bloc voisin. */}
        <div className={`flex flex-col gap-6 ${placeCell(NARROW_CELL, 1)}`}>
          <Panel icon={Wrench} tone="violet" title={t('detail.services')} className="flex-1">
            <TagList
              title={t('detail.services')}
              tags={detail.services.map((service) => service.name)}
              emptyMessage={t('detail.noService')}
            />
          </Panel>
          {typeSupportsPrograms(detail.type) && (
            <Panel icon={GraduationCap} tone="green" title={t('detail.programmes')} className="flex-1">
              <TagList
                title={t('detail.programmes')}
                tags={detail.programs.map((program) => translateReference('programs', program))}
                emptyMessage={t('detail.noProgramme')}
              />
            </Panel>
          )}
        </div>

        <ComparePanel
          benchmarks={benchmarks}
          showExamResults={showExamResults}
          className={placeCell(NARROW_CELL, 2)}
        />
      </div>
    </div>
  )
}

// Fiche d'un établissement vue par son responsable : il y relit ce qui est
// publié et propose ses changements, tous soumis à validation.
function ManagerSchoolDetail({ detail, detailStatus, onRetry, ...contentProps }) {
  const { t } = useTranslation('manager')
  if (detailStatus === 'error') {
    return (
      <StateMessage
        icon={Building2}
        tone="danger"
        title={t('page.schoolErrorTitle')}
        description={t('page.serverError')}
        actionLabel={t('workspace:retry')}
        onAction={onRetry}
      />
    )
  }
  if (!detail) {
    return (
      <p role="status" className="py-16 text-center text-sm text-ink-soft">
        {t('page.loadingSchool')}
      </p>
    )
  }

  return <SchoolDetailContent key={detail.uuid} detail={detail} {...contentProps} />
}

export default ManagerSchoolDetail
