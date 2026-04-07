"""CSV dataset loader for synthetic lost/found evaluation.

Expected files:
- lost_found_items_dataset.csv
- lost_found_ground_truth_matches.csv

This keeps evaluation independent of the DB models.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


@dataclass(frozen=True)
class CsvItem:
    item_id: str
    item_type: str  # LOST / FOUND
    title: str
    category: str
    color: str
    brand: str
    location: str
    event_date: str
    description: str
    status: str
    semantic_text: str


def load_items_csv(path: str | Path) -> Tuple[Dict[str, CsvItem], Dict[str, CsvItem]]:
    """Load items CSV and return (lost_by_id, found_by_id)."""

    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(str(path))

    lost: Dict[str, CsvItem] = {}
    found: Dict[str, CsvItem] = {}

    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        required = {
            "item_id",
            "item_type",
            "title",
            "category",
            "color",
            "brand",
            "location",
            "event_date",
            "description",
            "status",
            "semantic_text",
        }
        if not reader.fieldnames:
            raise ValueError("Items CSV has no header")
        missing = required - set(reader.fieldnames)
        if missing:
            raise ValueError(f"Items CSV missing columns: {sorted(missing)}")

        for row in reader:
            item = CsvItem(
                item_id=row["item_id"].strip(),
                item_type=row["item_type"].strip().upper(),
                title=row["title"].strip(),
                category=row["category"].strip(),
                color=row["color"].strip(),
                brand=row["brand"].strip(),
                location=row["location"].strip(),
                event_date=row["event_date"].strip(),
                description=row["description"].strip(),
                status=row["status"].strip(),
                semantic_text=row["semantic_text"].strip(),
            )

            if item.item_type == "LOST":
                lost[item.item_id] = item
            elif item.item_type == "FOUND":
                found[item.item_id] = item
            else:
                raise ValueError(f"Unexpected item_type '{item.item_type}' for {item.item_id}")

    return lost, found


@dataclass(frozen=True)
class CsvMatchPair:
    lost_item_id: str
    found_item_id: str
    is_true_match: bool
    notes: str


def load_ground_truth_matches_csv(path: str | Path) -> List[CsvMatchPair]:
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(str(path))

    pairs: List[CsvMatchPair] = []

    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        required = {"lost_item_id", "found_item_id", "is_true_match", "notes"}
        if not reader.fieldnames:
            raise ValueError("Matches CSV has no header")
        missing = required - set(reader.fieldnames)
        if missing:
            raise ValueError(f"Matches CSV missing columns: {sorted(missing)}")

        for row in reader:
            is_true = row["is_true_match"].strip() in {"1", "true", "True", "yes", "YES"}
            pairs.append(
                CsvMatchPair(
                    lost_item_id=row["lost_item_id"].strip(),
                    found_item_id=row["found_item_id"].strip(),
                    is_true_match=is_true,
                    notes=row.get("notes", "").strip(),
                )
            )

    return pairs


def build_true_pair_map(pairs: Iterable[CsvMatchPair]) -> Dict[str, str]:
    """Convert a list of match pairs into a (lost_id -> found_id) map.

    Assumes at most one true match per lost item. If multiple exist, the first
    encountered wins.
    """

    result: Dict[str, str] = {}
    for p in pairs:
        if not p.is_true_match:
            continue
        if p.lost_item_id not in result:
            result[p.lost_item_id] = p.found_item_id
    return result
