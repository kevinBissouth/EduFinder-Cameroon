const API_PORT = 8000

// Sans VITE_API_URL, l'API est cherchée sur la machine qui sert la page : le
// site marche ainsi tel quel sur localhost comme depuis un téléphone du même
// réseau. Le cookie de session n'est renvoyé qu'à un hôte identique à celui de
// la page, d'où ce choix. En production, VITE_API_URL doit être défini.
const SAME_HOST_API_URL = `${window.location.protocol}//${window.location.hostname}:${API_PORT}`

export const API_URL = import.meta.env.VITE_API_URL || SAME_HOST_API_URL
