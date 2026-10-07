import { useState } from 'react'

import {
  buildInitialFields,
  createExamResultRow,
  createFeeRow,
  findProgramIds,
} from './proposalDraft'

// État du formulaire de proposition. En modification il part de la fiche
// actuelle ; en création (pas de fiche) tout part de vide.
export function useProposalDraft(school, programs) {
  const detail = school?.detail
  const [draft, setDraft] = useState(() => ({
    fields: buildInitialFields(school),
    feeRows: (detail?.fees ?? []).map(createFeeRow),
    examResultRows: (detail?.exam_results ?? []).map(createExamResultRow),
    serviceNames: (detail?.services ?? []).map((service) => service.name),
    programIds: findProgramIds(detail?.programs ?? [], programs),
    coverPhotoUrl: '',
    directorPhotoUrl: '',
    videoUrls: [],
    touchedLists: [],
  }))

  const setField = (fieldName, fieldValue) =>
    setDraft((currentDraft) => ({
      ...currentDraft,
      fields: { ...currentDraft.fields, [fieldName]: fieldValue },
    }))

  const setValue = (draftKey, value) =>
    setDraft((currentDraft) => ({ ...currentDraft, [draftKey]: value }))

  // listName est le nom de la liste dans le contenu envoyé : c'est lui qui
  // sert à savoir, en modification, quelles listes ont été retouchées.
  const setList = (draftKey, listName, list) =>
    setDraft((currentDraft) => ({
      ...currentDraft,
      [draftKey]: list,
      touchedLists: [...new Set([...currentDraft.touchedLists, listName])],
    }))

  return { draft, setField, setValue, setList }
}
