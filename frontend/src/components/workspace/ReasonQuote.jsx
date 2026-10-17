import { findStatusTheme } from './statusTheme'

// Le motif d'un refus ou d'une suspension, cité tel que le super
// administrateur l'a écrit, dans la couleur de l'état qu'il explique.
function ReasonQuote({ title, reason, status }) {
  const theme = findStatusTheme(status)

  return (
    <div className={`flex gap-3 rounded-control border px-4 py-3 ${theme.badgeClass}`}>
      <span aria-hidden="true" className={`w-1 shrink-0 self-stretch rounded-full ${theme.bandClass}`} />
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 whitespace-pre-line text-sm text-navy">{reason}</p>
      </div>
    </div>
  )
}

export default ReasonQuote
