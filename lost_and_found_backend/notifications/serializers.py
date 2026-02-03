"""
Notification Serializers.
"""

from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for the Notification model."""
    
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'type_display',
            'title', 'message',
            'related_match', 'related_claim',
            'is_read', 'created_at', 'read_at'
        ]
        read_only_fields = ['id', 'notification_type', 'title', 'message',
                           'related_match', 'related_claim', 'created_at', 'read_at']
