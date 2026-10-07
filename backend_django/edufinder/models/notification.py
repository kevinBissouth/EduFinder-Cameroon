from django.db import models
from django.utils import timezone

from edufinder.models.enums import NotificationKind
from edufinder.models.establishment import Establishment
from edufinder.models.identifiers import PUBLIC_UUID_LENGTH, generate_public_uuid
from edufinder.models.submission import REASON_MAX_LENGTH, Submission
from edufinder.models.user import User

KIND_MAX_LENGTH = 40


# Message adressé à un compte après un événement du circuit de validation.
# Je ne stocke pas de phrase toute faite : le type d'événement et ses liens
# suffisent, l'interface compose le texte. Aucune donnée sensible n'y figure.
class Notification(models.Model):
    id_notification = models.AutoField(primary_key=True)
    uuid = models.CharField(max_length=PUBLIC_UUID_LENGTH, default=generate_public_uuid)
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column="id_recipient",
        related_name="notifications",
    )
    kind = models.CharField(max_length=KIND_MAX_LENGTH, choices=NotificationKind.choices)
    establishment = models.ForeignKey(
        Establishment,
        on_delete=models.CASCADE,
        db_column="id_establishment",
        related_name="notifications",
    )
    # Absent pour une suspension ou une réactivation, qui ne passent par
    # aucune soumission.
    submission = models.ForeignKey(
        Submission,
        on_delete=models.CASCADE,
        db_column="id_submission",
        related_name="notifications",
        null=True,
        blank=True,
    )
    # Motif d'un refus ou d'une suspension, recopié tel qu'il a été saisi.
    reason = models.CharField(max_length=REASON_MAX_LENGTH, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    # Vide tant que le destinataire n'a pas lu la notification.
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notification"
        constraints = [
            models.UniqueConstraint(fields=["uuid"], name="uq_notification_uuid"),
        ]
        indexes = [
            models.Index(
                fields=["recipient", "read_at"], name="ix_notification_recipient"
            ),
        ]
