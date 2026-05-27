from datetime import date

from django.db.models.signals import post_save
from django.test import TestCase

from accounts.models import User
from items.models import FoundItem, LostItem
from matching.models import Match
from notifications.models import Notification


class MatchNotificationSignalTests(TestCase):
	def setUp(self):
		# Disconnect item signals to avoid loading the NLP model/vector store.
		from items import signals as item_signals

		self._item_signals = item_signals
		post_save.disconnect(item_signals.generate_found_item_embedding, sender=FoundItem)
		post_save.disconnect(item_signals.run_matching_for_lost_item, sender=LostItem)

	def tearDown(self):
		# Reconnect item signals.
		post_save.connect(self._item_signals.generate_found_item_embedding, sender=FoundItem)
		post_save.connect(self._item_signals.run_matching_for_lost_item, sender=LostItem)

	def test_notification_created_on_new_potential_match(self):
		loser = User.objects.create_user(
			email='loser@example.com',
			password='pass1234',
			full_name='Loser User',
			role='LOSER',
		)
		staff = User.objects.create_user(
			email='staff@example.com',
			password='pass1234',
			full_name='Staff User',
			role='STAFF',
		)

		lost_item = LostItem.objects.create(
			user=loser,
			title='iPhone 12',
			description='Black iPhone with a cracked screen',
			category='PHONE',
			location_lost='Library',
			date_lost=date.today(),
		)
		found_item = FoundItem.objects.create(
			uploaded_by=staff,
			title='Found phone',
			description='Black iPhone found near the library entrance',
			category='PHONE',
			location_found='Library',
			date_found=date.today(),
			status='AVAILABLE',
		)

		match = Match.objects.create(
			lost_item=lost_item,
			found_item=found_item,
			final_score=0.9,
			status='POTENTIAL',
		)

		self.assertTrue(
			Notification.objects.filter(
				user=loser,
				notification_type='MATCH_FOUND',
				related_match=match,
			).exists()
		)
