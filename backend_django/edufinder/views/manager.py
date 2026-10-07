"""Espace responsable : établissements confiés, soumissions et comparaison."""
from rest_framework.response import Response

from edufinder.models import Establishment
from edufinder.serializers.manager import (
    ManagerBenchmarksSerializer,
    ManagerEstablishmentDetailSerializer,
    ManagerEstablishmentItemSerializer,
    ManagerSubmissionItemSerializer,
)
from edufinder.services.manager_space import (
    compute_benchmarks,
    list_managed_establishments,
    list_user_submissions,
    managed_establishment_profiles,
)
from edufinder.views.access import get_managed_establishment, manager_api_view


@manager_api_view(["GET"])
def my_establishments(request):
    establishments = list_managed_establishments(request.user)
    return Response(ManagerEstablishmentItemSerializer(establishments, many=True).data)


@manager_api_view(["GET"])
def my_submissions(request):
    submissions = list_user_submissions(request.user)
    return Response(ManagerSubmissionItemSerializer(submissions, many=True).data)


@manager_api_view(["GET"])
def my_establishment_detail(request, establishment_uuid: str):
    establishment = get_managed_establishment(
        request, establishment_uuid, managed_establishment_profiles()
    )
    return Response(ManagerEstablishmentDetailSerializer(establishment).data)


@manager_api_view(["GET"])
def my_establishment_benchmarks(request, establishment_uuid: str):
    establishment = get_managed_establishment(
        request, establishment_uuid, Establishment.objects.all()
    )
    return Response(ManagerBenchmarksSerializer(compute_benchmarks(establishment)).data)
