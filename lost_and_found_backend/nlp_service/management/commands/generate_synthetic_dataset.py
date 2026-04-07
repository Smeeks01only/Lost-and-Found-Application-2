"""Generate a synthetic dataset in the DB and index it in ChromaDB.

Usage:
  python manage.py generate_synthetic_dataset
  python manage.py generate_synthetic_dataset --lost 70 --found 70 --pairs 45 --seed 123

This creates:
- synthetic users (1 regular user + 1 staff uploader)
- LostItem records
- FoundItem records
- a JSON file with ground-truth pairs
- a persistent ChromaDB collection for FOUND item embeddings
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from items.models import FoundItem, LostItem
from nlp_service.chroma_vector_store import ChromaVectorStore
from nlp_service.embeddings import embedding_generator
from nlp_service.synthetic_dataset import SYNTHETIC_TAG, generate_synthetic_dataset


class Command(BaseCommand):
    help = "Generate synthetic LOST/FOUND items and index FOUND embeddings in ChromaDB"

    def add_arguments(self, parser):
        parser.add_argument("--lost", type=int, default=60, help="Number of LOST items")
        parser.add_argument("--found", type=int, default=60, help="Number of FOUND items")
        parser.add_argument("--pairs", type=int, default=40, help="Number of true matching pairs")
        parser.add_argument("--seed", type=int, default=42, help="Random seed")
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing synthetic items and reset Chroma collection",
        )

    def handle(self, *args, **options):
        lost_count: int = options["lost"]
        found_count: int = options["found"]
        true_pairs: int = options["pairs"]
        seed: int = options["seed"]
        reset: bool = options["reset"]

        dataset = generate_synthetic_dataset(
            lost_count=lost_count,
            found_count=found_count,
            true_pairs=true_pairs,
            seed=seed,
        )

        base_dir = Path(getattr(settings, "BASE_DIR"))
        out_dir = base_dir / "synthetic_data"
        out_dir.mkdir(parents=True, exist_ok=True)
        pairs_path = out_dir / "ground_truth_pairs.json"

        chroma_path = out_dir / "chroma"
        collection_name = "synthetic_found_items"
        store = ChromaVectorStore(persist_path=chroma_path, collection_name=collection_name)

        with transaction.atomic():
            if reset:
                # Delete synthetic DB rows
                LostItem.objects.filter(title__startswith=SYNTHETIC_TAG).delete()
                FoundItem.objects.filter(title__startswith=SYNTHETIC_TAG).delete()
                # Reset Chroma collection
                store.reset_collection()

            # Create (or reuse) synthetic users.
            regular, _ = User.objects.get_or_create(
                email="synthetic.user@example.com",
                defaults={
                    "full_name": "Synthetic User",
                    "role": "LOSER",
                    "is_active": True,
                    "is_verified": True,
                },
            )
            staff, _ = User.objects.get_or_create(
                email="synthetic.staff@example.com",
                defaults={
                    "full_name": "Synthetic Staff",
                    "role": "STAFF",
                    "is_active": True,
                    "is_verified": True,
                    "is_staff": True,
                },
            )

            # Create DB items
            created_lost: List[LostItem] = []
            created_found: List[FoundItem] = []

            for li in dataset.lost:
                created_lost.append(
                    LostItem.objects.create(
                        user=regular,
                        title=f"{SYNTHETIC_TAG} {li.title}",
                        description=li.description,
                        category=li.category,
                        location_lost=li.location,
                        date_lost=li.when,
                        status="SEARCHING",
                        is_active=True,
                    )
                )

            for fi in dataset.found:
                created_found.append(
                    FoundItem.objects.create(
                        uploaded_by=staff,
                        title=f"{SYNTHETIC_TAG} {fi.title}",
                        description=fi.description,
                        category=fi.category,
                        location_found=fi.location,
                        date_found=fi.when,
                        status="AVAILABLE",
                    )
                )

        # Build embeddings and upsert to Chroma (outside transaction).
        found_docs: List[str] = [f.get_combined_text() for f in created_found]
        found_embeddings = embedding_generator.generate_batch_embeddings(found_docs)

        metadatas: List[Dict[str, Any]] = []
        for f in created_found:
            metadatas.append(
                {
                    "category": f.category,
                    "location": f.location_found,
                    "date": f.date_found.isoformat(),
                }
            )

        store.upsert(
            ids=[str(f.id) for f in created_found],
            embeddings=found_embeddings,
            documents=found_docs,
            metadatas=metadatas,
        )

        # Write ground truth file using actual DB UUIDs.
        gt: Dict[str, str] = {}
        for lost_idx, found_idx in dataset.pairs.items():
            gt[str(created_lost[lost_idx].id)] = str(created_found[found_idx].id)

        pairs_path.write_text(json.dumps(gt, indent=2), encoding="utf-8")

        self.stdout.write(self.style.SUCCESS("✓ Synthetic dataset generated"))
        self.stdout.write(f"- LOST: {len(created_lost)}")
        self.stdout.write(f"- FOUND: {len(created_found)}")
        self.stdout.write(f"- True pairs: {len(gt)}")
        self.stdout.write(f"- Ground truth file: {pairs_path}")
        self.stdout.write(f"- Chroma persist dir: {chroma_path}")
        self.stdout.write(f"- Chroma collection: {collection_name}")
