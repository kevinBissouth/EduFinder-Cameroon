from django.urls import path

from edufinder.services.tracking import TrackedEvent
from edufinder.views import (
    activity,
    admin,
    auth,
    manager,
    manager_media,
    notifications,
    public,
)

urlpatterns = [
    path("auth/login", auth.login, name="auth-login"),
    path("auth/logout", auth.logout, name="auth-logout"),
    path("auth/me", auth.current_user, name="auth-current-user"),
    path("admin/submissions", admin.submissions, name="admin-submissions"),
    path(
        "admin/submissions/<str:submission_uuid>",
        admin.submission_detail,
        name="admin-submission-detail",
    ),
    path(
        "admin/submissions/<str:submission_uuid>/approve",
        admin.approve,
        name="admin-submission-approve",
    ),
    path(
        "admin/submissions/<str:submission_uuid>/reject",
        admin.reject,
        name="admin-submission-reject",
    ),
    path("admin/establishments", admin.establishments, name="admin-establishments"),
    path(
        "admin/establishments/<str:establishment_uuid>/suspend",
        admin.suspend,
        name="admin-establishment-suspend",
    ),
    path(
        "admin/establishments/<str:establishment_uuid>/reactivate",
        admin.reactivate,
        name="admin-establishment-reactivate",
    ),
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
    path("admin/activity", activity.platform_activity, name="admin-activity"),
    path(
        "my/establishments/<str:establishment_uuid>/activity",
        activity.my_establishment_activity,
        name="my-establishment-activity",
    ),
    path("notifications", notifications.my_notifications, name="my-notifications"),
    # « read-all » est déclarée avant la route par identifiant, sinon elle
    # serait prise pour l'identifiant d'une notification.
    path(
        "notifications/read-all",
        notifications.mark_all_read,
        name="my-notifications-read-all",
    ),
    path(
        "notifications/<str:notification_uuid>/read",
        notifications.mark_read,
        name="my-notification-read",
    ),
    path("stats", public.platform_stats, name="platform-stats"),
    path("filters-meta", public.filters_meta, name="filters-meta"),
    path("reference-labels", public.reference_labels, name="reference-labels"),
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
