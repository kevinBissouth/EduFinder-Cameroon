import { GLASS_CARD, GLASS_EDGE, STATUS_COLORS } from './adminTokens'

// Carte « verre » sombre de l'espace super admin : fond translucide, flou,
// fine bordure et liseré lumineux supérieur, comme .glass-card du template.
export function AdminGlassCard({ className = '', children, ...rest }) {
  return (
    <section className={`${GLASS_CARD} ${GLASS_EDGE} ${className}`} {...rest}>
      {children}
    </section>
  )
}

// Chef d'en-tête d'une carte : titre, sous-titre éventuel et zone d'actions.
export function AdminCardHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-[18px] font-semibold text-[#f5f5f4]">{title}</h3>
        {subtitle && <p className="mt-1 text-[13px] text-white/40">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}

// Badge de statut assorti au thème sombre : pastille lumineuse + texte de
// couleur franche sur fond translucide (pattern .status-badge du template).
export function AdminStatusBadge({ status }) {
  const config = STATUS_COLORS[status] ?? STATUS_COLORS.draft
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[20px] px-3 py-1 text-[12px] font-medium ${config.label}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: config.dot, boxShadow: `0 0 8px ${config.dot}` }}
      />
      {status.replace('_', ' ')}
    </span>
  )
}
