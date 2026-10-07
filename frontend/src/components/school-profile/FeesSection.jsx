import { useState } from 'react'

import Container from '../ui/Container'
import SectionHeading, { Emphasis } from '../ui/SectionHeading'
import { groupFeesByYear } from './helpers'
import { formatFcfa } from '../../utils/format'

const HEADER_CELL_CLASSES = 'px-4 py-3 text-left text-xs font-semibold text-ink-soft first:pl-0 last:pr-0'
const BODY_CELL_CLASSES = 'px-4 py-4 align-top first:pl-0 last:pr-0'

function describeRange(fees) {
  const amounts = fees.map((fee) => Number(fee.amount))
  const lowestAmount = Math.min(...amounts)
  const highestAmount = Math.max(...amounts)
  const classCount = `${fees.length} ${fees.length === 1 ? 'class' : 'classes'}`
  if (lowestAmount === highestAmount) return `${formatFcfa(lowestAmount)} per year, for ${classCount}.`
  return `From ${formatFcfa(lowestAmount)} to ${formatFcfa(highestAmount)} per year, across ${classCount}.`
}

function YearTabs({ schoolYears, selectedYear, onSelect }) {
  if (schoolYears.length < 2) return null

  return (
    <div role="group" aria-label="School year" className="mt-6 flex flex-wrap gap-2">
      {schoolYears.map((schoolYear) => {
        const isSelected = schoolYear === selectedYear
        return (
          <button
            key={schoolYear}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(schoolYear)}
            className={`h-11 cursor-pointer rounded-full border px-4 text-sm font-semibold tabular-nums transition-colors ${
              isSelected
                ? 'border-navy bg-navy text-white'
                : 'border-line bg-surface text-navy hover:border-primary hover:text-primary-deep'
            }`}
          >
            {schoolYear}
          </button>
        )
      })}
    </div>
  )
}

function FeeRow({ fee }) {
  return (
    <tr>
      <th scope="row" className={`${BODY_CELL_CLASSES} text-left`}>
        <span className="block text-sm font-bold text-navy">{fee.class}</span>
        <span className="block text-xs font-normal text-ink-soft">{fee.stage}</span>
      </th>
      <td className={`${BODY_CELL_CLASSES} whitespace-nowrap font-display text-lg tabular-nums text-navy`}>
        {formatFcfa(fee.amount)}
      </td>
      <td className={BODY_CELL_CLASSES}>
        {fee.payment_methods.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {fee.payment_methods.map((paymentMethod) => (
              <li key={paymentMethod} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-ink-soft">
                {paymentMethod}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-ink-soft">Ask the school</span>
        )}
      </td>
    </tr>
  )
}

// Les frais sont présentés année par année : l'historique reste consultable,
// et l'année la plus récente s'affiche d'abord.
function FeesSection({ fees }) {
  const feesByYear = groupFeesByYear(fees)
  const [chosenYear, setChosenYear] = useState(null)
  if (feesByYear.length === 0) return null

  const schoolYears = feesByYear.map(([schoolYear]) => schoolYear)
  const selectedYear = schoolYears.includes(chosenYear) ? chosenYear : schoolYears[0]
  const selectedFees = feesByYear.find(([schoolYear]) => schoolYear === selectedYear)[1]

  return (
    <section id="fees" className="scroll-mt-36 bg-surface py-16 sm:py-20">
      <Container>
        <SectionHeading
          size="md"
          eyebrow="Fees"
          title={
            <>
              Tuition by class, <Emphasis>year</Emphasis> by year.
            </>
          }
          lead={describeRange(selectedFees)}
        />
        <YearTabs schoolYears={schoolYears} selectedYear={selectedYear} onSelect={setChosenYear} />
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-y border-line">
            <caption className="sr-only">Yearly fees for {selectedYear}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className={HEADER_CELL_CLASSES}>Class</th>
                <th scope="col" className={HEADER_CELL_CLASSES}>Yearly fee</th>
                <th scope="col" className={HEADER_CELL_CLASSES}>Payment plans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {selectedFees.map((fee) => (
                <FeeRow key={`${fee.id_level}-${fee.school_year}`} fee={fee} />
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  )
}

export default FeesSection
