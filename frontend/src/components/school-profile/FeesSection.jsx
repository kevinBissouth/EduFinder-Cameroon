import { useState } from 'react'

import { useInView } from '../../hooks/useInView'
import { AlertIcon } from '../icons'
import { formatFcfa } from '../../utils/format'
import { compactFcfa, groupFeesByYear } from './helpers'

// Aperçu limité à 4 niveaux, réparti dans les groupes d'années.
const FEE_PREVIEW_COUNT = 4

// Panneau des frais façon maquette : barres horizontales par niveau (dégradé
// vert, 7px), trois statistiques, puis tableau annuel avec point or et badge
// « Top » sur le montant le plus élevé.
function FeesSection({ fees = [] }) {
  const [allFeesShown, setAllFeesShown] = useState(false)
  const [feesRef, feesInView] = useInView(0.2)

  const feeGroups = groupFeesByYear(fees)

  const allAmounts = fees.map((fee) => Number(fee.amount)).filter((amount) => amount > 0)
  const minTuition = allAmounts.length ? Math.min(...allAmounts) : null
  const maxTuition = allAmounts.length ? Math.max(...allAmounts) : null
  const avgTuition = allAmounts.length
    ? Math.round(allAmounts.reduce((sum, amount) => sum + amount, 0) / allAmounts.length)
    : null
  const maxBarValue = allAmounts.length ? Math.max(...allAmounts) : 1

  const feeBars = fees.map((fee) => ({
    label: fee.stage ? `${fee.class} · ${fee.stage}` : fee.class,
    value: Number(fee.amount),
  }))

  let remaining = allFeesShown ? Infinity : FEE_PREVIEW_COUNT
  const visibleFeeGroups = feeGroups
    .map(([schoolYear, yearFees]) => {
      const take = yearFees.slice(0, Math.max(0, remaining))
      remaining -= take.length
      return [schoolYear, take]
    })
    .filter(([, yearFees]) => yearFees.length > 0)
  const hiddenFeeCount =
    fees.length -
    visibleFeeGroups.reduce((sum, [, yearFees]) => sum + yearFees.length, 0)

  return (
    <section id="fees" ref={feesRef} className="scroll-mt-40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-[#081220]">Tuition &amp; fees</h2>
        <span className="text-xs text-[#98a2ac]">
          {fees.length} levels · {feeGroups.length} school year
          {feeGroups.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Barres horizontales par niveau + trois statistiques */}
      <div className="mt-6 rounded-[14px] border border-[#e7ece9] bg-white p-6 shadow-[0_4px_24px_rgba(10,94,61,0.055)] sm:p-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#98a2ac]">
          Tuition by level
        </p>
        <div className="mt-6 space-y-4">
          {feeBars.map((bar, index) => {
            const isHighest = bar.value === maxTuition
            return (
              <div key={`${bar.label}-${index}`} className="flex items-center gap-4">
                <span className="w-28 shrink-0 truncate text-[12px] font-semibold text-[#343a44] sm:w-40">
                  {bar.label}
                </span>
                <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-[#eef3f0]">
                  <div
                    className={`h-full rounded-full ${
                      isHighest
                        ? 'bg-[linear-gradient(90deg,#c29105,#f2c14e)]'
                        : 'bg-[linear-gradient(90deg,#0a5e3d,#2ec27e)]'
                    }`}
                    style={{
                      width: feesInView ? `${Math.max((bar.value / maxBarValue) * 100, 3)}%` : '0%',
                      transition: `width .9s cubic-bezier(.4,0,.2,1) ${index * 80}ms`,
                    }}
                    title={`${bar.label} — ${compactFcfa(bar.value)}`}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-[12px] font-bold tabular-nums text-[#0a5e3d] sm:w-24">
                  {compactFcfa(bar.value)}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3 border-t border-dotted border-[#e7ece9] pt-5">
          {[
            { label: 'Lowest', value: minTuition },
            { label: 'Average', value: avgTuition },
            { label: 'Highest', value: maxTuition },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-[#f0f8f4] px-2 py-3 text-center">
              <p className="text-sm font-bold tabular-nums text-[#0a5e3d] sm:text-base">
                {stat.value != null ? compactFcfa(stat.value) : '—'}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#98a2ac]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau annuel unique, groupes séparés par sous-entêtes */}
      <div className="mt-6 overflow-hidden rounded-[14px] border border-[#e7ece9] bg-white shadow-[0_4px_24px_rgba(10,94,61,0.055)]">
        {visibleFeeGroups.map(([schoolYear, yearFees], groupIndex) => (
          <div key={schoolYear} className={groupIndex > 0 ? 'border-t border-[#e7ece9]' : ''}>
            <p className="flex items-center gap-2 bg-[#f7fbf9] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#0a5e3d]">
              <span className="size-1.5 rounded-full bg-[#d9a406]" />
              School year {schoolYear}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-[#e7ece9]">
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#98a2ac]">
                      Educational level
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#98a2ac]">
                      Annual tuition
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#98a2ac]">
                      Payment plan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {yearFees.map((fee, index) => {
                    const isHighest = Number(fee.amount) === maxTuition
                    return (
                      <tr
                        key={index}
                        className={`transition-colors hover:bg-[#f7fbf9] ${
                          isHighest ? 'bg-[#0d7a4f]/[0.04]' : ''
                        }`}
                      >
                        <td className="px-5 py-4 align-top">
                          <span className="flex items-center gap-2 font-semibold text-[#081220]">
                            {fee.class}
                            {isHighest && (
                              <span className="rounded-full bg-[linear-gradient(90deg,#d9a406,#f2c14e)] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                                Top
                              </span>
                            )}
                          </span>
                          {fee.stage && (
                            <span className="mt-0.5 block text-xs text-[#98a2ac]">
                              {fee.stage}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 align-top font-medium text-[#343a44]">
                          {formatFcfa(fee.amount)}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-wrap gap-1.5">
                            {(fee.payment_methods || []).map((method) => (
                              <span
                                key={method}
                                className="rounded-md bg-[#eef1f0] px-3 py-1.5 text-xs font-medium text-[#343a44]"
                              >
                                {method}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {fees.length > FEE_PREVIEW_COUNT && (
          <div className="border-t border-[#e7ece9] p-4 text-center">
            <button
              onClick={() => setAllFeesShown((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dcebe3] px-5 py-2.5 text-sm font-semibold text-[#0d7a4f] transition-colors hover:border-[#0d7a4f] hover:bg-[#f7fbf9]"
            >
              {allFeesShown
                ? 'Show less'
                : `Show ${hiddenFeeCount} more level${hiddenFeeCount > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>

      {/* Note bas de carte */}
      <div className="mt-4 flex items-start gap-3 text-sm text-[#5b6670]">
        <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#d9a406]" />
        <p>
          Amounts are annual tuitions as published by the establishment.
          Contact them for enrollment fees and payment schedules.
        </p>
      </div>
    </section>
  )
}

export default FeesSection