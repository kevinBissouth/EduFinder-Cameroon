
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000' 

export const DESTINATION_GRADIENTS = [
  'from-[#0a5e3d] to-[#0d7a4f]',
  'from-[#d9a406] to-[#f2c14e]',
  'from-[#0e7490] to-[#22d3ee]',
  'from-[#b45309] to-[#fbbf24]',
  'from-[#be185d] to-[#fb7185]',
]

// Chaque établissement reçoit une identité de couleur stable (comme la palette
// « pal » du maquettage search.html), choisie par hachage de son id.
export const PALETTES = [
  ['#0D7A4F', '#1E9A68'],
  ['#D6453D', '#E87B74'],
  ['#D9A406', '#F2C14E'],
  ['#2A3E8F', '#4A63C4'],
  ['#7C3AED', '#A78BFA'],
  ['#0E7490', '#22D3EE'],
  ['#BE185D', '#FB7185'],
  ['#B45309', '#F59E0B'],
]

// Items de navigation principaux. Le sous-menu « Explore » est peuplé
// dynamiquement depuis meta.featured_type_ids (backend), jamais figé ici.
export const NAV_ITEMS = [
  { label: 'Home', href: '#' },
  { label: 'Explore', href: '#results' },
  { label: 'Compare', href: '#results' },
  {
    label: 'Resources',
    href: '#how-it-works',
    items: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Contact us', href: '#footer' },
      { label: 'FAQ', href: '#' },
    ],
  },
]