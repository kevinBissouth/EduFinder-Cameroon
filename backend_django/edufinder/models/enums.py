from django.db import models


class UserRole(models.TextChoices):
    MANAGER = "manager"
    SUPER_ADMIN = "super_admin"


class EstablishmentStatus(models.TextChoices):
    PENDING = "pending"
    PUBLISHED = "published"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class SubmissionStatus(models.TextChoices):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DecisionStatus(models.TextChoices):
    APPROVED = "approved"
    REJECTED = "rejected"


class SubmissionType(models.TextChoices):
    CREATION = "creation"
    MODIFICATION = "modification"


class MediaType(models.TextChoices):
    IMAGE = "image"
    PDF = "pdf"
    VIDEO = "video"


class NotificationKind(models.TextChoices):
    SUBMISSION_RECEIVED = "submission_received"
    SUBMISSION_APPROVED = "submission_approved"
    SUBMISSION_REJECTED = "submission_rejected"
    ESTABLISHMENT_SUSPENDED = "establishment_suspended"
    ESTABLISHMENT_REACTIVATED = "establishment_reactivated"
