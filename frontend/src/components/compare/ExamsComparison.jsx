import { ClipboardCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ComparisonSection, RateRing, SchoolAvatar } from './comparisonParts'
import { COMPARISON_SECTION_IDS, pickSchoolTone } from './comparisonLayout'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { EXAM_STATUS, buildExamComparison } from '../../utils/comparisonView'
import { formatPercent } from '../../utils/format'

const NAME_SEPARATOR = ', '
const MISSING_RATE_MARK = '–'

// Une tuile par établissement concerné, à sa teinte : l'anneau, puis sa photo
// et son nom juste dessous. Sans résultat publié, l'anneau reste vide : un
// anneau à zéro ferait croire à un taux de zéro.
function ExamTile({ school, schoolIndex, entry }) {
  const { t } = useTranslation('compare')
  const isPublished = entry.status === EXAM_STATUS.published

  return (
    <li
      className={`flex flex-col items-center rounded-control p-3 text-center ${pickSchoolTone(schoolIndex).tint}`}
    >
      <RateRing
        schoolIndex={schoolIndex}
        rate={isPublished ? entry.passRate : null}
        label={isPublished ? formatPercent(entry.passRate) : MISSING_RATE_MARK}
      />
      <p className="mt-1 text-xs text-ink-soft">
        {isPublished ? t('examSession', { session: entry.session }) : t('notPublished')}
      </p>
      <div className="mt-3 flex flex-col items-center gap-2">
        <SchoolAvatar school={school} schoolIndex={schoolIndex} className="size-7" />
        <p className="text-xs font-bold leading-snug text-navy">{school.name}</p>
      </div>
    </li>
  )
}

// Les établissements que l'examen ne concerne pas sont réunis en une seule
// ligne : répétés un par un, ils noyaient les résultats sous les « Sans objet ».
function ExamBlock({ examBlock, schools }) {
  const { t } = useTranslation('compare')
  const translateReference = useReferenceLabel()
  const isConcerned = (schoolIndex) =>
    examBlock.entries[schoolIndex].status !== EXAM_STATUS.notApplicable
  const unconcernedNames = schools
    .filter((school, schoolIndex) => !isConcerned(schoolIndex))
    .map((school) => school.name)

  return (
    <div className="flex flex-col rounded-control border border-line p-4 sm:p-5">
      <h3 className="font-display text-xl text-navy">{translateReference('exams', examBlock.exam)}</h3>
      <ul className="mt-4 grid grid-cols-2 gap-3">
        {schools.map(
          (school, schoolIndex) =>
            isConcerned(schoolIndex) && (
              <ExamTile
                key={school.uuid}
                school={school}
                schoolIndex={schoolIndex}
                entry={examBlock.entries[schoolIndex]}
              />
            ),
        )}
      </ul>
      {unconcernedNames.length > 0 && (
        <p className="mt-auto pt-4 text-xs text-ink-soft">
          {t('notApplicableFor', { names: unconcernedNames.join(NAME_SEPARATOR) })}
        </p>
      )}
    </div>
  )
}

// Sans examen présenté par au moins un établissement, le thème ne s'affiche pas.
function ExamsComparison({ schools, examAllowedTypes }) {
  const { t } = useTranslation('compare')
  const examBlocks = buildExamComparison(schools, examAllowedTypes)

  if (examBlocks.length === 0) return null
  return (
    <ComparisonSection id={COMPARISON_SECTION_IDS.results} icon={ClipboardCheck} title={t('groups.results')} lead={t('results.legend')}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {examBlocks.map((examBlock) => (
          <ExamBlock key={examBlock.exam} examBlock={examBlock} schools={schools} />
        ))}
      </div>
    </ComparisonSection>
  )
}

export default ExamsComparison
