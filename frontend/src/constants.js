const DEVELOPMENT_API_PORT = 8000

// Sans VITE_API_URL, l'API est cherchée sur la machine qui sert la page, car
// le cookie de session n'est renvoyé qu'à un hôte identique à celui de la
// page. En développement, Vite sert l'interface et Django écoute à côté, sur
// son propre port : le site marche tel quel sur localhost comme depuis un
// téléphone du même réseau. Une fois compilé, le site est servi par Django
// lui-même : l'API est alors à la même adresse que la page, port compris.
const DEVELOPMENT_API_URL = `${window.location.protocol}//${window.location.hostname}:${DEVELOPMENT_API_PORT}`
const SAME_ORIGIN_API_URL = window.location.origin

export const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? DEVELOPMENT_API_URL : SAME_ORIGIN_API_URL)
