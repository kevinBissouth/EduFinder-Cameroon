from django.db import models
from django.utils import timezone

from edufinder.models.enums import UserRole

ROLE_MAX_LENGTH = 20


# Compte de connexion : manager ou super_admin. Le mot de passe n'est jamais
# stocké en clair, seulement son hash bcrypt.
class User(models.Model):
    id_user = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, unique=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=ROLE_MAX_LENGTH, choices=UserRole.choices)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "user"
