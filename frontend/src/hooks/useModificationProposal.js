import { useState } from 'react'

import { useToast } from '../components/workspace/toastContext'
import { readApiErrorMessage } from '../utils/apiError'
import { authedRequest } from '../utils/auth'

const SENT_MESSAGE =
  'Sent for review. The public page changes once a super administrator approves it.'

// Toute demande du responsable qui ouvre une soumission (champ, frais, média)
// passe par ici : même message de confirmation ou d'erreur partout.
export function useReviewRequest(onSubmitted) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const showToast = useToast()

  const showError = (message) => showToast({ tone: 'danger', message })
  const showInfo = (message) => showToast({ tone: 'success', message })

  async function sendForReview(method, url, body) {
    setIsSubmitting(true)
    try {
      await authedRequest(method, url, body)
    } catch (error) {
      showError(readApiErrorMessage(error))
      return false
    } finally {
      setIsSubmitting(false)
    }
    showInfo(SENT_MESSAGE)
    onSubmitted()
    return true
  }

  return { isSubmitting, showError, showInfo, sendForReview }
}

export function useModificationProposal(establishmentUuid, onProposalSubmitted) {
  const reviewRequest = useReviewRequest(onProposalSubmitted)

  const submitProposal = (proposalContent) =>
    reviewRequest.sendForReview(
      'post',
      `/my/establishments/${establishmentUuid}/modification-proposals`,
      proposalContent,
    )

  return { ...reviewRequest, submitProposal }
}
