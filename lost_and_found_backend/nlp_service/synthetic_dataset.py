"""Synthetic dataset generator for evaluation.

Creates a small, realistic-ish dataset of lost and found items suitable for
semantic similarity evaluation (SBERT + vector store retrieval).

Design goals:
- 100–150 total items
- Balanced LOST vs FOUND
- 30–50 known true pairs
- Include near-misses and distractors

The generated records are meant for *testing/evaluation*, not for training.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from items.models import ItemCategory


SYNTHETIC_TAG = "[SYNTHETIC]"


@dataclass(frozen=True)
class ItemText:
    title: str
    description: str
    category: str
    location: str
    when: date


@dataclass(frozen=True)
class SyntheticDataset:
    lost: List[ItemText]
    found: List[ItemText]
    # Ground truth mapping by positional index (lost_idx -> found_idx)
    pairs: Dict[int, int]


_LOCATIONS = [
    "Main Library", "Student Center", "Cafeteria", "Engineering Block",
    "Science Building", "Gymnasium", "Bus Stop", "Parking Lot A",
    "Auditorium", "Admin Office", "Lecture Hall 3", "Computer Lab",
    "Dorm Lobby", "Campus Clinic", "Bookstore",
]

_COLORS = [
    "black", "navy blue", "gray", "silver", "white", "red", "green",
    "maroon", "rose gold", "blue", "yellow",
]

_BRANDS = [
    "Apple", "Samsung", "HP", "Dell", "Lenovo", "Sony", "JBL",
    "Ray-Ban", "Fossil", "Nike", "Adidas", "Herschel",
]

_UNIQUE_MARKS = [
    "small scratch near the logo",
    "cracked screen protector",
    "blue sticker on the back",
    "keychain shaped like a star",
    "initials 'A.K.' written inside",
    "tiny dent on the corner",
    "spilled coffee stain on one side",
    "missing one ear tip",
    "lanyard attached to the zipper",
    "cartoon cat sticker",
]


def _pick(rng: random.Random, options: Sequence[str]) -> str:
    return options[rng.randrange(0, len(options))]


def _recent_date(rng: random.Random, *, days_back: int = 21) -> date:
    # Keep dates close to improve the time score realism.
    offset = rng.randrange(0, days_back + 1)
    return date.today() - timedelta(days=offset)


def _lost_phrase(rng: random.Random) -> str:
    return _pick(
        rng,
        [
            "lost", "misplaced", "left behind", "dropped", "can't find",
            "missing since",
        ],
    )


def _found_phrase(rng: random.Random) -> str:
    return _pick(
        rng,
        [
            "found", "picked up", "handed in", "recovered", "collected",
            "seen and secured",
        ],
    )


def _make_wallet(rng: random.Random, *, color: str, mark: str) -> Tuple[str, str]:
    title = f"{color.title()} wallet"
    desc = (
        f"{SYNTHETIC_TAG} A {color} wallet. {mark}. "
        f"Contains a few cards and a student ID slot."
    )
    return title, desc


def _make_phone(rng: random.Random, *, brand: str, color: str, mark: str) -> Tuple[str, str]:
    model = _pick(rng, ["iPhone 12", "iPhone 13", "Galaxy S21", "Galaxy A54", "Pixel 7"])
    title = f"{color.title()} {brand} phone"
    desc = (
        f"{SYNTHETIC_TAG} {brand} {model} in a {color} case. {mark}. "
        f"Lock screen wallpaper shows a nature photo."
    )
    return title, desc


def _make_keys(rng: random.Random, *, mark: str) -> Tuple[str, str]:
    title = "Set of keys"
    desc = (
        f"{SYNTHETIC_TAG} A small set of keys on a ring. {mark}. "
        f"Includes 2–3 standard keys and one small key."
    )
    return title, desc


def _make_laptop(rng: random.Random, *, brand: str, color: str, mark: str) -> Tuple[str, str]:
    size = _pick(rng, ["13-inch", "14-inch", "15-inch"])
    title = f"{brand} laptop ({size})"
    desc = (
        f"{SYNTHETIC_TAG} {brand} {size} laptop, {color} finish. {mark}. "
        f"May have a charger in the bag."
    )
    return title, desc


def _make_bag(rng: random.Random, *, brand: str, color: str, mark: str) -> Tuple[str, str]:
    kind = _pick(rng, ["backpack", "messenger bag", "tote bag"])
    title = f"{color.title()} {kind}"
    desc = (
        f"{SYNTHETIC_TAG} {brand} {color} {kind}. {mark}. "
        f"Has multiple compartments and a side pocket."
    )
    return title, desc


def _make_headphones(rng: random.Random, *, brand: str, color: str, mark: str) -> Tuple[str, str]:
    kind = _pick(rng, ["wireless earbuds", "over-ear headphones"])
    title = f"{brand} {kind}"
    desc = (
        f"{SYNTHETIC_TAG} {brand} {kind}, {color}. {mark}. "
        f"Stored in a small case/pouch."
    )
    return title, desc


def _make_documents(rng: random.Random, *, mark: str) -> Tuple[str, str]:
    title = "Document holder / ID"
    desc = (
        f"{SYNTHETIC_TAG} A small document holder with papers. {mark}. "
        f"Looks like it includes an ID card and printed sheets."
    )
    return title, desc


_CATEGORY_FACTORIES = [
    (ItemCategory.WALLET, _make_wallet),
    (ItemCategory.PHONE, _make_phone),
    (ItemCategory.KEYS, _make_keys),
    (ItemCategory.LAPTOP, _make_laptop),
    (ItemCategory.BAG, _make_bag),
    (ItemCategory.HEADPHONES, _make_headphones),
    (ItemCategory.DOCUMENTS, _make_documents),
]


def _make_item_text(rng: random.Random, category: str, *, location: str, when: date) -> ItemText:
    brand = _pick(rng, _BRANDS)
    color = _pick(rng, _COLORS)
    mark = _pick(rng, _UNIQUE_MARKS)

    factory = None
    for cat, fn in _CATEGORY_FACTORIES:
        if cat == category:
            factory = fn
            break
    if factory is None:
        # Fallback
        title = f"{color.title()} item"
        description = f"{SYNTHETIC_TAG} A {color} personal item. {mark}."
    else:
        # Some factories ignore some arguments.
        try:
            title, description = factory(rng, brand=brand, color=color, mark=mark)  # type: ignore[arg-type]
        except TypeError:
            try:
                title, description = factory(rng, color=color, mark=mark)  # type: ignore[arg-type]
            except TypeError:
                title, description = factory(rng, mark=mark)  # type: ignore[arg-type]

    return ItemText(
        title=title,
        description=description,
        category=str(category),
        location=location,
        when=when,
    )


def generate_synthetic_dataset(
    *,
    lost_count: int = 60,
    found_count: int = 60,
    true_pairs: int = 40,
    seed: int = 42,
) -> SyntheticDataset:
    """Generate a synthetic dataset with ground-truth pairs.

    Returns:
        SyntheticDataset with lost/found item texts + index-based ground truth pairs.
    """

    if true_pairs <= 0:
        raise ValueError("true_pairs must be > 0")
    if true_pairs > min(lost_count, found_count):
        raise ValueError("true_pairs must be <= min(lost_count, found_count)")

    rng = random.Random(seed)

    lost: List[ItemText] = []
    found: List[ItemText] = []
    pairs: Dict[int, int] = {}

    categories = [c for c, _ in _CATEGORY_FACTORIES]

    # 1) Create true pairs.
    for _ in range(true_pairs):
        category = _pick(rng, categories)
        location = _pick(rng, _LOCATIONS)
        lost_date = _recent_date(rng, days_back=21)
        found_date = lost_date + timedelta(days=rng.randrange(0, 4))

        base = _make_item_text(rng, category, location=location, when=lost_date)

        # Slightly vary the descriptions between lost and found while keeping key details.
        lost_desc = (
            f"{base.description} I { _lost_phrase(rng) } it near {location} on {lost_date.isoformat()}. "
            f"Please contact if found."
        )
        found_desc = (
            f"{base.description} { _found_phrase(rng).capitalize() } near {location} on {found_date.isoformat()}. "
            f"Stored at the lost and found office."
        )

        lost_item = ItemText(
            title=base.title,
            description=lost_desc,
            category=base.category,
            location=location,
            when=lost_date,
        )
        found_item = ItemText(
            title=base.title,
            description=found_desc,
            category=base.category,
            location=location,
            when=found_date,
        )

        lost_idx = len(lost)
        found_idx = len(found)

        lost.append(lost_item)
        found.append(found_item)
        pairs[lost_idx] = found_idx

    # 2) Add near-miss FOUND items (similar text, wrong unique detail).
    remaining_found = found_count - len(found)
    near_miss_found = max(0, min(remaining_found, max(8, true_pairs // 2)))

    for _ in range(near_miss_found):
        # Pick an existing paired found item and mutate it.
        base = found[rng.randrange(0, len(found))]
        location = base.location
        when = base.when + timedelta(days=rng.randrange(0, 3))

        mark = _pick(rng, _UNIQUE_MARKS)
        desc = (
            f"{SYNTHETIC_TAG} Similar-looking item but with a different detail: {mark}. "
            f"{ _found_phrase(rng).capitalize() } near {location} on {when.isoformat()}."
        )
        found.append(
            ItemText(
                title=base.title,
                description=desc,
                category=base.category,
                location=location,
                when=when,
            )
        )

    # 3) Fill remaining items with distractors.
    while len(lost) < lost_count:
        category = _pick(rng, categories)
        location = _pick(rng, _LOCATIONS)
        when = _recent_date(rng, days_back=28)
        item = _make_item_text(rng, category, location=location, when=when)
        desc = (
            f"{item.description} I { _lost_phrase(rng) } it near {location} on {when.isoformat()}."
        )
        lost.append(
            ItemText(
                title=item.title,
                description=desc,
                category=item.category,
                location=item.location,
                when=item.when,
            )
        )

    while len(found) < found_count:
        category = _pick(rng, categories)
        location = _pick(rng, _LOCATIONS)
        when = _recent_date(rng, days_back=28)
        item = _make_item_text(rng, category, location=location, when=when)
        desc = (
            f"{item.description} { _found_phrase(rng).capitalize() } near {location} on {when.isoformat()}."
        )
        found.append(
            ItemText(
                title=item.title,
                description=desc,
                category=item.category,
                location=item.location,
                when=item.when,
            )
        )

    return SyntheticDataset(lost=lost, found=found, pairs=pairs)
