from django.urls import path

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
]
