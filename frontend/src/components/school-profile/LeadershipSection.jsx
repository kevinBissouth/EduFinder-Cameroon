import { API_URL } from '../../constants'

// Responsable de l'établissement (directeur / proviseur) : présenté comme une
// courte bio, distinct du compte du gestionnaire. Masqué si aucune donnée.
function initialsOf(fullName) {
  if (!fullName) return '—'
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

function LeadershipSection({ directorName, directorTitle, directorBio, directorPhotoUrl }) {
  if (!directorName && !directorTitle && !directorBio && !directorPhotoUrl) return null

  const photoSrc = directorPhotoUrl ? `${API_URL}${directorPhotoUrl}` : null

  return (
    <section id="leadership" className="scroll-mt-40">
      <h2 className="font-display text-3xl text-[#081220]">Leadership</h2>
      <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-[#e7ece9] bg-gradient-to-b from-[#f7fbf9] to-white p-6 sm:flex-row sm:items-center">
        {photoSrc ? (
          <img
            src={photoSrc}
            alt={directorName || 'Director'}
            className="h-20 w-20 shrink-0 rounded-full border-4 border-white object-cover shadow-[0_6px_18px_rgba(13,122,79,0.18)]"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#0d7a4f] text-xl font-bold text-white">
            {initialsOf(directorName)}
          </div>
        )}
        <div>
          {directorName && (
            <p className="text-lg font-semibold text-[#081220]">{directorName}</p>
          )}
          {directorTitle && (
            <p className="text-sm text-[#5b6670]">{directorTitle}</p>
          )}
          {directorBio && (
            <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-[#343a44]">
              {directorBio}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default LeadershipSection
