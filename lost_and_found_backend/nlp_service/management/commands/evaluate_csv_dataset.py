"""Evaluate semantic retrieval on the synthetic CSV dataset.

Workflow:
  1) Index FOUND items:
     python manage.py index_csv_dataset_chroma --reset

  2) Evaluate:
     python manage.py evaluate_csv_dataset

Metrics:
- Top-1 Accuracy
- Top-3 Accuracy
- Precision
- Recall

Precision/Recall are computed using top-1 predictions per query, optionally
filtered by a similarity threshold.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional

from django.conf import settings
from django.core.management.base import BaseCommand

from nlp_service.chroma_vector_store import ChromaVectorStore
from nlp_service.csv_dataset import build_true_pair_map, load_ground_truth_matches_csv, load_items_csv
from nlp_service.embeddings import embedding_generator
from nlp_service.evaluation import compute_retrieval_metrics


class Command(BaseCommand):
    help = "Evaluate Top-1/Top-3 accuracy and precision/recall on the CSV synthetic dataset"

    def add_arguments(self, parser):
        parser.add_argument(
            "--items-csv",
            type=str,
            default=None,
            help="Path to lost_found_items_dataset.csv (default: project root)",
        )
        parser.add_argument(
            "--matches-csv",
            type=str,
            default=None,
            help="Path to lost_found_ground_truth_matches.csv (default: project root)",
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
        parser.add_argument("--topk", type=int, default=10, help="Retrieved candidates per query")
        parser.add_argument(
            "--threshold",
            type=float,
            default=None,
            help="Optional similarity threshold for counting a top-1 prediction",
        )

    def handle(self, *args, **options):
        base_dir = Path(getattr(settings, "BASE_DIR"))
        project_root = base_dir.parent

        items_csv = options["items_csv"] or str(project_root / "lost_found_items_dataset.csv")
        matches_csv = options["matches_csv"] or str(project_root / "lost_found_ground_truth_matches.csv")
        persist_dir = options["persist_dir"] or str(getattr(settings, "CHROMA_PERSIST_PATH", base_dir / "synthetic_data" / "chroma"))
        collection = options["collection"] or str(getattr(settings, "CHROMA_COLLECTION_FOUND", "synthetic_found_items"))

        topk: int = int(options["topk"])
        threshold: Optional[float] = options["threshold"]

        lost, found = load_items_csv(items_csv)
        pairs = load_ground_truth_matches_csv(matches_csv)
        ground_truth = build_true_pair_map(pairs)

        store = ChromaVectorStore(persist_path=persist_dir, collection_name=collection)

        # Retrieve for each lost in ground truth.
        retrieved: Dict[str, List[str]] = {}
        top1_scores: Dict[str, float] = {}

        for lost_id in ground_truth.keys():
            li = lost.get(lost_id)
            if li is None:
                continue

            emb = embedding_generator.generate_embedding(li.semantic_text)
            res = store.query(emb, top_k=min(topk, len(found)))
            retrieved[lost_id] = res.ids

            sims = res.similarities()
            if sims:
                top1_scores[lost_id] = float(sims[0])

        metrics = compute_retrieval_metrics(
            ground_truth=ground_truth,
            retrieved_ids=retrieved,
            top1_scores=top1_scores,
            predict_threshold=threshold,
        )

        self.stdout.write(self.style.SUCCESS("✓ CSV synthetic dataset evaluation"))
        self.stdout.write(f"- Items CSV: {items_csv}")
        self.stdout.write(f"- Matches CSV: {matches_csv}")
        self.stdout.write(f"- Queries (true pairs): {metrics.total_queries}")
        self.stdout.write(f"- Top-1 Accuracy: {metrics.top1_accuracy:.3f}")
        self.stdout.write(f"- Top-3 Accuracy: {metrics.top3_accuracy:.3f}")
        self.stdout.write(f"- Precision: {metrics.precision:.3f}")
        self.stdout.write(f"- Recall: {metrics.recall:.3f}")
        if threshold is not None:
            self.stdout.write(f"- Threshold: {threshold:.2f}")
        self.stdout.write(
            f"- TP/FP/FN: {metrics.true_positives}/{metrics.false_positives}/{metrics.false_negatives}"
        )
        self.stdout.write(f"- Persist dir: {persist_dir}")
        self.stdout.write(f"- Collection: {collection}")
