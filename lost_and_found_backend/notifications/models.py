"""
Notification Model

This module defines the Notification model for push notifications
to users about match updates, claim statuses, etc.
"""

import uuid
from django.db import models
from django.conf import settings


class NotificationType(models.TextChoices):
    """Types of notifications."""
    MATCH_FOUND = 'MATCH_FOUND', 'Potential Match Found'
    CLAIM_SUBMITTED = 'CLAIM_SUBMITTED', 'Claim Submitted'
    CLAIM_APPROVED = 'CLAIM_APPROVED', 'Claim Approved'
    CLAIM_REJECTED = 'CLAIM_REJECTED', 'Claim Rejected'
    PROOF_REQUIRED = 'PROOF_REQUIRED', 'Additional Proof Required'
    ITEM_EXPIRED = 'ITEM_EXPIRED', 'Lost Item Search Expired'
    SYSTEM = 'SYSTEM', 'System Notification'


class Notification(models.Model):
    """Model for user notifications."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Recipient
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    
    # Notification content
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Related entities (optional)
    related_match = models.ForeignKey(
        'matching.Match',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    related_claim = models.ForeignKey(
        'matching.Claim',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    
    # Status
    is_read = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        status = '✓' if self.is_read else '○'
        return f"{status} {self.title} - {self.user.full_name}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read', 'read_at'])
