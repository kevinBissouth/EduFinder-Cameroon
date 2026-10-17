from rest_framework import serializers

from edufinder.models import Notification
from edufinder.services.submissions import list_changed_fields


class NotificationSerializer(serializers.Serializer):
    notification_uuid = serializers.CharField(source="uuid")
    kind = serializers.CharField()
    establishment_uuid = serializers.CharField(source="establishment.uuid")
    establishment_name = serializers.CharField(source="establishment.name")
    submission_uuid = serializers.SerializerMethodField()
    reason = serializers.CharField()
    created_at = serializers.DateTimeField()
    is_read = serializers.SerializerMethodField()
    changed_fields = serializers.SerializerMethodField()

    def get_submission_uuid(self, notification: Notification) -> str | None:
        return notification.submission.uuid if notification.submission else None

    def get_is_read(self, notification: Notification) -> bool:
        return notification.read_at is not None

    # Les rubriques de la soumission décidée : le responsable sait laquelle,
    # même quand plusieurs attendaient en même temps.
    def get_changed_fields(self, notification: Notification) -> list[str]:
        if notification.submission is None:
            return []
        return list_changed_fields(notification.submission.content)
