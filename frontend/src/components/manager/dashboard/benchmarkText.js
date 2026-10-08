import i18next from 'i18next'

export function describeBenchmarkSample(benchmarks) {
  return i18next.t('manager:dashboard.benchmarkSample', { count: benchmarks.same_type_sample_size })
}
