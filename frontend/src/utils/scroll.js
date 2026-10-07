// Le défilement suit le réglage CSS scroll-behavior : fluide par défaut,
// immédiat si l'utilisateur a demandé à réduire les animations.
export function scrollToSection(sectionId) {
  document.getElementById(sectionId)?.scrollIntoView()
}
