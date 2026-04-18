"""
Django Signals for automatic embedding generation.

When a FoundItem is created or updated, automatically generate
its embedding and add it to the FAISS vector store.
"""

import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from items.models import FoundItem

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
        from nlp_service.chroma_vector_store import get_found_items_chroma_store
        
        # Only process available items
        if instance.status != 'AVAILABLE':
            logger.debug(f"Skipping embedding for non-available item {instance.id}")
            return
        
        # Generate embedding
        text = instance.get_combined_text()
        embedding = embedding_generator.generate_embedding(text)
        
        # Add to ChromaDB vector store
        chroma_store = get_found_items_chroma_store()
        # Create minimal metadata
        metadata = {
            "status": instance.status,
            "category": instance.category,
        }
        
        chroma_store.upsert(
            ids=[str(instance.id)],
            embeddings=embedding,
            documents=[text],
            metadatas=[metadata]
        )
        
        action = "Created" if created else "Updated"
        logger.info(f"{action} embedding for found item {instance.id}")
        
    except Exception as e:
        logger.error(f"Error generating embedding for found item {instance.id}: {e}")


@receiver(post_delete, sender=FoundItem)
def remove_found_item_embedding(sender, instance, **kwargs):
    """
    Remove embedding from vector store when found item is deleted.
    """
    try:
        from nlp_service.chroma_vector_store import get_found_items_chroma_store
        
        chroma_store = get_found_items_chroma_store()
        # ChromaDB API uses collection.delete(ids=[...])
        chroma_store.collection.delete(ids=[str(instance.id)])
        logger.info(f"Removed embedding for found item {instance.id}")
        
    except Exception as e:
        logger.error(f"Error removing embedding for found item {instance.id}: {e}")
