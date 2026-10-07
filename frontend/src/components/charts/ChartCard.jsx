const ICON_TONE_CLASSES = {
  blue: 'bg-primary-soft text-primary-deep',
  amber: 'bg-warning-soft text-warning',
  green: 'bg-success-soft text-success',
  violet: 'bg-violet-soft text-violet-deep',
}

function ChartMessage({ children }) {
  return (
    <p className="flex h-full min-h-32 items-center justify-center text-center text-sm text-ink-soft text-pretty">
      {children}
    </p>
  )
}

function ChartBody({ status, emptyMessage, onRetry, children }) {
  if (status === 'loading') return <ChartMessage>Loading…</ChartMessage>
  if (status === 'error') {
    return (
      <div role="alert" className="flex h-full min-h-32 flex-col items-center justify-center gap-2">
        <p className="text-sm text-danger-deep">This block could not be loaded.</p>
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 cursor-pointer rounded-control px-3 text-sm font-semibold text-primary-deep hover:bg-primary-soft"
        >
          Try again
        </button>
      </div>
    )
  }
  if (status === 'empty') return <ChartMessage>{emptyMessage}</ChartMessage>
  return children
}

// Bloc d'un tableau de bord : pictogramme coloré, titre, compteur éventuel,
// action, puis l'un des quatre états (chargement, erreur, vide, données). Le
// bloc occupe toute la hauteur que sa rangée lui donne ; son contenu se
// débrouille à l'intérieur, sans jamais agrandir le bloc.
function ChartCard({
  icon: Icon,
  tone = 'blue',
  title,
  description,
  count,
  action,
  status = 'ready',
  emptyMessage,
  onRetry,
  className = '',
  children,
}) {
  return (
    <section
      className={`flex h-full min-w-0 flex-col overflow-hidden rounded-panel border border-line bg-surface p-5 shadow-soft sm:p-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-control ${ICON_TONE_CLASSES[tone]}`}
          >
            <Icon aria-hidden="true" className="size-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
            <span className="truncate">{title}</span>
            {count !== undefined && (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-navy tabular-nums">
                {count}
              </span>
            )}
          </h2>
          {description && <p className="truncate text-sm text-ink-soft">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <ChartBody status={status} emptyMessage={emptyMessage} onRetry={onRetry}>
          {children}
        </ChartBody>
      </div>
    </section>
  )
}

export default ChartCard
