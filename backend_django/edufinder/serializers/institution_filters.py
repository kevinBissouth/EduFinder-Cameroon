"""Validation des paramètres de la recherche publique."""
import re
from decimal import Decimal

from rest_framework import serializers

from edufinder.models.establishment import MAXIMUM_PASS_RATE
from edufinder.services.institution_search import ExamRequirement

SEARCH_TERM_MAX_LENGTH = 100
SERVICE_NAME_MAX_LENGTH = 100
MAX_SERVICE_FILTERS = 8
MAX_EXAM_FILTERS = 5
MAX_PAGE_SIZE = 200
FEE_MAX_DIGITS = 12
FEE_DECIMAL_PLACES = 2

_EXAM_REQUIREMENT_PATTERN = re.compile(
    r"(?P<exam_id>\d+):(?P<minimum_pass_rate>[0-9]{1,3}(\.[0-9]{1,2})?)"
)


# Une exigence d'examen arrive sous la forme « identifiant:taux minimum »
# (« 12:80 »). Je la valide et la découpe ici pour que la recherche reçoive un
# couple déjà typé.
class ExamRequirementField(serializers.Field):
    default_error_messages = {
        "invalid": "Expected 'exam_id:minimum_pass_rate', for example '12:80'.",
        "pass_rate_too_high": "Pass rate must be at most {maximum_pass_rate}.",
    }

    def to_internal_value(self, raw_requirement) -> ExamRequirement:
        matched_requirement = _EXAM_REQUIREMENT_PATTERN.fullmatch(str(raw_requirement))
        if matched_requirement is None:
            self.fail("invalid")
        minimum_pass_rate = Decimal(matched_requirement["minimum_pass_rate"])
        if minimum_pass_rate > MAXIMUM_PASS_RATE:
            self.fail("pass_rate_too_high", maximum_pass_rate=MAXIMUM_PASS_RATE)
        return ExamRequirement(
            exam_id=int(matched_requirement["exam_id"]),
            minimum_pass_rate=minimum_pass_rate,
        )


# Les noms des paramètres d'URL (q, service, exam) sont ceux du frontend ;
# « source » leur donne un nom explicite côté Python.
class InstitutionFiltersSerializer(serializers.Serializer):
    city_id = serializers.IntegerField(required=False)
    type_id = serializers.IntegerField(required=False)
    linguistic_section_id = serializers.IntegerField(required=False)
    program_id = serializers.IntegerField(required=False)
    sector_id = serializers.IntegerField(required=False)
    region_id = serializers.IntegerField(required=False)
    min_fee = serializers.DecimalField(
        required=False,
        max_digits=FEE_MAX_DIGITS,
        decimal_places=FEE_DECIMAL_PLACES,
        min_value=Decimal("0"),
    )
    max_fee = serializers.DecimalField(
        required=False,
        max_digits=FEE_MAX_DIGITS,
        decimal_places=FEE_DECIMAL_PLACES,
        min_value=Decimal("0"),
    )
    service = serializers.ListField(
        source="service_names",
        required=False,
        child=serializers.CharField(max_length=SERVICE_NAME_MAX_LENGTH),
        max_length=MAX_SERVICE_FILTERS,
    )
    exam = serializers.ListField(
        source="exam_requirements",
        required=False,
        child=ExamRequirementField(),
        max_length=MAX_EXAM_FILTERS,
    )
    q = serializers.CharField(
        source="search_term",
        required=False,
        allow_blank=True,
        max_length=SEARCH_TERM_MAX_LENGTH,
    )
    limit = serializers.IntegerField(required=False, min_value=1, max_value=MAX_PAGE_SIZE)
    offset = serializers.IntegerField(required=False, min_value=0)
