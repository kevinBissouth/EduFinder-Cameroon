import Button from './Button'

const TONE_CLASSES = {
  neutral: { panel: 'border-line bg-surface', icon: 'bg-primary-soft text-primary-deep' },
  danger: { panel: 'border-danger bg-danger-soft', icon: 'bg-surface text-danger' },
}

// État vide ou état d'erreur d'une vue de données : il dit ce qui s'est passé
// et propose l'action qui permet d'avancer.
function StateMessage({ icon: Icon, title, description, actionLabel, onAction, tone = 'neutral' }) {
  const toneClasses = TONE_CLASSES[tone]

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`rounded-panel border px-6 py-12 text-center ${toneClasses.panel}`}
    >
      <span
        className={`mx-auto flex size-14 items-center justify-center rounded-full ${toneClasses.icon}`}
      >
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <h3 className="mt-4 font-display text-2xl text-navy">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-base text-ink">{description}</p>
      {actionLabel && (
        <Button onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default StateMessage
