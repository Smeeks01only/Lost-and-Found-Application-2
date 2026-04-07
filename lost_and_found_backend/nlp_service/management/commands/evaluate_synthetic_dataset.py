"""Evaluate synthetic dataset retrieval using ChromaDB.

Usage:
  python manage.py evaluate_synthetic_dataset
  python manage.py evaluate_synthetic_dataset --topk 10
  python manage.py evaluate_synthetic_dataset --threshold 0.55

Requires that you ran:
  python manage.py generate_synthetic_dataset

Reads ground truth from:
  <BASE_DIR>/synthetic_data/ground_truth_pairs.json
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional

from django.conf import settings
from django.core.management.base import BaseCommand

from items.models import LostItem
from nlp_service.chroma_vector_store import ChromaVectorStore
from nlp_service.embeddings import embedding_generator
from nlp_service.evaluation import compute_retrieval_metrics
from nlp_service.synthetic_dataset import SYNTHETIC_TAG


class Command(BaseCommand):
    help = "Evaluate Top-1/Top-3, precision, recall on the synthetic dataset"

    def add_arguments(self, parser):
        parser.add_argument("--topk", type=int, default=10, help="Retrieved candidates per query")
        parser.add_argument(
            "--threshold",
            type=float,
            default=None,
            help="Optional similarity threshold for counting a top-1 prediction",
        )

    def handle(self, *args, **options):
        topk: int = options["topk"]
        threshold: Optional[float] = options["threshold"]

        base_dir = Path(getattr(settings, "BASE_DIR"))
        out_dir = base_dir / "synthetic_data"
        pairs_path = out_dir / "ground_truth_pairs.json"

        if not pairs_path.exists():
            raise SystemExit(
                "Ground truth file not found. Run: python manage.py generate_synthetic_dataset"
            )

        ground_truth: Dict[str, str] = json.loads(pairs_path.read_text(encoding="utf-8"))

        chroma_path = out_dir / "chroma"
        collection_name = "synthetic_found_items"
        store = ChromaVectorStore(persist_path=chroma_path, collection_name=collection_name)

        lost_qs = LostItem.objects.filter(id__in=list(ground_truth.keys()))

        retrieved: Dict[str, List[str]] = {}
        top1_scores: Dict[str, float] = {}

        for lost_item in lost_qs:
            text = lost_item.get_combined_text()
            emb = embedding_generator.generate_embedding(text)
            result = store.query(emb, top_k=min(topk, 50))
            retrieved[str(lost_item.id)] = result.ids
            sims = result.similarities()
            if sims:
                top1_scores[str(lost_item.id)] = float(sims[0])

        metrics = compute_retrieval_metrics(
            ground_truth=ground_truth,
            retrieved_ids=retrieved,
            top1_scores=top1_scores,
            predict_threshold=threshold,
        )

        self.stdout.write(self.style.SUCCESS("✓ Synthetic dataset evaluation"))
        self.stdout.write(f"- Queries (ground truth pairs): {metrics.total_queries}")
        self.stdout.write(f"- Top-1 Accuracy: {metrics.top1_accuracy:.3f}")
        self.stdout.write(f"- Top-3 Accuracy: {metrics.top3_accuracy:.3f}")
        self.stdout.write(f"- Precision: {metrics.precision:.3f}")
        self.stdout.write(f"- Recall: {metrics.recall:.3f}")
        if threshold is not None:
            self.stdout.write(f"- Threshold: {threshold:.2f}")
        self.stdout.write(
            f"- TP/FP/FN: {metrics.true_positives}/{metrics.false_positives}/{metrics.false_negatives}"
        )
