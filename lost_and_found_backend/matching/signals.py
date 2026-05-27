from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Match


@receiver(post_save, sender=Match)
def create_notification_for_new_match(sender, instance, created, **kwargs):
    if not created:
        return

    # Only notify on newly-created potential matches.
    if getattr(instance, 'status', None) != 'POTENTIAL':
        return

    from notifications.models import Notification

    user = instance.lost_item.user
    Notification.objects.get_or_create(
        user=user,
        notification_type='MATCH_FOUND',
        related_match=instance,
        defaults={
            'title': 'Potential Match Found!',
            'message': f'We found a potential match for your lost {instance.lost_item.title}',
        },
    )