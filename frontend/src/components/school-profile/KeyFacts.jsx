import { Building2, GraduationCap, Languages, TrendingUp, Wallet } from 'lucide-react'

import Container from '../ui/Container'
import { listLatestExamResults } from './helpers'
import { formatFcfa, formatPercent } from '../../utils/format'

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

// Seuls les faits réellement publiés sont affichés : une fiche sans frais ni
// résultats montre une barre plus courte, jamais une valeur inventée.
function listKeyFacts(institution) {
  const amounts = (institution.fees ?? []).map((fee) => Number(fee.amount))
  const latestResults = listLatestExamResults(institution.exam_results ?? [])

  return [
    { icon: GraduationCap, label: 'Type of school', value: institution.type },
    { icon: Languages, label: 'Language section', value: institution.linguistic_section },
    { icon: Building2, label: 'Sector', value: capitalize(institution.sector) },
    amounts.length > 0 && {
      icon: Wallet,
      label: 'Fees from, per year',
      value: formatFcfa(Math.min(...amounts)),
    },
    latestResults.length > 0 && {
      icon: TrendingUp,
      label: `Best pass rate, ${latestResults[0].session}`,
      value: `${formatPercent(latestResults[0].pass_rate)} (${latestResults[0].exam})`,
    },
  ].filter((fact) => fact && fact.value)
}

function KeyFacts({ institution }) {
  const keyFacts = listKeyFacts(institution)

  return (
    <section aria-label="Key facts" className="border-y border-line bg-surface">
      <Container>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 py-6 sm:grid-cols-3 lg:flex lg:divide-x lg:divide-line lg:gap-0">
          {keyFacts.map((fact) => (
            <div key={fact.label} className="flex items-center gap-4 lg:flex-1 lg:px-6 lg:first:pl-0 lg:last:pr-0">
              <fact.icon aria-hidden="true" className="size-8 shrink-0 text-primary-deep" strokeWidth={1.25} />
              <div>
                <dt className="text-xs text-ink-soft">{fact.label}</dt>
                <dd className="mt-0.5 text-sm font-bold text-navy">{fact.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}

export default KeyFacts
