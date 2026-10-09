import { ChevronDown, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ComparisonSection, MeasureBar, NotPublished, SchoolColumns } from './comparisonParts'
import { COMPARISON_SECTION_IDS } from './comparisonLayout'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { buildFeeComparison } from '../../utils/comparisonView'
import { formatFcfa } from '../../utils/format'

// Le montant le plus bas en grand : c'est le premier chiffre qu'un parent
// cherche. Le plus élevé suit, en petit, quand il diffère.
function FeeSummary({ fees, schoolIndex }) {
  const { t } = useTranslation('compare')
  const translateReference = useReferenceLabel()

  return (
    <>
      <p className="text-xs text-ink-soft">{t('fees.from')}</p>
      <p className="font-display text-3xl tabular-nums text-navy">{formatFcfa(fees.lowestAmount)}</p>
      <p className="min-h-5 text-sm text-ink-soft">
        {fees.highestAmount > fees.lowestAmount && t('feesUpTo', { highest: formatFcfa(fees.highestAmount) })}
      </p>
      <div className="mt-3">
        <MeasureBar
          schoolIndex={schoolIndex}
          filledShare={fees.lowestShare}
          extendedShare={fees.highestShare}
        />
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {fees.paymentMethods.map((paymentMethod) => (
          <li key={paymentMethod} className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-navy">
            {translateReference('payment_methods', paymentMethod)}
          </li>
        ))}
      </ul>
    </>
  )
}

// Le détail classe par classe : c'est là qu'on voit quelles classes
// l'établissement ouvre, et ce que coûte celle de son enfant. Il est replié
// par défaut (quatre listes ouvertes allongeaient trop la page) dans un
// <details> natif, qui s'ouvre au clavier et se lit sans JavaScript.
function ClassFees({ fees }) {
  const { t } = useTranslation('compare')
  const translateReference = useReferenceLabel()

  return (
    <details className="group mt-5 border-t border-line pt-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-control text-sm font-semibold text-primary-deep hover:text-primary [&::-webkit-details-marker]:hidden">
        {t('fees.byClass', { count: fees.classFees.length, schoolYear: fees.schoolYear })}
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <ul className="divide-y divide-line">
        {fees.classFees.map((classFee) => (
          <li
            key={`${classFee.stage}-${classFee.className}`}
            className="flex items-baseline justify-between gap-3 py-2 text-sm"
          >
            <span className="min-w-0">
              <span className="font-semibold text-navy">{classFee.className}</span>
              {classFee.stage && (
                <span className="ml-2 text-xs text-ink-soft">
                  {translateReference('stages', classFee.stage)}
                </span>
              )}
            </span>
            <span className="shrink-0 tabular-nums text-navy">{formatFcfa(classFee.amount)}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

function FeesComparison({ schools }) {
  const { t } = useTranslation('compare')
  const feeComparison = buildFeeComparison(schools)

  return (
    <ComparisonSection id={COMPARISON_SECTION_IDS.fees} icon={Wallet} title={t('fees.title')} lead={t('fees.legend')}>
      <SchoolColumns
        schools={schools}
        renderSchool={(school, schoolIndex) => {
          const fees = feeComparison[schoolIndex]
          if (!fees) return <NotPublished />
          return (
            <>
              <FeeSummary fees={fees} schoolIndex={schoolIndex} />
              <ClassFees fees={fees} />
            </>
          )
        }}
      />
    </ComparisonSection>
  )
}

export default FeesComparison
