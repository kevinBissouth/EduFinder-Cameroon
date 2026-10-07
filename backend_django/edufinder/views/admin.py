"""Espace super administrateur : soumissions, établissements, suspension et
réactivation. Réservé au rôle super_admin, contrôlé côté serveur."""
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from edufinder.models import Establishment, Submission
from edufinder.serializers.admin import (
    AdminDecisionSerializer,
    AdminEstablishmentItemSerializer,
    AdminEstablishmentStatusSerializer,
    AdminSubmissionDetailSerializer,
    AdminSubmissionItemSerializer,
    DecisionReasonSerializer,
    SubmissionStatusFilterSerializer,
)
from edufinder.services.admin_space import (
    find_submission,
    list_establishments_with_owners,
    list_submissions_by_status,
)
from edufinder.services.suspension import (
    reactivate_establishment,
    suspend_establishment,
)
from edufinder.services.validation import approve_submission, reject_submission
from edufinder.views.access import admin_api_view


def _get_establishment_or_404(establishment_uuid: str) -> Establishment:
    establishment = Establishment.objects.filter(uuid=establishment_uuid).first()
    if establishment is None:
        raise NotFound("Establishment not found")
    return establishment


@admin_api_view(["GET"])
def submissions(request):
    filter_serializer = SubmissionStatusFilterSerializer(data=request.query_params)
    filter_serializer.is_valid(raise_exception=True)
    listed_submissions = list_submissions_by_status(
        filter_serializer.validated_data["status"]
    )
    return Response(AdminSubmissionItemSerializer(listed_submissions, many=True).data)


def _get_submission_or_404(submission_uuid: str) -> Submission:
    submission = find_submission(submission_uuid)
    if submission is None:
        raise NotFound("Submission not found")
    return submission


@admin_api_view(["GET"])
def submission_detail(request, submission_uuid: str):
    submission = _get_submission_or_404(submission_uuid)
    return Response(AdminSubmissionDetailSerializer(submission).data)


@admin_api_view(["POST"])
def approve(request, submission_uuid: str):
    submission = _get_submission_or_404(submission_uuid)
    approved_submission = approve_submission(submission, request.user)
    return Response(AdminDecisionSerializer(approved_submission).data)


@admin_api_view(["POST"])
def reject(request, submission_uuid: str):
    submission = _get_submission_or_404(submission_uuid)
    reason_serializer = DecisionReasonSerializer(data=request.data)
    reason_serializer.is_valid(raise_exception=True)
    rejected_submission = reject_submission(
        submission, request.user, reason_serializer.validated_data["reason"]
    )
    return Response(AdminDecisionSerializer(rejected_submission).data)


@admin_api_view(["GET"])
def establishments(request):
    return Response(
        AdminEstablishmentItemSerializer(
            list_establishments_with_owners(), many=True
        ).data
    )


@admin_api_view(["POST"])
def suspend(request, establishment_uuid: str):
    establishment = _get_establishment_or_404(establishment_uuid)
    reason_serializer = DecisionReasonSerializer(data=request.data)
    reason_serializer.is_valid(raise_exception=True)
    suspended_establishment = suspend_establishment(
        establishment, request.user, reason_serializer.validated_data["reason"]
    )
    return Response(AdminEstablishmentStatusSerializer(suspended_establishment).data)


@admin_api_view(["POST"])
def reactivate(request, establishment_uuid: str):
    establishment = _get_establishment_or_404(establishment_uuid)
    reactivated_establishment = reactivate_establishment(establishment, request.user)
    return Response(AdminEstablishmentStatusSerializer(reactivated_establishment).data)
