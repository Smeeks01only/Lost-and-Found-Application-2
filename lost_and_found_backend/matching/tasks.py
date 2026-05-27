"""
Celery Tasks for Background Processing

This module implements:
- Proactive matching (runs daily to find new matches)
- Notification creation
- Lost item expiration
"""

import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task(name='matching.tasks.proactive_matching_task')
def proactive_matching_task():
    """
    Periodic task to check for new matches for active lost items.
    
    Runs every 24 hours (configured in settings.CELERY_BEAT_SCHEDULE).
    """
    from items.models import LostItem
    from matching.models import Match
    from nlp_service.matching import find_matches_for_lost_item
    from django.conf import settings
    
    logger.info("Starting proactive matching task...")
    
    # Get all active lost items within search period
    active_lost_items = LostItem.objects.filter(
        status='SEARCHING',
        is_active=True,
        search_expiry_date__gte=timezone.now()
    )
    
    total_matches = 0
    threshold = getattr(settings, 'MATCHING_THRESHOLD', 0.5)
    
    for lost_item in active_lost_items:
        try:
            # Find matches for this lost item
            matches = find_matches_for_lost_item(
                lost_item,
                top_k=5,
                threshold=threshold
            )
            
            for match_data in matches:
                found_item = match_data['found_item']
                
                # Check if match already exists
                existing_match = Match.objects.filter(
                    lost_item=lost_item,
                    found_item=found_item
                ).first()
                
                if not existing_match:
                    # Create new match
                    match = Match.objects.create(
                        lost_item=lost_item,
                        found_item=found_item,
                        semantic_score=match_data['semantic_score'],
                        time_score=match_data['time_score'],
                        location_score=match_data['location_score'],
                        final_score=match_data['final_score'],
                        rank=match_data['rank'],
                        status='POTENTIAL'
                    )
                    
                    # Send notification
                    create_notification_task.delay(
                        user_id=str(lost_item.user.id),
                        notification_type='MATCH_FOUND',
                        title='Potential Match Found!',
                        message=f'We found a potential match for your lost {lost_item.title}',
                        match_id=str(match.id)
                    )
                    
                    total_matches += 1
                    logger.info(f"Created match: {lost_item.title} <-> {found_item.title}")
        
        except Exception as e:
            logger.error(f"Error processing lost item {lost_item.id}: {e}")
    
    logger.info(f"Proactive matching complete. Created {total_matches} new matches.")
    return {'total_matches': total_matches}


@shared_task(name='matching.tasks.create_notification_task')
def create_notification_task(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    match_id: str = None,
    claim_id: str = None
):
    """
    Create a notification for a user.
    
    Args:
        user_id: UUID of the user
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        match_id: Optional match UUID
        claim_id: Optional claim UUID
    """
    from accounts.models import User
    from notifications.models import Notification
    from matching.models import Match, Claim
    
    try:
        user = User.objects.get(id=user_id)

        notification, created = Notification.objects.get_or_create(
            user=user,
            notification_type=notification_type,
            related_match_id=match_id,
            related_claim_id=claim_id,
            defaults={
                'title': title,
                'message': message,
            },
        )

        if created:
            logger.info(f"Created notification {notification.id} for user {user.email}")
        else:
            logger.info(f"Notification already exists {notification.id} for user {user.email}")
        return {'notification_id': str(notification.id), 'created': created}
    
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return {'error': 'User not found'}
    except Exception as e:
        logger.error(f"Error creating notification: {e}")
        return {'error': str(e)}


@shared_task(name='matching.tasks.expire_old_lost_items')
def expire_old_lost_items():
    """
    Mark lost items as expired after search period.
    
    Runs every 24 hours (configured in settings.CELERY_BEAT_SCHEDULE).
    """
    from items.models import LostItem
    
    logger.info("Starting lost item expiration task...")
    
    expiry_date = timezone.now()
    
    # Find items to expire
    items_to_expire = LostItem.objects.filter(
        search_expiry_date__lt=expiry_date,
        is_active=True
    )
    
    count = items_to_expire.count()
    
    # Update items
    items_to_expire.update(
        is_active=False,
        status='EXPIRED'
    )
    
    # Send notifications to owners
    for item in items_to_expire:
        create_notification_task.delay(
            user_id=str(item.user.id),
            notification_type='ITEM_EXPIRED',
            title='Lost Item Search Expired',
            message=f'The search period for your lost {item.title} has expired. You can still view any existing matches.'
        )
    
    logger.info(f"Expired {count} lost items")
    return {'expired_count': count}


@shared_task(name='matching.tasks.trigger_matching_for_lost_item')
def trigger_matching_for_lost_item(lost_item_id: str):
    """
    Trigger matching for a specific lost item (called when item is created).
    
    Args:
        lost_item_id: UUID of the lost item
    """
    from items.models import LostItem
    from matching.models import Match
    from nlp_service.matching import find_matches_for_lost_item
    from django.conf import settings
    
    try:
        lost_item = LostItem.objects.get(id=lost_item_id)
        
        threshold = getattr(settings, 'MATCHING_THRESHOLD', 0.5)
        matches = find_matches_for_lost_item(
            lost_item,
            top_k=5,
            threshold=threshold
        )
        
        created_count = 0
        for match_data in matches:
            found_item = match_data['found_item']
            
            match, created = Match.objects.get_or_create(
                lost_item=lost_item,
                found_item=found_item,
                defaults={
                    'semantic_score': match_data['semantic_score'],
                    'time_score': match_data['time_score'],
                    'location_score': match_data['location_score'],
                    'final_score': match_data['final_score'],
                    'rank': match_data['rank'],
                    'status': 'POTENTIAL'
                }
            )
            
            if created:
                created_count += 1
                
                # Notify user
                create_notification_task.delay(
                    user_id=str(lost_item.user.id),
                    notification_type='MATCH_FOUND',
                    title='Potential Match Found!',
                    message=f'We found a potential match for your lost {lost_item.title}',
                    match_id=str(match.id)
                )
        
        if created_count > 0:
            # Update lost item status
            lost_item.status = 'MATCHED'
            lost_item.save(update_fields=['status'])
        
        logger.info(f"Found {created_count} matches for lost item {lost_item_id}")
        return {'matches_found': created_count}
    
    except LostItem.DoesNotExist:
        logger.error(f"Lost item {lost_item_id} not found")
        return {'error': 'Lost item not found'}
    except Exception as e:
        logger.error(f"Error matching lost item {lost_item_id}: {e}")
        return {'error': str(e)}
