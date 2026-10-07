from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

from config import views

urlpatterns = [
    path("health", views.health, name="health"),
    path("", include("edufinder.urls")),
]

# static() ne renvoie des routes que si DEBUG est actif : en développement
# Django sert lui-même les fichiers téléversés, en production c'est le serveur
# web qui doit servir MEDIA_ROOT sur /media.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
