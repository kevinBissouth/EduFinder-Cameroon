import { useState } from 'react'

import { groupFees } from './feeGroups'
import { buildInitialFields, buildPublishedRecord, createExamResultRow } from './proposalDraft'

// État du formulaire de proposition. En modification il part de la fiche
// actuelle ; en création (pas de fiche) tout part de vide.
export function useProposalDraft(school, meta) {
  const [draft, setDraft] = useState(() => {
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
  })

  const setField = (fieldName, fieldValue) =>
    setDraft((currentDraft) => ({
      ...currentDraft,
      fields: { ...currentDraft.fields, [fieldName]: fieldValue },
    }))

  const setValue = (draftKey, value) =>
    setDraft((currentDraft) => ({ ...currentDraft, [draftKey]: value }))

  return { draft, setField, setValue, replaceDraft: setDraft }
}
