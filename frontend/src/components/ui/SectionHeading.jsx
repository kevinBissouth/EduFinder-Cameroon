const TONE_CLASSES = {
  default: { eyebrow: 'text-primary-deep', title: 'text-navy', lead: 'text-ink' },
  // Titre posé sur une section bleu nuit.
  onNavy: { eyebrow: 'text-violet', title: 'text-white', lead: 'text-on-navy-soft' },
}

// Petit libellé en capitales au-dessus d'un titre : il nomme la rubrique.
export function Eyebrow({ tone = 'default', children }) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-eyebrow ${TONE_CLASSES[tone].eyebrow}`}
    >
      {children}
    </p>
  )
}

// Mot mis en avant dans un grand titre : italique de la police de titre.
export function Emphasis({ children }) {
  return <em className="text-primary">{children}</em>
}

const TITLE_SIZE_CLASSES = {
  lg: 'text-3xl sm:text-5xl',
  // À l'intérieur d'une fiche, les titres de section sont plus discrets.
  md: 'text-2xl sm:text-3xl',
}

// En-tête commun des sections : rubrique, grand titre serif, phrase d'accroche.
function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = 'default',
  size = 'lg',
  as: TitleElement = 'h2',
}) {
  const toneClasses = TONE_CLASSES[tone]

  return (
    <div>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <TitleElement
        className={`mt-4 text-balance font-display leading-display tracking-tight ${TITLE_SIZE_CLASSES[size]} ${toneClasses.title}`}
      >
        {title}
      </TitleElement>
      {lead && (
        <p className={`mt-5 max-w-[60ch] text-pretty text-base sm:text-lg ${toneClasses.lead}`}>
          {lead}
        </p>
      )}
    </div>
  )
}

export default SectionHeading
