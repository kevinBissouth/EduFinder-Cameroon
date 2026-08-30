import { useEffect, useState } from 'react'

import { useInView } from '../../hooks/useInView'
import {
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from '../icons'
import { SHADOW_1, SHADOW_2 } from './helpers'

// Coordonnées de l'établissement au-dessus de la carte (chargée à l'apparition,
// interactive seulement après un clic sur desktop pour ne pas gêner le scroll).
function ContactSection({
  name,
  address,
  phone,
  contactEmail,
  website,
  latitude,
  longitude,
  locationText,
}) {
  const [mapInteractive, setMapInteractive] = useState(false)
  // Sur mobile, pas de verrou : pinch & déplacement natifs immédiats.
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  )
  const [mapRef, mapInView] = useInView(0.05)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = (event) => setIsMobileViewport(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const mapActive = mapInteractive || isMobileViewport

  useEffect(() => {
    if (!mapInteractive) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') setMapInteractive(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mapInteractive])

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

      <div
        className={`relative mt-6 overflow-hidden rounded-2xl border border-[#e7ece9] bg-white ${SHADOW_1}`}
      >
        {/* Coordonnées en rangée compacte au-dessus de la carte */}
        <div className="grid gap-x-10 gap-y-5 p-5 sm:grid-cols-3 sm:p-7">
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

        {/* Carte en dessous, hauteur maîtrisée pour ne pas envahir */}
        <div
          ref={mapRef}
          onClick={() => {
            if (!isMobileViewport) setMapInteractive(true)
          }}
          onMouseLeave={() => {
            if (!isMobileViewport) setMapInteractive(false)
          }}
          className={`relative h-64 w-full border-t border-[#e7ece9] bg-[#eaf1ee] sm:h-72 ${
            mapActive ? '' : 'cursor-pointer'
          }`}
        >
          {mapInView && latitude != null && longitude != null ? (
            <div className="absolute inset-0">
            <iframe
              title={`Map — ${name}`}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(
                longitude,
              ) - 0.01}%2C${Number(latitude) - 0.01}%2C${Number(longitude) + 0.01}%2C${Number(
                latitude,
              ) + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`}
              className={`absolute inset-0 h-full w-full border-0 ${
                mapActive ? '' : 'pointer-events-none'
              }`}
              loading="lazy"
              allowFullScreen
            />
            <a
              href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 z-10 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-[#0d7a4f] shadow-sm transition-colors hover:bg-white"
            >
              View on OpenStreetMap
            </a>
            {!isMobileViewport && (
              <span
                className={`absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm ${
                  mapInteractive
                    ? 'bg-[#0d7a4f] text-white'
                    : 'bg-white/95 text-[#343a44]'
                }`}
              >
                {mapInteractive
                  ? 'Ctrl + scroll to zoom · +/- · Esc to exit'
                  : 'Click to activate the map'}
              </span>
            )}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <svg
                viewBox="0 0 200 200"
                preserveAspectRatio="xMidYMid slice"
                className="absolute inset-0 h-full w-full opacity-60"
                aria-hidden="true"
              >
                <path d="M0 60 H200" stroke="#ffffff" strokeWidth="6" />
                <path d="M0 130 H200" stroke="#ffffff" strokeWidth="4" />
                <path d="M60 0 V200" stroke="#ffffff" strokeWidth="6" />
                <path d="M130 0 V200" stroke="#ffffff" strokeWidth="4" />
                <path d="M0 0 L200 200" stroke="#dbe7e1" strokeWidth="2" />
              </svg>
              <div
                className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#0d7a4f] text-white ${SHADOW_2}`}
              >
                <MapPinIcon className="h-6 w-6" />
              </div>
              <p className="relative z-10 text-sm font-semibold text-[#0a5e3d]">
                {locationText || name}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ContactSection
