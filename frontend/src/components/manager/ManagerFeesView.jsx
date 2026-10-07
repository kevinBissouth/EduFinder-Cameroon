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
  const levelWord = currentAmounts.length === 1 ? 'level' : 'levels'
  const levelFigure = { value: currentAmounts.length, label: `${levelWord} in ${currentYear}` }
  const lowestAmount = Math.min(...currentAmounts)
  const highestAmount = Math.max(...currentAmounts)
  // Avec un seul montant, « le plus bas » et « le plus haut » diraient deux
  // fois la même chose.
  if (lowestAmount === highestAmount) {
    return [levelFigure, { value: formatFcfa(lowestAmount), label: 'per year' }]
  }
  return [
    levelFigure,
    { value: formatFcfa(lowestAmount), label: 'lowest yearly fee' },
    { value: formatFcfa(highestAmount), label: 'highest yearly fee' },
  ]
}

function ManagerFeesView({ paymentMethods, onProposalSubmitted, ...sectionProps }) {
  return (
    <SchoolSection {...sectionProps}>
      {(detail) => (
        <>
          <ViewHero
            title="School fees"
            description={`What ${detail.name} charges per level. You can change the most recent school year; each change is reviewed before it goes public.`}
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
