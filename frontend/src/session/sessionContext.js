import { createContext } from 'react'

// Le compte connecté, ou null. Le site public s'en sert pour proposer
// « Mon espace » au lieu de la connexion ; il ne décide d'aucun accès : c'est
// le serveur qui vérifie chaque requête privée.
export const SessionContext = createContext(null)
