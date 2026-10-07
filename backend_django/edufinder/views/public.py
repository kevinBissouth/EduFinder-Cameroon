"""Endpoints publics : aucune authentification, lecture seule des données
publiées."""
from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from edufinder.serializers.institution_filters import InstitutionFiltersSerializer
from edufinder.serializers.public import (
    FiltersMetaSerializer,
    InstitutionDetailSerializer,
    InstitutionSummarySerializer,
    PlatformStatsSerializer,
)
from edufinder.services.institution_search import (
    InstitutionSearchFilters,
    search_published_establishments,
)
from edufinder.services.public_catalog import (
    collect_filters_meta,
    collect_platform_stats,
)
from edufinder.services.public_institutions import (
    find_published_establishment_profile,
)

INSTITUTION_NOT_FOUND_MESSAGE = "Institution not found"


@api_view(["GET"])
def platform_stats(request):
    return Response(PlatformStatsSerializer(collect_platform_stats()).data)


@api_view(["GET"])
def filters_meta(request):
    return Response(FiltersMetaSerializer(collect_filters_meta()).data)


@api_view(["GET"])
def institution_list(request):
    filters_serializer = InstitutionFiltersSerializer(data=request.query_params)
    filters_serializer.is_valid(raise_exception=True)
    establishments = search_published_establishments(
        InstitutionSearchFilters(**filters_serializer.validated_data)
    )
    return Response(InstitutionSummarySerializer(establishments, many=True).data)


@api_view(["GET"])
def institution_detail(request, institution_uuid: str):
    establishment = find_published_establishment_profile(institution_uuid)
    # Même 404 pour un identifiant inconnu, mal formé ou non publié : je ne
    # révèle pas qu'un établissement existe tant qu'il n'est pas public.
    if establishment is None:
        raise NotFound(INSTITUTION_NOT_FOUND_MESSAGE)
    return Response(InstitutionDetailSerializer(establishment).data)
