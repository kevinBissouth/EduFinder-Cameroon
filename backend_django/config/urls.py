from django.urls import include, path

from config import views

urlpatterns = [
    path("health", views.health, name="health"),
    path("", include("edufinder.urls")),
]
