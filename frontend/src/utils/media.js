import { API_URL } from '../constants'

// L'API renvoie des chemins relatifs (/media/…) : les fichiers sont servis
// par le backend, pas par le site.
export function toMediaUrl(mediaPath) {
  return mediaPath.startsWith('http') ? mediaPath : `${API_URL}${mediaPath}`
}
