import { useTranslation } from 'react-i18next'

import { COMPARISON_SECTION_IDS } from './comparisonLayout'
import ContactComparison from './ContactComparison'
import ExamsComparison from './ExamsComparison'
import FeesComparison from './FeesComparison'
import OfferComparison from './OfferComparison'
import ProfileComparison from './ProfileComparison'
import SectionNav from '../school-profile/SectionNav'
import Container from '../ui/Container'
import { buildExamComparison } from '../../utils/comparisonView'

// Onglets des thèmes : celui des examens n'existe que si au moins un
// établissement en présente, comme le thème lui-même.
function listThemes(schools, examAllowedTypes, t) {
  const hasExams = buildExamComparison(schools, examAllowedTypes).length > 0
  return [
    { id: COMPARISON_SECTION_IDS.profile, label: t('groups.identity') },
    { id: COMPARISON_SECTION_IDS.fees, label: t('groups.fees') },
    hasExams && { id: COMPARISON_SECTION_IDS.results, label: t('groups.results') },
    { id: COMPARISON_SECTION_IDS.offer, label: t('groups.offer') },
    { id: COMPARISON_SECTION_IDS.contact, label: t('groups.contact') },
  ].filter(Boolean)
}

// La comparaison se lit thème par thème, chacun sous la forme qui lui va
// (barres pour les montants, anneaux pour les taux, étiquettes pour l'offre).
// Dans chaque thème, un établissement = une carte à son nom : rien ne défile
// sur le côté et aucun texte n'est coupé, sur téléphone comme sur ordinateur.
function ComparisonBoard({ schools, examAllowedTypes }) {
  const { t } = useTranslation('compare')

  return (
    <>
      <SectionNav
        sections={listThemes(schools, examAllowedTypes, t)}
        navigationLabel={t('themesNavigation')}
      />
      <Container className="space-y-6 py-8 sm:space-y-8 sm:py-12">
        <ProfileComparison schools={schools} />
        <FeesComparison schools={schools} />
        <ExamsComparison schools={schools} examAllowedTypes={examAllowedTypes} />
        <OfferComparison schools={schools} />
        <ContactComparison schools={schools} />
      </Container>
    </>
  )
}

export default ComparisonBoard
