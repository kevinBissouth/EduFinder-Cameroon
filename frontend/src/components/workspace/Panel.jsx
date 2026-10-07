const ICON_TONE_CLASSES = {
  blue: 'bg-primary-soft text-primary-deep',
  amber: 'bg-warning-soft text-warning',
  green: 'bg-success-soft text-success',
  violet: 'bg-violet-soft text-violet-deep',
}

// Bloc de contenu des espaces privés : un pictogramme coloré éventuel, un
// titre, une action à droite, puis le contenu.
function Panel({ icon: Icon, tone = 'blue', title, description, action, className = '', children }) {
  return (
    <section className={`min-w-0 rounded-panel border border-line bg-surface p-5 shadow-soft sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-control ${ICON_TONE_CLASSES[tone]}`}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="font-display text-2xl text-navy">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-soft text-pretty">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default Panel
