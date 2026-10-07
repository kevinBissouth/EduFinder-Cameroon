"""Espace responsable : établissements confiés, soumissions et comparaison
avec les établissements publiés du même type."""
from django.db.models import Avg, Count, Exists, Max, OuterRef, QuerySet

from edufinder.models import (
    Establishment,
    Submission,
    SubmissionStatus,
    User,
    UserEstablishment,
    UserRole,
)
from edufinder.services.public_institutions import with_profile_relations
from edufinder.services.submissions import describe_submissions
from edufinder.services.summary_aggregates import (
    with_cover_url,
    with_tuition_and_pass_rate,
)


# Règle d'autorisation du cahier des besoins : un responsable n'accède qu'aux
# établissements qui lui sont associés dans user_establishment. Le super
# administrateur, lui, les supervise tous.
def user_manages_establishment(user: User, establishment: Establishment) -> bool:
    if user.role == UserRole.SUPER_ADMIN:
        return True
    return UserEstablishment.objects.filter(
        user=user, establishment=establishment
    ).exists()


def list_managed_establishments(user: User) -> QuerySet:
    managed_establishments = Establishment.objects.filter(
        user_establishments__user=user
    ).select_related("city", "type", "sector")
    return (
        with_cover_url(with_pending_submission_flag(managed_establishments))
        .annotate(latest_fee_school_year=Max("fees__school_year"))
        .order_by("name")
    )


def managed_establishment_profiles() -> QuerySet:
    return with_pending_submission_flag(with_profile_relations(Establishment.objects.all()))


def with_pending_submission_flag(establishments: QuerySet) -> QuerySet:
    return establishments.annotate(
        has_pending_submission=Exists(
            Submission.objects.filter(
                establishment=OuterRef("pk"), status=SubmissionStatus.PENDING
            )
        )
    )


def list_user_submissions(user: User) -> QuerySet:
    return describe_submissions(Submission.objects.filter(user=user))


# La comparaison ne porte que sur des établissements publiés : un responsable
# ne doit rien apprendre d'une fiche qui n'est pas publique. Tant que son
# propre établissement n'est pas publié, ses valeurs restent donc vides.
def compute_benchmarks(establishment: Establishment) -> dict:
    published_establishments = with_tuition_and_pass_rate(
        Establishment.objects.published()
    )
    own_values = (
        published_establishments.filter(pk=establishment.pk)
        .values("min_tuition", "best_pass_rate")
        .first()
    ) or {}
    same_type_values = published_establishments.filter(
        type=establishment.type_id
    ).aggregate(
        avg_min_tuition_same_type=Avg("min_tuition"),
        same_type_sample_size=Count("pk"),
        avg_best_pass_rate_same_type=Avg("best_pass_rate"),
        # Count ignore les valeurs vides : seuls les établissements ayant un
        # taux entrent dans cet effectif.
        pass_rate_sample_size=Count("best_pass_rate"),
    )
    return {
        "your_min_tuition": own_values.get("min_tuition"),
        "your_best_pass_rate": own_values.get("best_pass_rate"),
        **same_type_values,
    }
