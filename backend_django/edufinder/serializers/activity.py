from rest_framework import serializers

from edufinder.services.activity import ALLOWED_PERIODS_IN_DAYS, DEFAULT_PERIOD_IN_DAYS


class ActivityPeriodSerializer(serializers.Serializer):
    days = serializers.ChoiceField(
        choices=ALLOWED_PERIODS_IN_DAYS, default=DEFAULT_PERIOD_IN_DAYS
    )


class ActivityDaySerializer(serializers.Serializer):
    day = serializers.DateField()
    views = serializers.IntegerField()
    inquiries = serializers.IntegerField()


class ActivitySerializer(serializers.Serializer):
    collected_since = serializers.DateField()
    days = ActivityDaySerializer(many=True)
