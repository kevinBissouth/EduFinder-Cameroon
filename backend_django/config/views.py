from django.db import connection
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def health(request):
    # La requête échoue (500) si la base est injoignable : c'est le signal
    # attendu par une sonde de supervision.
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    return Response({"status": "ok", "database": "connected"})
