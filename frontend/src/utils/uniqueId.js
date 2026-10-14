// Identifiant pour distinguer des éléments à l'écran (lignes d'un formulaire,
// messages temporaires). Il n'est jamais envoyé au serveur et n'a aucun rôle
// de sécurité.
//
// crypto.randomUUID n'existe que sur une adresse sécurisée (https ou
// localhost) : ouvert en http depuis un téléphone du réseau local, le site ne
// l'a pas. Je retombe alors sur un compteur, unique tant que la page vit.
const FALLBACK_PREFIX = 'local'
let fallbackCount = 0

export function createUniqueId(cryptoSource = globalThis.crypto) {
  if (typeof cryptoSource?.randomUUID === 'function') return cryptoSource.randomUUID()
  fallbackCount += 1
  return `${FALLBACK_PREFIX}-${fallbackCount}`
}
