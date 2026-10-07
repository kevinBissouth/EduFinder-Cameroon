import { Building2 } from 'lucide-react'

import StateMessage from '../ui/StateMessage'

// Cadre commun aux vues qui portent sur l'établissement sélectionné : il gère
// les états sans fiche, chargement et erreur. Le contenu n'est rendu qu'avec
// une fiche chargée.
function SchoolSection({
  establishments,
  detail,
  detailStatus,
  onRetry,
  children,
}) {
  if (establishments.length === 0) {
    return (
      <StateMessage
        icon={Building2}
        title="No school yet"
        description="Once a school you proposed is approved, you manage this part of its page here."
      />
    )
  }
  if (detailStatus === 'error') {
    return (
      <StateMessage
        icon={Building2}
        tone="danger"
        title="This school could not be loaded"
        description="The server did not answer. Check your connection, then try again."
        actionLabel="Try again"
        onAction={onRetry}
      />
    )
  }
  if (!detail) {
    return (
      <p role="status" className="py-16 text-center text-sm text-ink-soft">
        Loading the school…
      </p>
    )
  }

  return children(detail)
}

export default SchoolSection
