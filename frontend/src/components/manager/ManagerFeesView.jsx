import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

import ViewHero from '../workspace/ViewHero'
import ManagerFeesSection from './ManagerFeesSection'
import { listPaymentMethodsForLanguage } from './paymentPlans'
import SchoolSection from './SchoolSection'
import { findLatestYear } from './schoolYears'
import { formatFcfa } from '../../utils/format'

// Chiffres du bandeau, pour l'année scolaire la plus récente. Sans frais
// enregistrés il n'y a rien à résumer.
function buildFeeFigures(fees) {
  const currentYear = findLatestYear(fees.map((fee) => fee.school_year))
  if (!currentYear) return []

  const currentAmounts = fees
    .filter((fee) => fee.school_year === currentYear)
    .map((fee) => Number(fee.amount))
  const levelFigure = {
    value: currentAmounts.length,
    label: i18next.t('manager:fees.levelsIn', { count: currentAmounts.length, year: currentYear }),
  }
  const lowestAmount = Math.min(...currentAmounts)
  const highestAmount = Math.max(...currentAmounts)
  // Avec un seul montant, « le plus bas » et « le plus haut » diraient deux
  // fois la même chose.
  if (lowestAmount === highestAmount) {
    return [levelFigure, { value: formatFcfa(lowestAmount), label: i18next.t('manager:fees.perYear') }]
  }
  return [
    levelFigure,
    { value: formatFcfa(lowestAmount), label: i18next.t('manager:fees.lowest') },
    { value: formatFcfa(highestAmount), label: i18next.t('manager:fees.highest') },
  ]
}

function ManagerFeesView({ paymentMethods, onProposalSubmitted, ...sectionProps }) {
  const { t } = useTranslation('manager')

  return (
    <SchoolSection {...sectionProps}>
      {(detail) => (
        <>
          <ViewHero
            title={t('fees.title')}
            description={t('fees.description', { school: detail.name })}
            figures={buildFeeFigures(detail.fees)}
          />
          <ManagerFeesSection
            key={detail.uuid}
            fees={detail.fees}
            establishmentUuid={detail.uuid}
            paymentMethods={listPaymentMethodsForLanguage(detail.linguistic_section, paymentMethods)}
            onProposalSubmitted={onProposalSubmitted}
          />
        </>
      )}
    </SchoolSection>
  )
}

export default ManagerFeesView
