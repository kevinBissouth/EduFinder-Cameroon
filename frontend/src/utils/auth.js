import axios from 'axios'

import { API_URL } from '../constants'

// Le token vit exclusivement dans un cookie httpOnly posé par /auth/login :
// il n'est jamais lisible ni stockable en JavaScript, ce qui neutralise le
// vol de session par XSS. Toutes les requêtes partent avec withCredentials
// pour que le navigateur joigne le cookie automatiquement.

export async function requestLogin(emailValue, passwordValue) {
  const formPayload = new URLSearchParams()
  formPayload.set('username', emailValue)
  formPayload.set('password', passwordValue)

  const response = await axios.post(`${API_URL}/auth/login`, formPayload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    withCredentials: true,
  })
  return response.data
}

export async function fetchAuthenticatedProfile() {
  const response = await axios.get(`${API_URL}/auth/me`, {
    withCredentials: true,
  })
  return response.data
}

// Requête privée générique : l'authentification passe par le cookie httpOnly.
// Toute erreur HTTP est laissée à l'appelant (le message serveur « detail »
// est affiché).
export function authedRequest(method, url, body = undefined) {
  return axios({
    method,
    url: `${API_URL}${url}`,
    data: body,
    withCredentials: true,
  }).then((response) => response.data)
}

// Déconnexion : le cookie httpOnly ne peut pas être effacé depuis le JS,
// c'est le serveur qui demande son expiration au navigateur.
export function clearAuthToken() {
  return axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true })
}