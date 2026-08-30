import {
  BookOpenIcon,
  GlobeIcon,
  GradCapIcon,
  MapPinIcon,
  ScaleIcon,
  WalletIcon,
  WrenchIcon,
} from '../icons'

// Petite icône photo locale (pas d'icône photo dans la bibliothèque du projet).
const PhotoCountIcon = ({ className = 'h-5 w-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m3 17 5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Fiche de faits rapides de la sidebar : en-tête en dégradé vert, rangées
// d'icônes et valeurs factuelles de l'établissement. Ne montre que les faits
// réellement renseignés (principe : jamais de valeur inventée).
function QuickFactsSidebar({
  type,
  sector,
  linguisticSection,
  locationText,
  minFee,
  programCount,
  serviceCount,
  photoCount,
}) {
  const facts = [
    { icon: GradCapIcon, label: 'Level', value: type },
    { icon: ScaleIcon, label: 'Sector', value: sector },
    { icon: GlobeIcon, label: 'Language', value: linguisticSection },
    { icon: MapPinIcon, label: 'Location', value: locationText },
    {
      icon: WalletIcon,
      label: 'Tuition from',
      value: minFee != null ? `${Number(minFee).toLocaleString('en-US')} FCFA` : null,
    },
    { icon: BookOpenIcon, label: 'Programs', value: programCount > 0 ? `${programCount}` : null },
    { icon: WrenchIcon, label: 'Services', value: serviceCount > 0 ? `${serviceCount}` : null },
    { icon: PhotoCountIcon, label: 'Photos', value: photoCount > 0 ? `${photoCount}` : null },
  ].filter((fact) => fact.value)

  if (facts.length === 0) return null

  return (
    <aside className="overflow-hidden rounded-[14px] border border-[#e7ece9] bg-white shadow-[0_4px_24px_rgba(10,94,61,0.055)]">
      <div className="bg-[linear-gradient(120deg,#0a5e3d,#0d7a4f)] px-6 py-4">
        <h2 className="font-display text-lg font-bold text-white">Quick facts</h2>
      </div>
      <ul className="divide-y divide-[#eef3f0]">
        {facts.map((fact) => (
          <li key={fact.label} className="flex items-center gap-4 px-6 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d7a4f]/10 text-[#0d7a4f]">
              <fact.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98a2ac]">
                {fact.label}
              </p>
              <p className="truncate text-sm font-semibold text-[#081220]">{fact.value}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default QuickFactsSidebar