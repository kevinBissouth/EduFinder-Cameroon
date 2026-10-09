import { useState } from 'react'

const COPY_FEEDBACK_MILLISECONDS = 2500

// Copie l'adresse de la page dans le presse-papiers et dit ce qui s'est passé
// pendant quelques secondes. Si le navigateur refuse, l'état passe à
// « failed » au lieu d'échouer en silence.
export function useLinkCopy() {
  const [copyStatus, setCopyStatus] = useState('idle')

  const copyCurrentLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
    setTimeout(() => setCopyStatus('idle'), COPY_FEEDBACK_MILLISECONDS)
  }

  return { copyStatus, copyCurrentLink }
}
