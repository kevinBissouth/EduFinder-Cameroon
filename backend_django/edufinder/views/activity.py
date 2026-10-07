"""Historique des visites et demandes de contact : le responsable voit celui
de ses établissements, le super administrateur celui de toute la plateforme."""
from rest_framework.request import Request
from rest_framework.response import Response

from edufinder.models import Establishment
from edufinder.serializers.activity import ActivityPeriodSerializer, ActivitySerializer
from edufinder.services.activity import (
    build_establishment_activity,
    build_platform_activity,
)
from edufinder.views.access import (
    admin_api_view,
    get_managed_establishment,
    manager_api_view,
)


def _read_period_in_days(request: Request) -> int:
    period_serializer = ActivityPeriodSerializer(data=request.query_params)
    period_serializer.is_valid(raise_exception=True)
    return period_serializer.validated_data["days"]


@manager_api_view(["GET"])
def my_establishment_activity(request, establishment_uuid: str):
    establishment = get_managed_establishment(
        request, establishment_uuid, Establishment.objects.all()
    )
    activity = build_establishment_activity(establishment, _read_period_in_days(request))
    return Response(ActivitySerializer(activity).data)


@admin_api_view(["GET"])
def platform_activity(request):
    activity = build_platform_activity(_read_period_in_days(request))
    return Response(ActivitySerializer(activity).data)
