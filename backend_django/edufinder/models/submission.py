from django.db import models
from django.utils import timezone

from edufinder.models.enums import (
    DecisionStatus,
    EstablishmentStatus,
    SubmissionStatus,
    SubmissionType,
)
from edufinder.models.establishment import Establishment
from edufinder.models.identifiers import PUBLIC_UUID_LENGTH, generate_public_uuid
from edufinder.models.user import User

CHOICE_MAX_LENGTH = 20
REASON_MAX_LENGTH = 500


# Demande de création ou modification d'un établissement, soumise par un
# manager et en attente de décision. Le contenu complet des changements est
# stocké en JSON dans `content`.
class Submission(models.Model):
    id_submission = models.AutoField(primary_key=True)
    # Identifiant public de la soumission : l'admin et le responsable
    # manipulent cet UUID, jamais la clé interne.
    uuid = models.CharField(max_length=PUBLIC_UUID_LENGTH, default=generate_public_uuid)
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        db_column="id_user",
        related_name="submissions",
    )
    establishment = models.ForeignKey(
        Establishment,
        on_delete=models.PROTECT,
        db_column="id_establishment",
        related_name="submissions",
    )
    submitted_at = models.DateTimeField(default=timezone.now)
    type = models.CharField(max_length=CHOICE_MAX_LENGTH, choices=SubmissionType.choices)
    status = models.CharField(
        max_length=CHOICE_MAX_LENGTH, choices=SubmissionStatus.choices
    )
    # Une soumission création/modification sans contenu n'a aucun sens : le
    # payload JSON est obligatoire, y compris en base (pas seulement côté API).
    content = models.JSONField()

    class Meta:
        db_table = "submission"
        constraints = [
            models.UniqueConstraint(fields=["uuid"], name="uq_submission_uuid"),
        ]


# Décision (approbation ou refus avec motif) portée par un super_admin sur
# une soumission.
class ValidationDecision(models.Model):
    id_decision = models.AutoField(primary_key=True)
    # Relation 1-pour-1 : l'unicité interdit deux décisions pour la même
    # soumission (une révision = une nouvelle soumission).
    submission = models.OneToOneField(
        Submission,
        on_delete=models.PROTECT,
        db_column="id_submission",
        related_name="decision",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        db_column="id_user",
        related_name="decisions",
    )
    decided_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(
        max_length=CHOICE_MAX_LENGTH, choices=DecisionStatus.choices
    )
    rejection_reason = models.CharField(
        max_length=REASON_MAX_LENGTH, null=True, blank=True
    )

    class Meta:
        db_table = "validation_decision"


# Historique des changements de statut décidés directement par un super_admin
# (suspension, réactivation). Ces actions ne passent par aucune soumission,
# donc validation_decision ne peut pas les porter : je les trace ici pour
# savoir qui a fait quoi, quand et pourquoi.
class EstablishmentStatusChange(models.Model):
    id_status_change = models.AutoField(primary_key=True)
    establishment = models.ForeignKey(
        Establishment,
        on_delete=models.PROTECT,
        db_column="id_establishment",
        related_name="status_changes",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        db_column="id_user",
        related_name="status_changes",
    )
    changed_at = models.DateTimeField(default=timezone.now)
    previous_status = models.CharField(
        max_length=CHOICE_MAX_LENGTH, choices=EstablishmentStatus.choices
    )
    new_status = models.CharField(
        max_length=CHOICE_MAX_LENGTH, choices=EstablishmentStatus.choices
    )
    # Obligatoire pour une suspension (exigé par le schéma d'entrée), absent
    # pour une réactivation.
    reason = models.CharField(max_length=REASON_MAX_LENGTH, null=True, blank=True)

    class Meta:
        db_table = "establishment_status_change"
