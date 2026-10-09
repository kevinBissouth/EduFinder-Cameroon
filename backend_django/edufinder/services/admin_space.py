"""Espace super administrateur : vue d'ensemble des soumissions et des
établissements."""
from django.db.models import Prefetch, QuerySet

from edufinder.models import (
    Establishment,
    Submission,
    SubmissionStatus,
    UserEstablishment,
)
from edufinder.services.submissions import describe_submissions
from edufinder.services.summary_aggregates import with_cover_url
from edufinder.services.suspension import with_latest_suspension_reason


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
    establishments = Establishment.objects.select_related("city", "type", "sector")
    return (
        with_latest_suspension_reason(with_cover_url(establishments))
        .prefetch_related(Prefetch("user_establishments", queryset=ordered_ownerships))
        .order_by("name")
    )
