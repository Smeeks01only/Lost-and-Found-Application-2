from __future__ import annotations

from typing import Optional

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Inspect the FAISS found-items vector store (stats + mapped items)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--top",
            type=int,
            default=20,
            help="How many mapped FoundItems to print (default: 20)",
        )
        parser.add_argument(
            "--query",
            type=str,
            default=None,
            help="Optional text query to run a nearest-neighbor search against FAISS.",
        )
        parser.add_argument(
            "--k",
            type=int,
            default=5,
            help="Top-K results for --query (default: 5)",
        )
        parser.add_argument(
            "--include-missing",
            action="store_true",
            help="Also print mapped item UUIDs that no longer exist in the DB.",
        )

    def handle(self, *args, **options):
        top: int = max(0, int(options["top"]))
        query: Optional[str] = options.get("query")
        k: int = max(1, int(options["k"]))
        include_missing: bool = bool(options.get("include_missing"))

        import os

        from django.conf import settings

        from nlp_service.vector_store import VectorStore
        from items.models import FoundItem

        dimension = int(getattr(settings, "NLP_EMBEDDING_DIMENSION", 384) or 384)
        index_type_setting = str(getattr(settings, "NLP_FAISS_INDEX_TYPE", "ip") or "ip")
        store_path = getattr(settings, "VECTOR_STORE_PATH", "vector_stores")
        base_file = os.path.join(str(store_path), "found_items")

        store = VectorStore(dimension=dimension, index_type=index_type_setting)
        store.load(base_file)
        index = store.index

        index_type = type(index).__name__ if index is not None else "None"
        index_dim = getattr(index, "d", store.dimension) if index is not None else store.dimension
        ntotal = int(getattr(index, "ntotal", 0)) if index is not None else 0

        mapped = len(store.item_to_id)
        self.stdout.write("FAISS found_items store")
        self.stdout.write(f"- base_file: {base_file}")
        self.stdout.write(f"- index_type: {index_type}")
        self.stdout.write(f"- dimension: {index_dim}")
        self.stdout.write(f"- ntotal: {ntotal}")
        self.stdout.write(f"- mapped_items: {mapped}")

        if ntotal == 0 or mapped == 0:
            self.stdout.write("(store is empty)")
            return

        if query:
            from nlp_service.embeddings import embedding_generator

            self.stdout.write("")
            self.stdout.write(f"Nearest neighbors for query: {query!r}")
            query_vec = embedding_generator.generate_embedding(query)
            results = store.search(query_vec, top_k=k)
            if not results:
                self.stdout.write("(no results)")
            for i, r in enumerate(results, start=1):
                item_id = r.get("item_id")
                sim = float(r.get("similarity", 0.0))
                fi = FoundItem.objects.filter(id=item_id).first()
                title = getattr(fi, "title", None)
                status = getattr(fi, "status", None)
                location = getattr(fi, "location_found", None)
                self.stdout.write(f"{i}. sim={sim:.4f} id={item_id} title={title!r} status={status} location={location!r}")

        if top <= 0:
            return

        self.stdout.write("")
        existing_pairs = []
        missing_pairs = []
        for item_uuid, faiss_id in store.item_to_id.items():
            if FoundItem.objects.filter(id=item_uuid).exists():
                existing_pairs.append((item_uuid, faiss_id))
            else:
                missing_pairs.append((item_uuid, faiss_id))

        self.stdout.write(f"- existing_in_db: {len(existing_pairs)}")
        self.stdout.write(f"- missing_in_db: {len(missing_pairs)}")

        self.stdout.write("")
        self.stdout.write(f"First {min(top, len(existing_pairs))} existing items")
        shown = 0
        for item_uuid, faiss_id in existing_pairs[:top]:
            fi = FoundItem.objects.filter(id=item_uuid).first()
            if fi is None:
                continue
            self.stdout.write(
                "- faiss_id={faiss_id} id={id} title={title!r} category={category} status={status}"
                .format(
                    faiss_id=faiss_id,
                    id=str(fi.id),
                    title=fi.title,
                    category=fi.category,
                    status=fi.status,
                )
            )
            shown += 1

        if shown == 0:
            self.stdout.write("(no existing DB items found in mappings)")

        if include_missing and missing_pairs:
            self.stdout.write("")
            self.stdout.write(f"First {min(top, len(missing_pairs))} missing items (present in mappings, absent in DB)")
            for item_uuid, faiss_id in missing_pairs[:top]:
                self.stdout.write(f"- faiss_id={faiss_id} id={item_uuid} (missing in DB)")
