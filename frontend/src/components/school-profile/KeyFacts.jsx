import { Building2, GraduationCap, Languages, TrendingUp, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Container from '../ui/Container'
import { listLatestExamResults } from './helpers'
import { useReferenceLabel } from '../../hooks/useReferenceLabel'
import { formatFcfa, formatPercent } from '../../utils/format'

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

// Seuls les faits réellement publiés sont affichés : une fiche sans frais ni
// résultats montre une barre plus courte, jamais une valeur inventée.
function listKeyFacts(institution, t, translateReference) {
  const amounts = (institution.fees ?? []).map((fee) => Number(fee.amount))
  const latestResults = listLatestExamResults(institution.exam_results ?? [])

  return [
    { icon: GraduationCap, label: t('facts.type'), value: translateReference('types', institution.type) },
    {
      icon: Languages,
      label: t('facts.section'),
      value: translateReference('sections', institution.linguistic_section),
    },
    {
      icon: Building2,
      label: t('facts.sector'),
      value: capitalize(translateReference('sectors', institution.sector)),
    },
    amounts.length > 0 && {
      icon: Wallet,
      label: t('facts.feesFrom'),
      value: formatFcfa(Math.min(...amounts)),
    },
    latestResults.length > 0 && {
      icon: TrendingUp,
      label: t('facts.bestPassRate', { session: latestResults[0].session }),
      value: `${formatPercent(latestResults[0].pass_rate)} (${translateReference('exams', latestResults[0].exam)})`,
    },
  ].filter((fact) => fact && fact.value)
}

function KeyFacts({ institution }) {
  const { t } = useTranslation('profile')
  const translateReference = useReferenceLabel()
  const keyFacts = listKeyFacts(institution, t, translateReference)

  // Sur téléphone, une ligne par fait, le libellé à gauche et la valeur à
  // droite : en grille de deux colonnes, les valeurs longues se chevauchaient.
  return (
    <section aria-label={t('facts.label')} className="border-y border-line bg-surface">
      <Container>
        <dl className="divide-y divide-line py-2 sm:grid sm:grid-cols-3 sm:gap-6 sm:divide-y-0 sm:py-6 lg:flex lg:gap-0 lg:divide-x">
          {keyFacts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-center gap-3 py-3 sm:gap-4 sm:py-0 lg:flex-1 lg:px-6 lg:first:pl-0 lg:last:pr-0"
            >
              <fact.icon
                aria-hidden="true"
                className="size-6 shrink-0 text-primary-deep sm:size-8"
                strokeWidth={1.25}
              />
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-4 sm:block">
                <dt className="text-sm text-ink-soft sm:text-xs">{fact.label}</dt>
                <dd className="text-right text-sm font-bold text-navy sm:mt-0.5 sm:text-left">{fact.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}

export default KeyFacts
