import json
import os
import logging
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from items.models import LostItem, FoundItem, ItemCategory, LostItemStatus, FoundItemStatus
from accounts.models import User
from nlp_service.embeddings import embedding_generator
from nlp_service.chroma_vector_store import ChromaVectorStore
import numpy as np

# FAISS is optional — if not installed, we skip FAISS indexing
try:
    from nlp_service.vector_store import get_found_items_store, save_found_items_store
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Seeds the database with synthetic lost and found items.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear synthetic data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.clear_synthetic_data()
            return

        self.stdout.write("Loading synthetic dataset from CSV...")
        dataset_path = os.path.join(settings.BASE_DIR, 'synthetic_data', 'lost_found_items_dataset.csv')
        
        # Create or get synthetic user
        user, created = User.objects.get_or_create(
            email='synthetic_user@example.com',
            defaults={
                'full_name': 'Synthetic User',
                'role': 'LOSER',
                'is_active': True,
                'is_verified': True
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            
        staff_user, created = User.objects.get_or_create(
            email='synthetic_staff@example.com',
            defaults={
                'full_name': 'Synthetic Staff',
                'role': 'STAFF',
                'is_active': True,
                'is_verified': True
            }
        )
        if created:
            staff_user.set_password('password123')
            staff_user.save()

        # ChromaDB Store setup
        collection_name = getattr(settings, 'CHROMA_COLLECTION_FOUND', 'synthetic_found_items')
        persist_path = getattr(settings, 'CHROMA_PERSIST_PATH', os.path.join(settings.BASE_DIR, 'synthetic_data', 'chroma'))
        chroma_store = ChromaVectorStore(persist_path=persist_path, collection_name=collection_name)
        
        self.clear_synthetic_data(chroma_store)

        faiss_store = get_found_items_store() if FAISS_AVAILABLE else None
        if not FAISS_AVAILABLE:
            self.stdout.write(self.style.WARNING("FAISS not available — indexing to ChromaDB only."))

        self.stdout.write("Seeding Items from CSV...")
        import csv
        with open(dataset_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                item_id = row['item_id']
                item_type = row['item_type']
                title = f"[SYNTHETIC] [{item_id}] {row['title']}"
                description = row['description']
                category = row['category'].upper()
                location = row['location']
                
                # Parse date (handles 3/4/2026 or 03/04/2026)
                try:
                    event_date = datetime.strptime(row['event_date'], '%m/%d/%Y').date()
                except ValueError:
                    # In case it's in a different format
                    event_date = datetime.now().date()
                
                # Ensure category is valid (fallback to OTHER)
                valid_categories = [c[0] for c in ItemCategory.choices]
                if category not in valid_categories:
                    # Some categories like "Power Bank" need to map to ELECTRONICS or OTHER
                    if "POWER BANK" in category: category = "ELECTRONICS"
                    elif "EARBUDS" in category: category = "HEADPHONES"
                    elif "JACKET" in category: category = "CLOTHING"
                    elif "ID CARD" in category: category = "DOCUMENTS"
                    elif "BOOK" in category: category = "BOOKS"
                    elif "BACKPACK" in category: category = "BAG"
                    else: category = "OTHER"

                if item_type == 'LOST':
                    LostItem.objects.create(
                        user=user,
                        title=title,
                        description=description,
                        category=category,
                        location_lost=location,
                        date_lost=event_date,
                        status=LostItemStatus.SEARCHING
                    )
                elif item_type == 'FOUND':
                    found_item = FoundItem.objects.create(
                        uploaded_by=staff_user,
                        title=title,
                        description=description,
                        category=category,
                        location_found=location,
                        date_found=event_date,
                        status=FoundItemStatus.AVAILABLE
                    )
                    found_item.set_secret_answer("Generic description")
                    
                    # Generate Embedding
                    text_to_embed = found_item.get_combined_text()
                    embedding = embedding_generator.generate_embedding(text_to_embed)
                    
                    # Save to FAISS (if available)
                    if faiss_store:
                        faiss_id = faiss_store.add_vector(str(found_item.id), embedding)
                        found_item.embedding_id = faiss_id
                        found_item.save()
                    
                    # Save to ChromaDB
                    chroma_store.upsert(
                        ids=[str(found_item.id)],
                        embeddings=np.array([embedding]),
                        documents=[text_to_embed],
                        metadatas=[{"category": found_item.category, "location": found_item.location_found, "synthetic": True, "original_id": item_id}]
                    )

        if FAISS_AVAILABLE:
            save_found_items_store()
        self.stdout.write(self.style.SUCCESS('Successfully seeded synthetic dataset!'))

    def clear_synthetic_data(self, chroma_store=None):
        self.stdout.write("Clearing synthetic data...")
        
        # Clear DB
        LostItem.objects.filter(title__startswith='[SYNTHETIC]').delete()
        FoundItem.objects.filter(title__startswith='[SYNTHETIC]').delete()
        
        if chroma_store:
            # We recreate the collection to clear it easily if it's just for synthetic found items
            # Or we could do a targeted delete if Chroma supported it easily. Let's just reset for now.
            chroma_store.reset_collection()
            
        self.stdout.write(self.style.SUCCESS('Successfully cleared synthetic data.'))
