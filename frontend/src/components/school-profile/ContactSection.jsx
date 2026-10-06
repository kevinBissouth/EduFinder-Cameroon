import {
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from '../icons'

// Coordonnées de l'établissement en rangée compacte. La mini-carte a été
// retirée pour l'instant (perspectives) : l'adresse textuelle suffit.
function ContactSection({ address, phone, contactEmail, website }) {
  const contactRows = [
    address && {
      key: 'address',
      label: 'Address',
      icon: <MapPinIcon />,
      content: <span className="leading-relaxed">{address}</span>,
    },
    phone && {
      key: 'phone',
      label: 'Phone',
      icon: <PhoneIcon />,
      content: (
        <a href={`tel:${phone}`} className="font-medium transition-colors hover:text-[#0d7a4f]">
          {phone}
        </a>
      ),
    },
    contactEmail && {
      key: 'email',
      label: 'Email',
      icon: <MailIcon />,
      content: (
        <a
          href={`mailto:${contactEmail}`}
          className="font-medium text-[#0d7a4f] hover:underline"
        >
          {contactEmail}
        </a>
      ),
    },
    website && {
      key: 'website',
      label: 'Website',
      icon: <GlobeIcon />,
      content: (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-medium transition-colors hover:text-[#0d7a4f]"
        >
          {website}
        </a>
      ),
    },
  ].filter(Boolean)

  return (
    <section id="contact" className="scroll-mt-40">
      <h2 className="font-display text-3xl text-[#081220]">Location &amp; contact</h2>

      <div className="mt-6 rounded-2xl border border-[#e7ece9] bg-white p-5 sm:p-7">
        <div className="grid gap-x-10 gap-y-5 sm:grid-cols-3">
          {contactRows.map((row) => (
            <div key={row.key} className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0d7a4f]/10 text-[#0d7a4f]">
                {row.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#98a2ac]">
                  {row.label}
                </p>
                <div className="mt-0.5 break-words text-sm text-[#343a44]">
                  {row.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ContactSection
