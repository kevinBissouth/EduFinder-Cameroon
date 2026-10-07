from rest_framework import serializers


# Ligne de soumission commune aux deux espaces privés.
class SubmissionItemSerializer(serializers.Serializer):
    submission_uuid = serializers.CharField(source="uuid")
    establishment_uuid = serializers.CharField(source="establishment.uuid")
    establishment_name = serializers.CharField(source="establishment.name")
    submission_type = serializers.CharField(source="type")
    submission_status = serializers.CharField(source="status")
    submitted_at = serializers.DateTimeField()
    rejection_reason = serializers.CharField()
