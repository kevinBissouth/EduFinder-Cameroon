const TONE_CLASSES = {
  info: 'border-primary-soft bg-primary-soft text-primary-deep',
  warning: 'border-warning-soft bg-warning-soft text-warning',
  danger: 'border-danger bg-danger-soft text-danger-deep',
}

function Notice({ tone = 'info', className = '', children }) {
  return (
    <p
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`rounded-control border px-4 py-3 text-sm font-semibold ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </p>
  )
}

export default Notice
