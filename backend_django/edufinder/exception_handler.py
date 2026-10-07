from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler


# DRF répond 400 à une entrée invalide ; le contrat de cette API (et le
# frontend) attend 422, comme pour l'ancien backend. Le corps de l'erreur
# reste celui de DRF : {champ: [messages]}.
def handle_api_exception(exception: Exception, context: dict) -> Response | None:
    response = exception_handler(exception, context)
    if response is None:
        return None
    if isinstance(exception, ValidationError):
        response.status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    return response
