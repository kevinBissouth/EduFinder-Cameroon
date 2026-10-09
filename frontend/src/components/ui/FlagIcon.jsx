import { useId } from 'react'

// Les couleurs d'un drapeau sont celles du drapeau, pas celles du thème :
// elles sont écrites ici en clair, et nulle part ailleurs.
const FLAG_CLASSES = 'h-3.5 w-5 shrink-0 rounded-sm ring-1 ring-black/10'

function FrenchFlag() {
  return (
    <svg viewBox="0 0 3 2" aria-hidden="true" className={FLAG_CLASSES}>
      <rect width="1" height="2" fill="#0055a4" />
      <rect x="1" width="1" height="2" fill="#ffffff" />
      <rect x="2" width="1" height="2" fill="#ef4135" />
    </svg>
  )
}

// Les diagonales rouges ne couvrent qu'une moitié de chaque bras de la croix
// blanche : la découpe (clipPath) leur donne ce décalage.
function BritishFlag() {
  const clipId = useId()

  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={FLAG_CLASSES}>
      <clipPath id={clipId}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${clipId})`} stroke="#c8102e" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#ffffff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  )
}

const FLAG_BY_LANGUAGE = { fr: FrenchFlag, en: BritishFlag }

// Drapeau associé à une langue du site. Purement décoratif : le nom de la
// langue est toujours écrit à côté.
function FlagIcon({ languageCode }) {
  const Flag = FLAG_BY_LANGUAGE[languageCode]
  return Flag ? <Flag /> : null
}

export default FlagIcon
