from rest_framework import serializers

from edufinder.models import Establishment, Submission, SubmissionStatus
from edufinder.serializers.submission import SubmissionItemSerializer
from edufinder.services.suspension import read_current_suspension_reason

REASON_MIN_LENGTH = 3
REASON_MAX_LENGTH = 500


class SubmissionStatusFilterSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=SubmissionStatus.choices, default=SubmissionStatus.PENDING
    )


# Motif saisi par le super administrateur : obligatoire et non vide, car le
# responsable doit pouvoir comprendre la décision.
class DecisionReasonSerializer(serializers.Serializer):
    reason = serializers.CharField(
        min_length=REASON_MIN_LENGTH, max_length=REASON_MAX_LENGTH
    )


EMPTY_CONTENT_VALUES = (None, "", [])


class AdminSubmissionItemSerializer(SubmissionItemSerializer):
    proposer_name = serializers.CharField(source="user.name")
    changed_fields = serializers.SerializerMethodField()

    # La liste ne porte que le nom des rubriques touchées, pour distinguer deux
    # soumissions sans les ouvrir ; leur contenu reste réservé au détail.
    def get_changed_fields(self, submission: Submission) -> list[str]:
        return [
            field_name
            for field_name, value in submission.content.items()
            if value not in EMPTY_CONTENT_VALUES
        ]


class AdminSubmissionDetailSerializer(AdminSubmissionItemSerializer):
    content = serializers.JSONField()


class AdminEstablishmentItemSerializer(serializers.Serializer):
    establishment_uuid = serializers.CharField(source="uuid")
    name = serializers.CharField()
    establishment_status = serializers.CharField(source="status")
    city = serializers.CharField(source="city.name")
    type = serializers.CharField(source="type.label")
    sector = serializers.CharField(source="sector.label")
    # Première image de la fiche, pour illustrer sa carte ; vide sans image.
    cover_url = serializers.CharField()
    owners = serializers.SerializerMethodField()
    suspension_reason = serializers.SerializerMethodField()

    def get_owners(self, establishment: Establishment) -> list[str]:
        return [
            ownership.user.name for ownership in establishment.user_establishments.all()
        ]

    def get_suspension_reason(self, establishment: Establishment) -> str | None:
        return read_current_suspension_reason(establishment)


class AdminDecisionSerializer(serializers.Serializer):
    submission_uuid = serializers.CharField(source="uuid")
    submission_status = serializers.CharField(source="status")
    establishment_status = serializers.CharField(source="establishment.status")


class AdminEstablishmentStatusSerializer(serializers.Serializer):
    establishment_uuid = serializers.CharField(source="uuid")
    establishment_status = serializers.CharField(source="status")
