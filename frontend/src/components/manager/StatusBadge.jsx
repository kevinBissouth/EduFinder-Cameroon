// Badge de statut d'une fiche ou d'une soumission : même palette partout
// dans l'espace responsable (pending ambre, published vert, rejected rouge).
const STATUS_STYLES = {
  pending: 'bg-[#fdf3dd] text-[#8a5b00] border-[#f2c14e]/50',
  approved: 'bg-[#e5f3ec] text-[#0a5e3d] border-[#0d7a4f]/40',
  published: 'bg-[#e5f3ec] text-[#0a5e3d] border-[#0d7a4f]/40',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  suspended: 'bg-gray-100 text-gray-600 border-gray-300',
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.suspended
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${style}`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
