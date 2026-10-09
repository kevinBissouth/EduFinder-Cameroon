"""Saisie d'une proposition de création ou de modification.

Seuls les champs déclarés ici entrent dans une soumission : un responsable ne
peut donc proposer ni statut, ni mise en avant, ni compteur.
"""
import re
from collections.abc import Callable, Hashable, Iterable
from decimal import Decimal
from typing import Any

from rest_framework import serializers

from edufinder.models import ContentLanguage

SMALLEST_FEE_AMOUNT = Decimal("0.01")
MAX_FEES = 20
MAX_SERVICES = 15
MAX_PROGRAMS = 15
MAX_EXAM_RESULTS = 30
MAX_VIDEOS = 10
MAX_PAYMENT_METHODS_PER_FEE = 10
MEDIA_URL_MAX_LENGTH = 500

# Un fichier servi par notre dossier /media, et rien d'autre : ces adresses
# sont recopiées sur la fiche publique à l'approbation, je refuse donc toute
# adresse externe ou tout chemin sortant du dossier.
_UPLOADED_IMAGE_URL_PATTERN = r"^/media/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)\Z"
_UPLOADED_VIDEO_URL_PATTERN = r"^/media/[A-Za-z0-9_-]+\.(mp4|webm)\Z"
_SCHOOL_YEAR_PATTERN = r"^\d{4}-\d{4}\Z"
_EXAM_SESSION_PATTERN = r"^\d{4}\Z"

_URL_SCHEME_PATTERN = re.compile(r"^([a-zA-Z][a-zA-Z0-9+.-]*):")
_WHITESPACE_OR_CONTROL_PATTERN = re.compile(r"[\s\x00-\x1f\x7f]")
SAFE_WEBSITE_SCHEMES = {"http", "https"}


# Le site web est rendu en lien cliquable sur la fiche publique : un schéma
# comme « javascript: » y exécuterait du code chez le visiteur. Les navigateurs
# ignorant les tabulations et retours à la ligne dans une adresse, je refuse
# aussi tout caractère d'espacement ou de contrôle.
def validate_public_website(website: str) -> None:
    if _WHITESPACE_OR_CONTROL_PATTERN.search(website):
        raise serializers.ValidationError("Website must not contain whitespace.")
    matched_scheme = _URL_SCHEME_PATTERN.match(website)
    if matched_scheme and matched_scheme[1].lower() not in SAFE_WEBSITE_SCHEMES:
        raise serializers.ValidationError("Website must be an http or https address.")


def uploaded_image_url_field() -> serializers.RegexField:
    return serializers.RegexField(
        _UPLOADED_IMAGE_URL_PATTERN,
        required=False,
        allow_null=True,
        max_length=MEDIA_URL_MAX_LENGTH,
    )


# Un doublon passerait la saisie mais ferait échouer l'approbation sur une
# contrainte d'unicité : je le refuse dès maintenant, avec un message clair.
def ensure_no_duplicates(
    items: Iterable[Any], get_identity: Callable[[Any], Hashable], item_name: str
) -> None:
    seen_identities: set[Hashable] = set()
    for item in items:
        identity = get_identity(item)
        if identity in seen_identities:
            raise serializers.ValidationError(f"Duplicate {item_name}: {identity}")
        seen_identities.add(identity)


class SchoolFeeInputSerializer(serializers.Serializer):
    id_level = serializers.IntegerField()
    amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=SMALLEST_FEE_AMOUNT
    )
    school_year = serializers.RegexField(_SCHOOL_YEAR_PATTERN)
    # Modalités de paiement (libellés, ex. « 2 tranches ») : absentes =
    # inchangées pour une modification.
    payment_methods = serializers.ListField(
        required=False,
        allow_null=True,
        child=serializers.CharField(max_length=100),
        max_length=MAX_PAYMENT_METHODS_PER_FEE,
    )


class ExamResultInputSerializer(serializers.Serializer):
    id_exam = serializers.IntegerField()
    session = serializers.RegexField(_EXAM_SESSION_PATTERN)
    pass_rate = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=Decimal("0"), max_value=Decimal("100")
    )


