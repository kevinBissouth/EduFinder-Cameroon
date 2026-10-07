"""Espace super administrateur : vue d'ensemble des soumissions et des
établissements."""
from django.db.models import OuterRef, Prefetch, QuerySet, Subquery

from edufinder.models import (
    Establishment,
    EstablishmentStatus,
    EstablishmentStatusChange,
    Submission,
    SubmissionStatus,
    UserEstablishment,
)
from edufinder.services.submissions import describe_submissions


def list_submissions_by_status(submission_status: SubmissionStatus) -> QuerySet:
    return describe_submissions(Submission.objects.filter(status=submission_status))


def find_submission(submission_uuid: str) -> Submission | None:
    return describe_submissions(Submission.objects.filter(uuid=submission_uuid)).first()


# Un établissement peut être géré par plusieurs comptes : je précharge ses
# responsables en une seule requête pour toute la liste.
def list_establishments_with_owners() -> QuerySet:
    ordered_ownerships = UserEstablishment.objects.select_related("user").order_by(
        "user"
    )
    return (
        Establishment.objects.select_related("city", "type", "sector")
        .prefetch_related(Prefetch("user_establishments", queryset=ordered_ownerships))
        .annotate(latest_suspension_reason=Subquery(_latest_suspension_reason()))
        .order_by("name")
    )


def _latest_suspension_reason() -> QuerySet:
    return (
        EstablishmentStatusChange.objects.filter(
            establishment=OuterRef("pk"), new_status=EstablishmentStatus.SUSPENDED
        )
        .order_by("-id_status_change")
        .values("reason")[:1]
    )
