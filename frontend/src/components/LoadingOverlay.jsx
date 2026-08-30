// Voile plein écran centré : s'affiche par-dessus la page pendant tout
// chargement (ouverture du site, fiche en cours de fetch…).
import { CoreSpinLoader } from './CoreSpinLoader'

export default function LoadingOverlay({ label }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-100 flex items-center justify-center bg-white/75 backdrop-blur-md"
    >
      <div className="rounded-3xl border border-[#e7ece9] bg-white/90 px-24 py-16 shadow-[0_22px_54px_rgba(8,18,32,0.12)]">
        <CoreSpinLoader label={label} />
      </div>
    </div>
  )
}
