import { useEffect, useState } from 'react'

// Loader « core spin » aux couleurs de la marque : anneaux concentriques en
// rotation, satellite orbital et cœur pulsant. Le texte défile en boucle.
const LOADING_STATES = [
  'Loading...',
  'Fetching schools..',
  'Syncing...',
  'Processing..',
  'Almost there...',
]

export function CoreSpinLoader({ label }) {
  const [loadingText, setLoadingText] = useState(label || LOADING_STATES[0])

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_STATES.length
      setLoadingText(LOADING_STATES[i])
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex min-h-50 flex-col items-center justify-center gap-8">
      <div className="relative flex h-20 w-20 items-center justify-center">
        {/* Halo de base */}
        <div className="absolute inset-0 animate-pulse rounded-full bg-[#2ec27e]/15 blur-xl" />

        {/* Anneau pointillé extérieur */}
        <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border border-dashed border-[#2ec27e]/40" />

        {/* Arc principal */}
        <div className="absolute inset-1 animate-[spin_2s_linear_infinite] rounded-full border-2 border-transparent border-t-[#0d7a4f] shadow-[0_0_6px_rgba(13,122,79,0.5)]" />

        {/* Arc inverse doré */}
        <div className="absolute inset-3 animate-[spin_3s_linear_infinite_reverse] rounded-full border-2 border-transparent border-b-[#d9a406] shadow-[0_0_6px_rgba(217,164,6,0.4)]" />

        {/* Anneau intérieur rapide */}
        <div className="absolute inset-5 animate-[spin_1s_ease-in-out_infinite] rounded-full border border-transparent border-l-[#0a5e3d]/60" />

        {/* Satellite orbital */}
        <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
          <div className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-[#0a5e3d] shadow-[0_0_4px_rgba(13,122,79,0.9)]" />
        </div>

        {/* Cœur central */}
        <div className="absolute h-2 w-2 animate-pulse rounded-full bg-[#0d7a4f] shadow-[0_0_6px_rgba(13,122,79,0.6)]" />
      </div>

      {/* Texte défilant */}
      <div className="flex h-8 flex-col items-center justify-center gap-1">
        <span
          key={loadingText}
          className="animate-fade-up text-[10px] font-medium uppercase tracking-[0.3em] text-[#0a5e3d]"
        >
          {loadingText}
        </span>
      </div>
    </div>
  )
}
