from django.urls import path

from edufinder.services.tracking import TrackedEvent
from edufinder.views import public

urlpatterns = [
    path("stats", public.platform_stats, name="platform-stats"),
    path("filters-meta", public.filters_meta, name="filters-meta"),
    path("institutions", public.institution_list, name="institution-list"),
    path(
        "institutions/<str:institution_uuid>",
        public.institution_detail,
        name="institution-detail",
    ),
    path(
        "institutions/<str:institution_uuid>/track-view",
        public.track_institution_event,
        {"tracked_event": TrackedEvent.VIEW},
        name="institution-track-view",
    ),
    path(
        "institutions/<str:institution_uuid>/track-inquiry",
        public.track_institution_event,
        {"tracked_event": TrackedEvent.INQUIRY},
        name="institution-track-inquiry",
    ),
]
