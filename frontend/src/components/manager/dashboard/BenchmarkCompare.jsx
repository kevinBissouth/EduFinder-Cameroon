import { Scale } from 'lucide-react'

import ChartCard from '../../charts/ChartCard'
import { describeBenchmarkSample } from './benchmarkText'
import { formatFcfa, formatPercent } from '../../../utils/format'

const PERCENT = 100

function CompareBar({ label, value, highestValue, barClass, formatValue }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs text-ink-soft">{label}</span>
      <div aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${(Number(value) / highestValue) * PERCENT}%` }}
        />
      </div>
      <span className="w-28 shrink-0 text-right text-sm font-semibold text-navy tabular-nums">
        {formatValue(value)}
      </span>
    </div>
  )
}

// Deux barres côte à côte : l'établissement et la moyenne du même type. Sans
// l'une des deux valeurs il n'y a rien à comparer, la ligne le dit.
function Comparison({ label, schoolValue, averageValue, formatValue }) {
  if (schoolValue == null || averageValue == null) {
    return (
      <div>
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="mt-1 text-sm text-ink-soft">Not enough data to compare yet.</p>
      </div>
    )
  }
  const highestValue = Math.max(Number(schoolValue), Number(averageValue)) || 1

  return (
    <div>
      <p className="text-sm font-semibold text-navy">{label}</p>
      <div className="mt-2 space-y-2">
        <CompareBar
          label="You"
          value={schoolValue}
          highestValue={highestValue}
          barClass="bg-primary"
          formatValue={formatValue}
        />
        <CompareBar
          label="Average"
          value={averageValue}
          highestValue={highestValue}
          barClass="bg-violet"
          formatValue={formatValue}
        />
      </div>
    </div>
  )
}

// Les deux comparaisons, sans leur cadre : le tableau de bord et la fiche
// détaillée les posent chacun dans leur propre bloc.
export function BenchmarkComparisons({ benchmarks, showExamResults }) {
  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <Comparison
        label="Lowest yearly fee"
        schoolValue={benchmarks.your_min_tuition}
        averageValue={benchmarks.avg_min_tuition_same_type}
        formatValue={formatFcfa}
      />
      {showExamResults && (
        <Comparison
          label="Best exam pass rate"
          schoolValue={benchmarks.your_best_pass_rate}
          averageValue={benchmarks.avg_best_pass_rate_same_type}
          formatValue={formatPercent}
        />
      )}
    </div>
  )
}

function BenchmarkCompare({ benchmarks, showExamResults }) {
  return (
    <ChartCard
      icon={Scale}
      tone="violet"
      title="Against similar schools"
      description={benchmarks ? describeBenchmarkSample(benchmarks) : ''}
      status={benchmarks ? 'ready' : 'loading'}
    >
      {benchmarks && (
        <BenchmarkComparisons benchmarks={benchmarks} showExamResults={showExamResults} />
      )}
    </ChartCard>
  )
}

export default BenchmarkCompare