# Tous les champs sont facultatifs ici : c'est la forme d'une modification, où
# seul ce qui est envoyé change. La création redéclare ses champs obligatoires.
class EstablishmentContentSerializer(serializers.Serializer):
    name = serializers.CharField(
        required=False, allow_null=True, min_length=2, max_length=255
    )
    id_city = serializers.IntegerField(required=False, allow_null=True)
    id_type = serializers.IntegerField(required=False, allow_null=True)
    id_sector = serializers.IntegerField(required=False, allow_null=True)
    id_linguistic_section = serializers.IntegerField(required=False, allow_null=True)
    phone = serializers.CharField(required=False, allow_null=True, max_length=20)
    # Coordonnées géographiques : nécessaires à la carte du profil (aucune
    # géolocalisation automatique côté serveur, le responsable les saisit).
    latitude = serializers.FloatField(
        required=False, allow_null=True, min_value=-90, max_value=90
    )
    longitude = serializers.FloatField(
        required=False, allow_null=True, min_value=-180, max_value=180
    )
    contact_email = serializers.EmailField(
        required=False, allow_null=True, max_length=255
    )
    website = serializers.CharField(
        required=False,
        allow_null=True,
        max_length=255,
        validators=[validate_public_website],
    )
    address = serializers.CharField(required=False, allow_null=True, max_length=255)
    description = serializers.CharField(required=False, allow_null=True)
    director_name = serializers.CharField(
        required=False, allow_null=True, max_length=120
    )
    director_title = serializers.CharField(
        required=False, allow_null=True, max_length=80
    )
    director_bio = serializers.CharField(required=False, allow_null=True)
    # Langue des textes ci-dessus, et leur version dans l'autre langue.
    content_language = serializers.ChoiceField(
        choices=ContentLanguage.choices, required=False, allow_null=True
    )
    description_translation = serializers.CharField(required=False, allow_null=True)
    director_title_translation = serializers.CharField(
        required=False, allow_null=True, max_length=80
    )
    director_bio_translation = serializers.CharField(required=False, allow_null=True)
    director_photo = uploaded_image_url_field()
    fees = SchoolFeeInputSerializer(
        many=True, required=False, allow_null=True, max_length=MAX_FEES
    )
    services = serializers.ListField(
        required=False,
        allow_null=True,
        child=serializers.CharField(max_length=100),
        max_length=MAX_SERVICES,
    )
    program_ids = serializers.ListField(
        required=False,
        allow_null=True,
        child=serializers.IntegerField(),
        max_length=MAX_PROGRAMS,
    )
    exam_results = ExamResultInputSerializer(
        many=True, required=False, allow_null=True, max_length=MAX_EXAM_RESULTS
    )

    def validate_fees(self, fees: list[dict] | None) -> list[dict] | None:
        ensure_no_duplicates(
            fees or [],
            lambda fee: (fee["id_level"], fee["school_year"]),
            "fee (id_level, school_year)",
        )
        return fees

    def validate_exam_results(self, exam_results: list[dict] | None) -> list[dict] | None:
        ensure_no_duplicates(
            exam_results or [],
            lambda exam_result: (exam_result["id_exam"], exam_result["session"]),
            "exam result (id_exam, session)",
        )
        return exam_results

    # La base compare les noms de service sans tenir compte de la casse.
    def validate_services(self, service_names: list[str] | None) -> list[str] | None:
        ensure_no_duplicates(service_names or [], str.lower, "service")
        return service_names

    def validate_program_ids(self, program_ids: list[int] | None) -> list[int] | None:
        ensure_no_duplicates(program_ids or [], lambda program_id: program_id, "program")
        return program_ids


class ModificationProposalSerializer(EstablishmentContentSerializer):
    # Une valeur nulle signifie « pas de changement » : je ne garde que ce qui
    # est réellement modifié, y compris dans les frais.
    def validate(self, content: dict) -> dict:
        return _without_null_values(content)


class CreationProposalSerializer(EstablishmentContentSerializer):
    name = serializers.CharField(min_length=2, max_length=255)
    id_city = serializers.IntegerField()
    id_type = serializers.IntegerField()
    id_sector = serializers.IntegerField()
    id_linguistic_section = serializers.IntegerField()
    # Médias soumis à la création : une photo de couverture et des vidéos,
    # déjà téléversées. Elles deviennent des médias de la fiche à l'approbation.
    cover_photo = uploaded_image_url_field()
    videos = serializers.ListField(
        required=False,
        allow_null=True,
        child=serializers.RegexField(
            _UPLOADED_VIDEO_URL_PATTERN, max_length=MEDIA_URL_MAX_LENGTH
        ),
        max_length=MAX_VIDEOS,
    )

    LIST_FIELD_NAMES = ("fees", "services", "program_ids", "exam_results", "videos")

    # Le contenu d'une création est complet : chaque champ y figure, vide s'il
    # n'a pas été saisi, pour que l'approbation n'ait pas à deviner.
    def validate(self, content: dict) -> dict:
        complete_content = {field_name: None for field_name in self.fields}
        complete_content.update(_without_null_values(content))
        for list_field_name in self.LIST_FIELD_NAMES:
            complete_content[list_field_name] = complete_content[list_field_name] or []
        return complete_content


def _without_null_values(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: _without_null_values(item)
            for key, item in value.items()
            if item is not None
        }
    if isinstance(value, list):
        return [_without_null_values(item) for item in value]
    return value


class ProposalCreatedSerializer(serializers.Serializer):
    establishment_uuid = serializers.CharField(source="establishment.uuid")
    submission_uuid = serializers.CharField(source="uuid")
    establishment_status = serializers.CharField(source="establishment.status")
    submission_status = serializers.CharField(source="status")
