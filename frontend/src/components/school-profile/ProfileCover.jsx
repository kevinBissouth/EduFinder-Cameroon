import { useState } from 'react'

import { GlobeIcon, PhoneIcon, ShieldCheckIcon } from '../icons'

// Emblème 150×150 : photo de couverture en pastille carrée, ou initiales de
// l'établissement sur dégradé vert si aucune image n'est disponible.
function SchoolEmblem({ name, logoUrl }) {
  const [logoBroken, setLogoBroken] = useState(false)
  const initials = name
    .split(/\s+/)
    .filter((word) => /[A-Za-zÀ-ÿ]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

  if (logoUrl && !logoBroken) {
    return (
      <img
        src={logoUrl}
        alt={name}
        onError={() => setLogoBroken(true)}
        className="h-[150px] w-[150px] shrink-0 rounded-[30px] border-4 border-white object-cover shadow-[0_18px_40px_rgba(6,34,27,0.35)]"
      />
    )
  }

  return (
    <div className="flex h-[150px] w-[150px] shrink-0 items-center justify-center rounded-[30px] border-4 border-white bg-[linear-gradient(135deg,#0d7a4f,#0a3d2c)] font-display text-5xl font-bold text-white shadow-[0_18px_40px_rgba(6,34,27,0.35)]">
      {initials || 'EF'}
    </div>
  )
}

// Hero de la fiche : dégradé vert à gauche fondu vers la photo de l'établissement
// à droite (masque de fusion), puis bloc identité qui chevauche le bas du bandeau.
function ProfileCover({
  name,
  type,
  sector,
  linguisticSection,
  phone,
  website,
  logoUrl,
  coverUrl,
}) {
  const chips = [type, sector, linguisticSection].filter(Boolean)

  return (
    <div className="relative">
      <section className="relative h-[210px] w-full overflow-hidden sm:h-[240px]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0a3d2c_0%,#0a5e3d_38%,#0d7a4f_78%)]" />
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
            className="absolute inset-y-0 right-0 h-full w-[68%] object-cover"
            style={{
              WebkitMaskImage:
                'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 34%, #000 62%)',
              maskImage:
                'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 34%, #000 62%)',
            }}
          />
        )}
        {/* Halo doré décoratif, discret, sur la zone photo */}
        <div className="absolute right-8 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,164,6,0.25),transparent_70%)] blur-2xl" />
      </section>

      {/* Identité : emblème + nom + badge + puces à gauche, actions à droite */}
      <div className="relative z-10 mx-auto max-w-[1390px] px-4 sm:px-6 lg:px-[70px]">
        <div className="-mt-[90px] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <SchoolEmblem name={name} logoUrl={logoUrl} />
            <div className="min-w-0 pb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5f3ec] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0a5e3d]">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Verified institution
              </span>
              <h1 className="mt-20 font-display text-3xl font-bold leading-tight text-[#081220] sm:text-4xl">
                {name}
              </h1>
              {chips.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[#dcebe3] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#343a44]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {(phone || website) && (
            <div className="flex shrink-0 flex-wrap gap-3 pb-1">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#d9a406] px-6 text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(217,164,6,0.35)] transition-colors hover:bg-[#c29105]"
                >
                  <PhoneIcon className="h-4 w-4" />
                  Call
                </a>
              )}
              {website && (
                <a
                  href={`https://${website.replace(/^https?:\/\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0d7a4f] px-6 text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(10,94,61,0.3)] transition-colors hover:bg-[#0a5e3d]"
                >
                  <GlobeIcon className="h-4 w-4" />
                  Visit website
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileCover