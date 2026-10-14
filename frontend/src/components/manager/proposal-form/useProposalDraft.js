import { useState } from 'react'

import { groupFees } from './feeGroups'
import { buildInitialFields, buildPublishedRecord, createExamResultRow } from './proposalDraft'

// Le brouillon tel qu'il s'ouvre : en modification il part de la fiche
// actuelle ; en création (pas de fiche) tout part de vide.
function buildFreshDraft(school, meta) {
  const publishedRecord = buildPublishedRecord(school, meta.programs)
  return {
    fields: buildInitialFields(school, meta.coherence_rules?.head_titles),
    // Tous les frais publiés, regroupés par montant. L'année affichée se
    // choisit à l'étape Frais ; vide, c'est la première année ouverte.
    feeGroups: groupFees(publishedRecord.fees),
    feeYear: '',
    // Toutes les sessions publiées ; celle affichée se choisit à l'étape
    // Résultats, vide c'est la plus récente.
    examResultRows: publishedRecord.examResults.map(createExamResultRow),
    examSession: '',
    serviceNames: publishedRecord.serviceNames,
    programIds: publishedRecord.programIds,
    coverPhotoUrl: '',
    directorPhotoUrl: '',
    videoUrls: [],
  }
}

// État du formulaire de proposition. savedDraft est la saisie reprise de
// l'onglet, quand le responsable revient sur un formulaire qu'il n'avait pas
// envoyé.
export function useProposalDraft(school, meta, savedDraft = null) {
  const [draft, setDraft] = useState(() => savedDraft ?? buildFreshDraft(school, meta))

  const setField = (fieldName, fieldValue) =>
    setDraft((currentDraft) => ({
      ...currentDraft,
      fields: { ...currentDraft.fields, [fieldName]: fieldValue },
    }))

  const setValue = (draftKey, value) =>
    setDraft((currentDraft) => ({ ...currentDraft, [draftKey]: value }))

  const resetDraft = () => setDraft(buildFreshDraft(school, meta))

  return { draft, setField, setValue, replaceDraft: setDraft, resetDraft }
}
