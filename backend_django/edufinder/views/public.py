"""Endpoints publics : aucune authentification, lecture seule des données
publiées."""
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from edufinder.client_address import get_client_address

from edufinder.serializers.institution_filters import InstitutionFiltersSerializer
from edufinder.serializers.public import (
    FiltersMetaSerializer,
    InstitutionDetailSerializer,
    InstitutionSummarySerializer,
    PlatformStatsSerializer,
    ReferenceLabelsSerializer,
)
from edufinder.services.institution_search import (
    InstitutionSearchFilters,
    search_published_establishments,
)
from edufinder.services.public_catalog import (
    collect_filters_meta,
    collect_platform_stats,
    collect_reference_labels,
)
from edufinder.services.public_institutions import (
    find_published_establishment,
    find_published_establishment_profile,
)
from edufinder.services.tracking import TrackedEvent, count_event_once

INSTITUTION_NOT_FOUND_MESSAGE = "Institution not found"


@api_view(["GET"])
def platform_stats(request):
    return Response(PlatformStatsSerializer(collect_platform_stats()).data)


@api_view(["GET"])
def filters_meta(request):
    return Response(FiltersMetaSerializer(collect_filters_meta()).data)


@api_view(["GET"])
def reference_labels(request):
    return Response(ReferenceLabelsSerializer(collect_reference_labels()).data)


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


# Une seule vue pour les deux événements : chaque route lui passe le sien.
@api_view(["POST"])
def track_institution_event(request, institution_uuid: str, tracked_event: TrackedEvent):
    establishment = find_published_establishment(institution_uuid)
    if establishment is None:
        raise NotFound(INSTITUTION_NOT_FOUND_MESSAGE)
    count_event_once(establishment, get_client_address(request), tracked_event)
    # Réponse vide, identique que l'événement soit compté ou ignoré : les
    # compteurs sont réservés au responsable et je ne signale pas au client
    # que sa requête a été dédoublonnée.
    return Response(status=status.HTTP_204_NO_CONTENT)
