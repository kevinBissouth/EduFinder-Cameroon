import { BookOpen, Check, ConciergeBell, Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ComparisonSection, NotPublished, SchoolColumns } from './comparisonParts'
import { COMPARISON_SECTION_IDS } from './comparisonLayout'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { findSharedItems } from '../../utils/comparisonView'

// Chaque établissement montre toute sa liste. Une coche marque ce que tous
// les établissements comparés proposent aussi : on repère d'un coup d'œil ce
// qui est propre à chacun, sans rien cacher.
function ItemTags({ items, sharedItems }) {
  const { t } = useTranslation('compare')

  if (items.length === 0) return <NotPublished />
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isShared = sharedItems.includes(item)
        return (
          <li
            key={item}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
              isShared ? 'bg-primary-soft text-primary-deep' : 'border border-line bg-surface text-navy'
            }`}
          >
            {isShared && <Check aria-hidden="true" className="size-3.5" />}
            {item}
            {isShared && <span className="sr-only">, {t('offer.sharedByAll')}</span>}
          </li>
        )
      })}
    </ul>
  )
}

function OfferFamily({ icon: Icon, title, items, sharedItems }) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
        <Icon aria-hidden="true" className="size-4 shrink-0 text-primary-deep" />
        {title}
      </h3>
      <ItemTags items={items} sharedItems={sharedItems} />
    </div>
  )
}

function OfferComparison({ schools }) {
  const { t } = useTranslation('compare')
  const translateReference = useReferenceLabel()
  const programmeLists = schools.map((school) =>
    (school.programs ?? []).map((program) => translateReference('programs', program)),
  )
  const serviceLists = schools.map((school) => (school.services ?? []).map((service) => service.name))
  const sharedProgrammes = findSharedItems(programmeLists)
  const sharedServices = findSharedItems(serviceLists)

  return (
    <ComparisonSection id={COMPARISON_SECTION_IDS.offer} icon={Layers} title={t('groups.offer')} lead={t('offer.legend')}>
      <SchoolColumns
        schools={schools}
        renderSchool={(school, schoolIndex) => (
          <div className="space-y-6">
            <OfferFamily
              icon={BookOpen}
              title={t('rows.programmes')}
              items={programmeLists[schoolIndex]}
              sharedItems={sharedProgrammes}
            />
            <OfferFamily
              icon={ConciergeBell}
              title={t('rows.services')}
              items={serviceLists[schoolIndex]}
              sharedItems={sharedServices}
            />
          </div>
        )}
      />
    </ComparisonSection>
  )
}

export default OfferComparison
