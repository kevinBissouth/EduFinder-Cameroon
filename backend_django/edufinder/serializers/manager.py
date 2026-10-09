from decimal import ROUND_HALF_UP

from rest_framework import serializers

from edufinder.models import Establishment, EstablishmentStatus
from edufinder.serializers.public import InstitutionDetailSerializer
from edufinder.serializers.submission import SubmissionItemSerializer
from edufinder.services.suspension import read_current_suspension_reason


class ManagerEstablishmentItemSerializer(serializers.Serializer):
    establishment_uuid = serializers.CharField(source="uuid")
    name = serializers.CharField()
    establishment_status = serializers.CharField(source="status")
    has_pending_submission = serializers.BooleanField()
    cover_url = serializers.CharField()
    city = serializers.CharField(source="city.name")
    type = serializers.CharField(source="type.label")
    sector = serializers.CharField(source="sector.label")
    published_year = serializers.SerializerMethodField()

    # Année de publication = dernière année scolaire avec des frais
    # renseignés ; vide tant que la fiche n'est pas publiée.
    def get_published_year(self, establishment: Establishment) -> str | None:
        if establishment.status != EstablishmentStatus.PUBLISHED:
            return None
        return establishment.latest_fee_school_year


# Fiche vue par le responsable : la fiche publique, plus ce qui lui est
# réservé (statut, compteurs de fréquentation, soumission en cours).
class ManagerEstablishmentDetailSerializer(InstitutionDetailSerializer):
    status = serializers.CharField()
    has_pending_submission = serializers.BooleanField()
    updated_at = serializers.DateTimeField()
    recommended = serializers.BooleanField()
    views_count = serializers.IntegerField()
    inquiries_count = serializers.IntegerField()
    # Pourquoi la fiche a quitté le site public : le responsable doit pouvoir
    # le lire sur sa fiche, pas seulement dans une notification.
    suspension_reason = serializers.SerializerMethodField()

    def get_suspension_reason(self, establishment: Establishment) -> str | None:
        return read_current_suspension_reason(establishment)


class ManagerSubmissionItemSerializer(SubmissionItemSerializer):
    # Le contenu exact des changements proposés : sert à afficher au
    # responsable ce qu'il a soumis.
    content = serializers.JSONField()


# Les moyennes sont arrondies pour l'affichage : au franc pour les frais, au
# dixième de point pour les taux.
class ManagerBenchmarksSerializer(serializers.Serializer):
    your_min_tuition = serializers.DecimalField(max_digits=12, decimal_places=2)
    avg_min_tuition_same_type = serializers.DecimalField(
        max_digits=None, decimal_places=0, rounding=ROUND_HALF_UP
    )
    same_type_sample_size = serializers.IntegerField()
    your_best_pass_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    avg_best_pass_rate_same_type = serializers.DecimalField(
        max_digits=None, decimal_places=1, rounding=ROUND_HALF_UP
    )
    pass_rate_sample_size = serializers.IntegerField()
