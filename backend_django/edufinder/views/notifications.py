"""Notifications du compte connecté, responsable ou super administrateur.

Chaque route ne touche que les notifications du compte identifié par le
cookie : l'identifiant d'un autre compte n'apparaît dans aucune adresse.
"""
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from edufinder.serializers.notification import NotificationSerializer
from edufinder.services.notifications import (
    NotificationNotFoundError,
    count_unread_notifications,
    list_notifications_page,
    mark_all_notifications_read,
    mark_notification_read,
)
from edufinder.views.access import manager_api_view


# ?before=<uuid> donne la page suivante : les notifications plus anciennes que
# celle-là, qui doit être une des miennes.
@manager_api_view(["GET"])
def my_notifications(request):
    try:
        notifications, has_more = list_notifications_page(
            request.user, request.query_params.get("before")
        )
    except NotificationNotFoundError as error:
        raise NotFound("Notification not found") from error
    return Response(
        {
            "unread_count": count_unread_notifications(request.user),
            "notifications": NotificationSerializer(notifications, many=True).data,
            "has_more": has_more,
        }
    )


@manager_api_view(["POST"])
def mark_read(request, notification_uuid: str):
    try:
        mark_notification_read(request.user, notification_uuid)
    except NotificationNotFoundError as error:
        # Même réponse qu'elle n'existe pas ou qu'elle appartienne à un autre
        # compte : je ne révèle pas l'existence d'une notification d'autrui.
        raise NotFound("Notification not found") from error
    return Response(status=status.HTTP_204_NO_CONTENT)


@manager_api_view(["POST"])
def mark_all_read(request):
    mark_all_notifications_read(request.user)
    return Response(status=status.HTTP_204_NO_CONTENT)
