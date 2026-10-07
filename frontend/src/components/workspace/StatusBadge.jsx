import { findStatusTheme } from './statusTheme'

// L'état est toujours écrit en toutes lettres : la couleur l'accompagne, elle
// ne le porte jamais seule.
function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
        findStatusTheme(status).badgeClass
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

export default StatusBadge
