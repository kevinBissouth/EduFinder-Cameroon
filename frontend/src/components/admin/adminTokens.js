// Palette et recette « verre » de l'espace super admin : reproduction fidèle
// du template Templatemo 607 Glass Admin (mode sombre uniquement). Je centralise
// ici les classes Tailwind récurrentes (fond dégradé profond, carte verre,
// alignement) pour que chaque composant garde exactement la même identité.
export const GLASS_CARD =
  'rounded-[20px] border border-white/10 bg-white/5 backdrop-blur-[20px] relative overflow-hidden ' +
  'transition-all duration-300 ' +
  'hover:bg-white/8 hover:border-white/15 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3),0_0_40px_rgba(52,211,153,0.1)]'

// Liseré lumineux sur l'arête supérieure des cartes (::before du template).
export const GLASS_EDGE =
  'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent'

export const GLASS_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 ' +
  'backdrop-blur-[10px] text-white/80 transition-all duration-200 hover:bg-white/8 hover:border-[#34d399] hover:text-white'

export const APP_BACKGROUND =
  'min-h-screen text-[#f5f5f4] ' +
  'bg-[linear-gradient(135deg,#0d1a14_0%,#132419_50%,#1a2e23_100%)] ' +
  'bg-fixed'

// Orbes flottants flous en arrière-plan, comme les .orb du template.
export const ORBS =
  'pointer-events-none fixed inset-0 -z-10 overflow-hidden ' +
  '[&_.orb-1]:absolute [&_.orb-1]:h-[400px] [&_.orb-1]:w-[400px] [&_.orb-1]:rounded-full ' +
  '[&_.orb-1]:bg-[#059669] [&_.orb-1]:opacity-40 [&_.orb-1]:blur-[80px] [&_.orb-1]:animate-float ' +
  '[&_.orb-1]:left-[10%] [&_.orb-1]:top-[10%] ' +
  '[&_.orb-2]:absolute [&_.orb-2]:h-[350px] [&_.orb-2]:w-[350px] [&_.orb-2]:rounded-full ' +
  '[&_.orb-2]:bg-[#d4a574] [&_.orb-2]:opacity-40 [&_.orb-2]:blur-[80px] [&_.orb-2]:animate-float ' +
  '[&_.orb-2]:right-[10%] [&_.orb-2]:top-[60%] [&_.orb-2]:[animation-delay:-5s] ' +
  '[&_.orb-3]:absolute [&_.orb-3]:h-[300px] [&_.orb-3]:w-[300px] [&_.orb-3]:rounded-full ' +
  '[&_.orb-3]:bg-[#e07a5f] [&_.orb-3]:opacity-40 [&_.orb-3]:blur-[80px] [&_.orb-3]:animate-float ' +
  '[&_.orb-3]:bottom-[10%] [&_.orb-3]:left-[30%] [&_.orb-3]:[animation-delay:-10s]'

export const STATUS_COLORS = {
  pending: { label: 'bg-[rgba(245,158,11,0.15)] text-[#eab308]', dot: '#eab308' },
  approved: { label: 'bg-[rgba(16,185,129,0.15)] text-[#22c55e]', dot: '#22c55e' },
  rejected: { label: 'bg-[rgba(255,107,107,0.15)] text-[#ff6b6b]', dot: '#ff6b6b' },
  published: { label: 'bg-[rgba(16,185,129,0.15)] text-[#22c55e]', dot: '#22c55e' },
  suspended: { label: 'bg-white/10 text-white/60', dot: '#94a3b8' },
  draft: { label: 'bg-white/10 text-white/60', dot: '#94a3b8' },
}
