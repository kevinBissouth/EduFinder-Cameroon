import { MailIcon, PhoneIcon } from '../icons'

// Carte d'appel à l'action de la maquette : fond menthe pâle et bouton doré.
// Le bouton ouvre le canal de contact réel de l'établissement (priorité à
// l'email d'admission, sinon téléphone) — jamais un lien inventé.
function InterestCta({ name, phone, contactEmail }) {
  const href = contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent(`Admission request — ${name}`)}`
    : phone
      ? `tel:${phone}`
      : null
  if (!href) return null

  const Icon = contactEmail ? MailIcon : PhoneIcon
  const label = contactEmail ? 'Request admission details' : 'Call the school'

  return (
    <aside className="rounded-[14px] border border-[#dcebe3] bg-[#f0f8f4] px-7 py-7 text-center shadow-[0_4px_24px_rgba(10,94,61,0.055)]">
      <h2 className="font-display text-xl font-bold text-[#081220]">
        Interested in this school?
      </h2>
      <p className="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-[#5b6670]">
        Reach the establishment directly for admission requirements and
        enrollment dates.
      </p>
      <a
        href={href}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d9a406] px-7 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(217,164,6,0.35)] transition-colors hover:bg-[#c29105]"
      >
        <Icon className="h-4 w-4" />
        {label}
      </a>
    </aside>
  )
}

export default InterestCta