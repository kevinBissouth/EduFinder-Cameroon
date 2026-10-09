const VARIANT_CLASSES = {
  primary: 'bg-primary text-white shadow-glow hover:bg-primary-deep',
  // Action réservée aux établissements, comme le bouton ambre de l'en-tête.
  accent: 'bg-accent text-navy hover:bg-surface',
  // Pour un bouton posé sur un aplat coloré ou sombre.
  inverse: 'bg-surface text-primary-deep shadow-raised hover:bg-primary-soft',
  secondary: 'border border-line bg-surface text-navy hover:border-primary hover:text-primary-deep',
  ghost: 'text-primary-deep hover:bg-primary-soft',
}

// 44 px de haut au minimum : c'est la taille de cible tactile recommandée.
const SIZE_CLASSES = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-6 text-sm',
}

function Button({
  as: Element = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...elementProps
}) {
  const buttonType = Element === 'button' ? { type: elementProps.type ?? 'button' } : {}

  return (
    <Element
      {...elementProps}
      {...buttonType}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-button font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </Element>
  )
}

export default Button
