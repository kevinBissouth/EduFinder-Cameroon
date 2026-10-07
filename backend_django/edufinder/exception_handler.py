from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

from edufinder.services.proposals import ProposalError

# Erreurs métier levées par les services : elles deviennent une réponse dont
# « detail » porte leur message.
_BUSINESS_ERROR_STATUSES = {
    ProposalError: status.HTTP_422_UNPROCESSABLE_ENTITY,
}


def handle_api_exception(exception: Exception, context: dict) -> Response | None:
    for business_error_class, response_status in _BUSINESS_ERROR_STATUSES.items():
        if isinstance(exception, business_error_class):
            return Response({"detail": str(exception)}, status=response_status)
    response = exception_handler(exception, context)
    if response is None:
        return None
    # DRF répond 400 à une entrée invalide ; le contrat de cette API (et le
    # frontend) attend 422, comme pour l'ancien backend. Le corps de l'erreur
    # reste celui de DRF : {champ: [messages]}.
    if isinstance(exception, ValidationError):
        response.status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    return response
