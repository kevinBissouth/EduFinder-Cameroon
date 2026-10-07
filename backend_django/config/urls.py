from django.urls import path

from config import views

urlpatterns = [
    path("health", views.health, name="health"),
]
