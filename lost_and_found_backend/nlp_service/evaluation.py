"""Evaluation helpers for semantic matching.

Metrics implemented:
- Top-1 Accuracy
- Top-3 Accuracy
- Precision
- Recall

Precision/Recall are computed on predicted pairs (lost -> predicted found) versus
provided ground truth pairs. Optionally, a similarity threshold can be used to
abstain (predict no match).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple


@dataclass(frozen=True)
class RetrievalMetrics:
    top1_accuracy: float
    top3_accuracy: float
    precision: float
    recall: float

    total_queries: int
    total_ground_truth: int
    total_predictions: int
    true_positives: int
    false_positives: int
    false_negatives: int


def compute_retrieval_metrics(
    *,
    ground_truth: Dict[str, str],
    retrieved_ids: Dict[str, List[str]],
    top1_scores: Optional[Dict[str, float]] = None,
    predict_threshold: Optional[float] = None,
) -> RetrievalMetrics:
    """Compute metrics for retrieval-based matching.

    Args:
        ground_truth: mapping lost_id -> found_id for known true pairs.
        retrieved_ids: mapping lost_id -> list of retrieved found IDs (ranked).
        top1_scores: optional mapping lost_id -> similarity score for the top-1 result.
        predict_threshold: if provided, only count a top-1 prediction when score >= threshold.

    Notes:
        - Top-k accuracy is computed only for queries present in `ground_truth`.
        - Precision/Recall:
            predictions are (lost_id -> top-1 found_id) optionally gated by threshold.
    """

    gt_pairs: Set[Tuple[str, str]] = {(l, f) for l, f in ground_truth.items()}

    # Top-1 / Top-3 over the ground truth queries
    gt_query_ids = list(ground_truth.keys())
    top1_hits = 0
    top3_hits = 0

    for lost_id in gt_query_ids:
        gold_found = ground_truth[lost_id]
        ranked = retrieved_ids.get(lost_id) or []
        if not ranked:
            continue
        if ranked[0] == gold_found:
            top1_hits += 1
        if gold_found in ranked[:3]:
            top3_hits += 1

    total_queries = len(gt_query_ids)
    top1_acc = (top1_hits / total_queries) if total_queries else 0.0
    top3_acc = (top3_hits / total_queries) if total_queries else 0.0

    # Predictions set
    predicted_pairs: Set[Tuple[str, str]] = set()
    for lost_id, ranked in retrieved_ids.items():
        if not ranked:
            continue
        predicted = ranked[0]
        if predict_threshold is not None:
            if top1_scores is None:
                raise ValueError("top1_scores is required when predict_threshold is set")
            score = float(top1_scores.get(lost_id, float("-inf")))
            if score < predict_threshold:
                continue
        predicted_pairs.add((lost_id, predicted))

    tp = len(predicted_pairs.intersection(gt_pairs))
    fp = len(predicted_pairs - gt_pairs)
    fn = len(gt_pairs - predicted_pairs)

    precision = (tp / (tp + fp)) if (tp + fp) else 0.0
    recall = (tp / (tp + fn)) if (tp + fn) else 0.0

    return RetrievalMetrics(
        top1_accuracy=top1_acc,
        top3_accuracy=top3_acc,
        precision=precision,
        recall=recall,
        total_queries=total_queries,
        total_ground_truth=len(gt_pairs),
        total_predictions=len(predicted_pairs),
        true_positives=tp,
        false_positives=fp,
        false_negatives=fn,
    )
