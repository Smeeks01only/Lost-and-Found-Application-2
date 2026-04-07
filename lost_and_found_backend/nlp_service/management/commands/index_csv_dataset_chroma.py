"""Index synthetic CSV FOUND items into ChromaDB.

Usage:
    python manage.py index_csv_dataset_chroma
    python manage.py index_csv_dataset_chroma --reset
    python manage.py index_csv_dataset_chroma --items-csv ..\\lost_found_items_dataset.csv

This reads `semantic_text` for FOUND items and stores embeddings in a persistent
ChromaDB collection.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

from django.conf import settings
from django.core.management.base import BaseCommand

from nlp_service.chroma_vector_store import ChromaVectorStore
from nlp_service.csv_dataset import load_items_csv
from nlp_service.embeddings import embedding_generator


class Command(BaseCommand):
    help = "Index FOUND embeddings from CSV into ChromaDB"

    def add_arguments(self, parser):
        parser.add_argument(
            "--items-csv",
            type=str,
            default=None,
            help="Path to lost_found_items_dataset.csv (default: project root)",
        )
        parser.add_argument(
            "--persist-dir",
            type=str,
            default=None,
            help="Chroma persist directory (default: settings.CHROMA_PERSIST_PATH)",
        )
        parser.add_argument(
            "--collection",
            type=str,
            default=None,
            help="Chroma collection name (default: settings.CHROMA_COLLECTION_FOUND)",
        )
        parser.add_argument("--reset", action="store_true", help="Reset the collection first")

    def handle(self, *args, **options):
        base_dir = Path(getattr(settings, "BASE_DIR"))
        project_root = base_dir.parent

        items_csv = options["items_csv"] or str(project_root / "lost_found_items_dataset.csv")
        persist_dir = options["persist_dir"] or str(getattr(settings, "CHROMA_PERSIST_PATH", base_dir / "synthetic_data" / "chroma"))
        collection = options["collection"] or str(getattr(settings, "CHROMA_COLLECTION_FOUND", "synthetic_found_items"))
        reset: bool = bool(options["reset"])

        lost, found = load_items_csv(items_csv)

        store = ChromaVectorStore(persist_path=persist_dir, collection_name=collection)
        if reset:
            store.reset_collection()

        found_ids = sorted(found.keys())
        docs: List[str] = [found[i].semantic_text for i in found_ids]

        embeddings = embedding_generator.generate_batch_embeddings(docs)

        metadatas: List[Dict[str, Any]] = []
        for i in found_ids:
            f = found[i]
            metadatas.append(
                {
                    "item_id": f.item_id,
                    "category": f.category,
                    "color": f.color,
                    "brand": f.brand,
                    "location": f.location,
                    "event_date": f.event_date,
                    "status": f.status,
                }
            )

        store.upsert(ids=found_ids, embeddings=embeddings, documents=docs, metadatas=metadatas)

        self.stdout.write(self.style.SUCCESS("✓ Indexed FOUND items in ChromaDB"))
        self.stdout.write(f"- Items CSV: {items_csv}")
        self.stdout.write(f"- FOUND items indexed: {len(found_ids)}")
        self.stdout.write(f"- Persist dir: {persist_dir}")
        self.stdout.write(f"- Collection: {collection}")
