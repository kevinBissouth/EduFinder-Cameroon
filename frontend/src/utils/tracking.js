import axios from 'axios'

import { API_URL } from '../constants'

const ROUTE_BY_EVENT = { view: 'track-view', inquiry: 'track-inquiry' }

// Signale une visite ou une demande de contact au serveur, qui dédoublonne.
// L'échec est volontairement ignoré : ces compteurs servent au responsable,
// et un visiteur ne doit jamais voir sa consultation gênée par leur panne.
export function trackInstitutionEvent(institutionUuid, trackedEvent) {
  axios
    .post(`${API_URL}/institutions/${institutionUuid}/${ROUTE_BY_EVENT[trackedEvent]}`)
    .catch(() => {})
}
