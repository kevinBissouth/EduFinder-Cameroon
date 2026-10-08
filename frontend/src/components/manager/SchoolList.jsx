import { ArrowRight, Clock, MapPin, PencilLine, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

import Button from '../ui/Button'
import PagedCards from '../workspace/PagedCards'
import SchoolCover from '../workspace/SchoolCover'
import ViewHero from '../workspace/ViewHero'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'

function describeSchoolCount(establishments) {
  const publishedCount = establishments.filter(
    (school) => school.establishment_status === 'published',
  ).length
  return i18next.t('manager:schools.summary', {
    count: establishments.length,
    published: publishedCount,
  })
}

function SchoolCard({ school, onOpenSchool, onProposeModification }) {
  const { t } = useTranslation('manager')
  const translateReference = useReferenceLabel()
  const tags = [
    translateReference('types', school.type),
    translateReference('sectors', school.sector),
  ].filter(Boolean)

  return (
    <li className="group flex h-full flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-soft transition-shadow hover:shadow-raised">
      <SchoolCover
        name={school.name}
        coverUrl={school.cover_url}
        status={school.establishment_status}
      />
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-sm font-medium text-navy">
          <MapPin aria-hidden="true" className="size-4 shrink-0 text-primary" />
          {school.city}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold capitalize text-primary-deep"
            >
              {tag}
            </li>
          ))}
        </ul>
        {school.has_pending_submission && (
          <p className="mt-3 flex items-center gap-1.5 rounded-control bg-warning-soft px-3 py-2 text-sm font-medium text-warning">
            <Clock aria-hidden="true" className="size-4 shrink-0" />
            {t('page.awaitingReview')}
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <Button
            className="flex-1"
            aria-label={t('schools.openNamed', { name: school.name })}
            onClick={() => onOpenSchool(school.establishment_uuid)}
          >
            {t('actions.open')}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            aria-label={t('schools.proposeNamed', { name: school.name })}
            onClick={() => onProposeModification(school)}
          >
            <PencilLine aria-hidden="true" className="size-4" />
            {t('actions.edit')}
          </Button>
        </div>
      </div>
    </li>
  )
}

// Vue « Your schools » : le bandeau, puis une carte par établissement géré.
function SchoolList({ establishments, onOpenSchool, onProposeModification, onCreateProposal }) {
  const { t } = useTranslation('manager')

  return (
    <>
      <ViewHero
        title={t('schools.title')}
        description={describeSchoolCount(establishments)}
        action={
          <Button variant="accent" className="w-full sm:w-auto" onClick={onCreateProposal}>
            <Plus aria-hidden="true" className="size-4" />
            {t('actions.proposeSchool')}
          </Button>
        }
      />
      <PagedCards
        items={establishments}
        renderCard={(school) => (
          <SchoolCard
            key={school.establishment_uuid}
            school={school}
            onOpenSchool={onOpenSchool}
            onProposeModification={onProposeModification}
          />
        )}
      />
    </>
  )
}

export default SchoolList
