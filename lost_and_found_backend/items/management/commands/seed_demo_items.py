from __future__ import annotations

import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import User
from items.models import FoundItem, FoundItemStatus, ItemCategory, LostItem, LostItemStatus


class Command(BaseCommand):
    help = "Seeds a small set of demo Lost/Found items for existing users."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=5,
            help="How many demo lost items to create (and matching found items).",
        )
        parser.add_argument(
            "--loser-email",
            type=str,
            default=None,
            help="Optional: seed demo lost items only for this user email.",
        )
        parser.add_argument(
            "--staff-email",
            type=str,
            default=None,
            help="Optional: use this staff email as the uploader for found items.",
        )
        parser.add_argument(
            "--run-matching",
            action="store_true",
            default=True,
            help="Run matching once after seeding.",
        )
        parser.add_argument(
            "--no-run-matching",
            action="store_false",
            dest="run_matching",
            help="Do not run matching after seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        count: int = options["count"]
        loser_email: str | None = options["loser_email"]
        staff_email: str | None = options["staff_email"]
        run_matching: bool = options["run_matching"]

        staff_user = self._resolve_staff_user(staff_email)
        losers = self._resolve_losers(loser_email, count)

        if not losers:
            self.stderr.write(self.style.ERROR("No LOSER users found to seed items for."))
            return

        now = timezone.now()

        # A few semantically distinctive pairs (lost <-> found)
        demo_templates = [
            {
                "category": ItemCategory.OTHER,
                "lost_title": "[DEMO] Green Stanley tumbler",
                "lost_desc": "A green Stanley stainless steel tumbler with a handle and straw lid.",
                "found_title": "[DEMO] Green Stanley cup / tumbler",
                "found_desc": "Found a green Stanley insulated tumbler with handle and straw.",
                "location": "Student Center",
                "secret_q": "What sticker is on it?",
                "secret_a": "campus logo",
            },
            {
                "category": ItemCategory.HEADPHONES,
                "lost_title": "[DEMO] White Apple AirPods",
                "lost_desc": "Lost white Apple AirPods (possibly in a white case).",
                "found_title": "[DEMO] White AirPods earbuds",
                "found_desc": "White Apple AirPods earbuds found near the library entrance.",
                "location": "Main Library",
                "secret_q": "What name is engraved?",
                "secret_a": "none",
            },
            {
                "category": ItemCategory.BAG,
                "lost_title": "[DEMO] Grey JanSport backpack",
                "lost_desc": "Grey JanSport backpack with a small keychain attached to the zipper.",
                "found_title": "[DEMO] Grey Jansport bag",
                "found_desc": "Grey JanSport backpack found; has a small keychain on the zipper.",
                "location": "Bus Stop",
                "secret_q": "What keychain is attached?",
                "secret_a": "blue star",
            },
            {
                "category": ItemCategory.DOCUMENTS,
                "lost_title": "[DEMO] Student ID Card",
                "lost_desc": "Lost my student ID card (plastic) near the cafeteria.",
                "found_title": "[DEMO] Student ID badge",
                "found_desc": "Found a student ID card/badge in the cafeteria area.",
                "location": "Cafeteria",
                "secret_q": "What is the first name on it?",
                "secret_a": "demo",
            },
            {
                "category": ItemCategory.KEYS,
                "lost_title": "[DEMO] Set of keys",
                "lost_desc": "A set of keys on a metal ring; includes a small black fob.",
                "found_title": "[DEMO] Keyring with black fob",
                "found_desc": "Keyring found; has multiple keys and a small black fob.",
                "location": "Gym",
                "secret_q": "How many keys?",
                "secret_a": "3",
            },
        ]

        created_lost = 0
        created_found = 0

        # Seed up to `count` lost items distributed across existing losers.
        # For each lost item, also create a semantically matching found item.
        for i in range(count):
            user = losers[i % len(losers)]
            template = demo_templates[i % len(demo_templates)]

            days_ago = random.randint(0, 2)
            event_date = (now - timedelta(days=days_ago)).date()

            lost_item = LostItem.objects.create(
                user=user,
                title=template["lost_title"],
                description=template["lost_desc"],
                category=template["category"],
                location_lost=template["location"],
                date_lost=event_date,
                status=LostItemStatus.SEARCHING,
                is_active=True,
            )
            created_lost += 1

            found_item = FoundItem.objects.create(
                uploaded_by=staff_user,
                title=template["found_title"],
                description=template["found_desc"],
                category=template["category"],
                location_found=template["location"],
                date_found=event_date,
                status=FoundItemStatus.AVAILABLE,
                secret_question=template["secret_q"],
            )
            found_item.set_secret_answer(template["secret_a"])
            found_item.save(update_fields=["secret_answer_hash", "secret_answer_raw"])
            created_found += 1

            self.stdout.write(
                f"Created LostItem {lost_item.id} for {user.email} and FoundItem {found_item.id}"
            )

        # Also add a couple of distractor found items to make matching realistic.
        distractors = [
            {
                "category": ItemCategory.OTHER,
                "title": "[DEMO] Blue water bottle",
                "desc": "Blue plastic water bottle found near the parking lot.",
                "location": "Parking Lot",
            },
            {
                "category": ItemCategory.BOOKS,
                "title": "[DEMO] Notebook and pen",
                "desc": "Spiral notebook with a black pen inside.",
                "location": "Lecture Hall",
            },
        ]

        for d in distractors:
            FoundItem.objects.create(
                uploaded_by=staff_user,
                title=d["title"],
                description=d["desc"],
                category=d["category"],
                location_found=d["location"],
                date_found=now.date(),
                status=FoundItemStatus.AVAILABLE,
            )
            created_found += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded demo items: lost={created_lost}, found={created_found}"))

        if run_matching:
            from nlp_service.matching import execute_matching_algorithm

            execute_matching_algorithm()
            self.stdout.write(self.style.SUCCESS("Ran matching once after seeding."))

    def _resolve_staff_user(self, staff_email: str | None) -> User:
        if staff_email:
            staff_user = User.objects.filter(email__iexact=staff_email).first()
            if not staff_user:
                raise SystemExit(f"No user found with email: {staff_email}")
            if not staff_user.has_staff_permissions():
                raise SystemExit(f"User {staff_email} is not STAFF/ADMIN")
            return staff_user

        staff_user = User.objects.filter(role__in=[User.RoleChoices.STAFF, User.RoleChoices.ADMIN]).order_by("created_at").first()
        if staff_user:
            return staff_user

        raise SystemExit(
            "No STAFF/ADMIN user found. Create a staff user first (or pass --staff-email)."
        )

    def _resolve_losers(self, loser_email: str | None, count: int) -> list[User]:
        if loser_email:
            user = User.objects.filter(email__iexact=loser_email).first()
            if not user:
                raise SystemExit(f"No user found with email: {loser_email}")
            return [user]

        # Prefer real LOSER users. If none exist, fall back to any non-staff user.
        losers = list(User.objects.filter(role=User.RoleChoices.LOSER).order_by("created_at")[: max(count, 1)])
        if losers:
            return losers

        losers = list(User.objects.filter(is_active=True).exclude(role=User.RoleChoices.ADMIN).order_by("created_at")[: max(count, 1)])
        return losers
