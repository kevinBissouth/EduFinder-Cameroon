"""Supprime les notifications lues depuis plus de 90 jours.

Usage (depuis backend_django/) :
    python manage.py purge_read_notifications

Lancée chaque jour par une tâche planifiée de l'hébergeur. Une notification
jamais lue reste, si vieille soit-elle : son destinataire ne l'a pas encore vue.
"""
from django.core.management.base import BaseCommand

from edufinder.services.notifications import (
    READ_NOTIFICATION_RETENTION_DAYS,
    purge_old_read_notifications,
)


class Command(BaseCommand):
    help = "Delete the notifications read more than 90 days ago."

    def handle(self, *args, **options) -> None:
        deleted_count = purge_old_read_notifications()
        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {deleted_count} read notification(s) older than "
                f"{READ_NOTIFICATION_RETENTION_DAYS} days."
            )
        )
