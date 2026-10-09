import { Building2, Check, Landmark, Languages, MapPin, School } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ComparisonSection, SchoolColumns } from './comparisonParts'
import { COMPARISON_SECTION_IDS } from './comparisonLayout'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { buildProfileFacts } from '../../utils/comparisonView'

const FACT_ICONS = { type: Building2, sector: Landmark, section: Languages, location: MapPin }

// Ce qui est identique partout est dit une fois, en tête : on sait d'emblée
// sur quoi les établissements ne se distinguent pas.
function SharedFacts({ sharedFacts }) {
  const { t } = useTranslation('compare')

  if (sharedFacts.length === 0) return null
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <p className="mr-1 text-sm font-semibold text-ink-soft">{t('inCommon')}</p>
      {sharedFacts.map((fact) => (
        <p
          key={fact.id}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary-deep"
        >
          <Check aria-hidden="true" className="size-3.5" />
          {fact.value}
        </p>
      ))}
    </div>
  )
}

function SchoolFacts({ facts, schoolIndex }) {
  const { t } = useTranslation('compare')

  return (
    <dl className="space-y-4">
      {facts.map((fact) => {
        const FactIcon = FACT_ICONS[fact.id]
        const value = fact.values[schoolIndex]
        return (
          <div key={fact.id} className="flex items-start gap-3">
            <FactIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary-deep" />
            <div>
              <dt className="text-xs text-ink-soft">{t(`rows.${fact.id}`)}</dt>
              <dd className={value ? 'text-base font-semibold text-navy' : 'text-sm text-ink-soft'}>
                {value ?? t('notPublished')}
              </dd>
            </div>
          </div>
        )
      })}
    </dl>
  )
}

function ProfileComparison({ schools }) {
  const { t } = useTranslation('compare')
  const translateReference = useReferenceLabel()
  const profile = buildProfileFacts(schools, translateReference)

  return (
    <ComparisonSection id={COMPARISON_SECTION_IDS.profile} icon={School} title={t('groups.identity')}>
      <SharedFacts sharedFacts={profile.shared} />
      <SchoolColumns
        schools={schools}
        renderSchool={(school, schoolIndex) => (
          <SchoolFacts facts={profile.facts} schoolIndex={schoolIndex} />
        )}
      />
    </ComparisonSection>
  )
}

export default ProfileComparison
