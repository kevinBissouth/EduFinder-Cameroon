from rest_framework import serializers

from edufinder.models import Establishment, EstablishmentStatus, SubmissionStatus
from edufinder.serializers.submission import SubmissionItemSerializer

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


class AdminSubmissionItemSerializer(SubmissionItemSerializer):
    proposer_name = serializers.CharField(source="user.name")


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

    # Le motif n'est rendu que tant que la fiche est suspendue : une fois
    # réactivée, l'ancienne suspension n'a plus à s'afficher.
    def get_suspension_reason(self, establishment: Establishment) -> str | None:
        if establishment.status != EstablishmentStatus.SUSPENDED:
            return None
        return establishment.latest_suspension_reason


class AdminDecisionSerializer(serializers.Serializer):
    submission_uuid = serializers.CharField(source="uuid")
    submission_status = serializers.CharField(source="status")
    establishment_status = serializers.CharField(source="establishment.status")


class AdminEstablishmentStatusSerializer(serializers.Serializer):
    establishment_uuid = serializers.CharField(source="uuid")
    establishment_status = serializers.CharField(source="status")
