import { useTranslation } from 'react-i18next'

import { findStatusTheme } from './statusTheme'

// L'état est toujours écrit en toutes lettres : la couleur l'accompagne, elle
// ne le porte jamais seule.
function StatusBadge({ status }) {
  const { t } = useTranslation('workspace')

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
        findStatusTheme(status).badgeClass
      }`}
    >
      {t(`status.${status}`, { defaultValue: status.replace('_', ' ') })}
    </span>
  )
}

export default StatusBadge
