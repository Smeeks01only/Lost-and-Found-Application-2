"""
Django Signals for automatic embedding generation.

When a FoundItem is created or updated, automatically generate
its embedding and add it to the FAISS vector store.
"""

import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction

from items.models import FoundItem, LostItem

logger = logging.getLogger(__name__)


@receiver(post_save, sender=FoundItem)
def generate_found_item_embedding(sender, instance, created, **kwargs):
    """
    Generate embedding for a found item when saved.
    
    This runs synchronously for now. For production, consider
    using a Celery task for async processing.
    """
    try:
        from nlp_service.embeddings import embedding_generator
        
        # Only process available items
        if instance.status != 'AVAILABLE':
            logger.debug(f"Skipping embedding for non-available item {instance.id}")
            return
        
        # Generate embedding
        text = instance.get_combined_text()
        embedding = embedding_generator.generate_embedding(text)
        
        from nlp_service.vector_store import get_found_items_store, save_found_items_store
        
        # Add to FAISS vector store
        faiss_store = get_found_items_store()
        faiss_store.add_vector(str(instance.id), embedding)
        save_found_items_store()
        
        action = "Created" if created else "Updated"
        logger.info(f"{action} embedding for found item {instance.id}")

        # Proactively run matching in the background.
        # IMPORTANT: schedule on_commit to avoid race conditions when this signal fires inside
        # an atomic transaction (common in management commands/tests).
        from django.conf import settings

        def _trigger_matching():
            if getattr(settings, 'USE_CELERY_MATCHING', False):
                try:
                    from matching.tasks import proactive_matching_task

                    proactive_matching_task.delay()
                    return
                except Exception as exc:
                    logger.warning(f"Celery proactive matching not available, falling back to thread: {exc}")

            import threading
            from nlp_service.matching import execute_matching_algorithm

            threading.Thread(target=execute_matching_algorithm, kwargs={'lost_item': None}).start()

        transaction.on_commit(_trigger_matching)
        
    except Exception as e:
        logger.error(f"Error generating embedding for found item {instance.id}: {e}")

@receiver(post_save, sender=LostItem)
def run_matching_for_lost_item(sender, instance, created, **kwargs):
    """
    Proactively run matching when a LostItem is created or updated.
    Runs in a background thread to prevent blocking the response.
    """
    if instance.status != 'SEARCHING':
        return
        
    try:
        from django.conf import settings

        def _trigger_matching_for_item():
            if getattr(settings, 'USE_CELERY_MATCHING', False):
                try:
                    from matching.tasks import trigger_matching_for_lost_item

                    trigger_matching_for_lost_item.delay(str(instance.id))
                    logger.info(f"Queued Celery matching for lost item {instance.id}")
                    return
                except Exception as exc:
                    logger.warning(f"Celery matching not available, falling back to thread: {exc}")

            import threading
            from nlp_service.matching import execute_matching_algorithm

            threading.Thread(target=execute_matching_algorithm, kwargs={'lost_item': instance}).start()
            logger.info(f"Triggered threaded matching for lost item {instance.id}")

        transaction.on_commit(_trigger_matching_for_item)
    except Exception as e:
        logger.error(f"Error triggering matching for lost item {instance.id}: {e}")

@receiver(post_delete, sender=FoundItem)
def remove_found_item_embedding(sender, instance, **kwargs):
    """
    Remove embedding from vector store when found item is deleted.
    """
    try:
        from nlp_service.vector_store import get_found_items_store, save_found_items_store
        
        faiss_store = get_found_items_store()
        if faiss_store.remove_vector(str(instance.id)):
            save_found_items_store()
            logger.info(f"Removed embedding for found item {instance.id}")
        else:
            logger.debug(f"Embedding for found item {instance.id} not found in store")
        
    except Exception as e:
        logger.error(f"Error removing embedding for found item {instance.id}: {e}")
