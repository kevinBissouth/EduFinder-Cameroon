from django.urls import path

from edufinder.services.tracking import TrackedEvent
from edufinder.views import auth, manager, manager_media, public

urlpatterns = [
    path("auth/login", auth.login, name="auth-login"),
    path("auth/logout", auth.logout, name="auth-logout"),
    path("auth/me", auth.current_user, name="auth-current-user"),
    path(
        "establishments/proposals",
        manager.submit_creation_proposal,
        name="creation-proposal",
    ),
    path("my/establishments", manager.my_establishments, name="my-establishments"),
    path(
        "my/establishments/<str:establishment_uuid>/modification-proposals",
        manager.submit_modification_proposal,
        name="modification-proposal",
    ),
    path("my/submissions", manager.my_submissions, name="my-submissions"),
    path(
        "my/uploads/media",
        manager_media.upload_detached_media,
        name="my-detached-media-upload",
    ),
    path(
        "my/establishments/<str:establishment_uuid>/media",
        manager_media.propose_establishment_media,
        name="my-establishment-media-proposal",
    ),
    path(
        "my/establishments/<str:establishment_uuid>/media/<int:media_id>",
        manager_media.propose_establishment_media_removal,
        name="my-establishment-media-removal-proposal",
    ),
    path(
        "my/establishments/<str:establishment_uuid>/director-photo",
        manager_media.propose_director_photo_change,
        name="my-establishment-director-photo-proposal",
    ),
    path(
        "my/establishments/<str:establishment_uuid>",
        manager.my_establishment_detail,
        name="my-establishment-detail",
    ),
    path(
        "my/establishments/<str:establishment_uuid>/benchmarks",
        manager.my_establishment_benchmarks,
        name="my-establishment-benchmarks",
    ),
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
