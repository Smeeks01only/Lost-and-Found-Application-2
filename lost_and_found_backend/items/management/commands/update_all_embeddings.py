import logging
from django.core.management.base import BaseCommand
from items.models import FoundItem
from nlp_service.embeddings import embedding_generator
from nlp_service.chroma_vector_store import get_found_items_chroma_store

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Re-generates and stores embeddings for all Found Items in ChromaDB'

    def handle(self, *args, **options):
        self.stdout.write("Initializing ChromaDB connection...")
        chroma_store = get_found_items_chroma_store()
        
        # Clear existing ChromaDB collection to avoid duplicates
        self.stdout.write("Resetting ChromaDB collection...")
        chroma_store.reset_collection()
        
        items = FoundItem.objects.filter(status='AVAILABLE')
        total = items.count()
        
        if total == 0:
            self.stdout.write(self.style.WARNING("No AVAILABLE FoundItems found."))
            return
            
        self.stdout.write(f"Generating embeddings for {total} items...")
        
        for index, item in enumerate(items, 1):
            text = item.get_combined_text()
            self.stdout.write(f"[{index}/{total}] Processing: {item.title}")
            
            try:
                import numpy as np
                embedding = embedding_generator.generate_embedding(text)
                metadata = {
                    "status": str(item.status) if item.status else "",
                    "category": str(item.category) if item.category else "",
                }
                
                chroma_store.upsert(
                    ids=[str(item.id)],
                    embeddings=np.array([embedding]),
                    documents=[text],
                    metadatas=[metadata]
                )
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Failed to embed item {item.id}: {e}"))
                
        self.stdout.write(self.style.SUCCESS("All embeddings successfully regenerated in ChromaDB!"))
