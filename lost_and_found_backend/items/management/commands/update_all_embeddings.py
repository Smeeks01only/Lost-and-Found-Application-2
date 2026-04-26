import logging
from django.core.management.base import BaseCommand
from items.models import FoundItem
from nlp_service.embeddings import embedding_generator
from nlp_service.vector_store import get_found_items_store, save_found_items_store

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Re-generates and stores embeddings for all Found Items in FAISS'

    def handle(self, *args, **options):
        self.stdout.write("Initializing FAISS connection...")
        faiss_store = get_found_items_store()
        
        # In FAISS, we can just clear the dictionaries and recreate the index
        self.stdout.write("Resetting FAISS collection...")
        faiss_store._create_index()
        faiss_store.id_to_item = {}
        faiss_store.item_to_id = {}
        
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
                embedding = embedding_generator.generate_embedding(text)
                faiss_store.add_vector(str(item.id), embedding)
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Failed to embed item {item.id}: {e}"))
                
        # Persist the newly populated index to disk
        save_found_items_store()
        self.stdout.write(self.style.SUCCESS("All embeddings successfully regenerated in FAISS!"))
