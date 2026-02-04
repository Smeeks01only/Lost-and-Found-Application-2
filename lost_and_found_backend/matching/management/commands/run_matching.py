"""
Management command to trigger NLP matching for all lost items.

Usage:
    python manage.py run_matching
"""

from django.core.management.base import BaseCommand
from items.models import LostItem, FoundItem
from matching.models import Match
from nlp_service.matching import find_matches_for_lost_item


class Command(BaseCommand):
    help = 'Run NLP matching algorithm for all active lost items'

    def add_arguments(self, parser):
        parser.add_argument(
            '--threshold',
            type=float,
            default=0.5,
            help='Minimum score threshold (default: 0.5)'
        )

    def handle(self, *args, **options):
        threshold = options['threshold']
        
        # Get all active lost items that are still searching
        lost_items = LostItem.objects.filter(status='SEARCHING', is_active=True)
        found_items = FoundItem.objects.filter(status='AVAILABLE')
        
        self.stdout.write(f'Found {lost_items.count()} active lost items')
        self.stdout.write(f'Found {found_items.count()} available found items')
        
        if not lost_items.exists():
            self.stdout.write(self.style.WARNING('No lost items to match'))
            return
            
        if not found_items.exists():
            self.stdout.write(self.style.WARNING('No found items to match against'))
            return
        
        total_matches = 0
        
        for lost_item in lost_items:
            self.stdout.write(f'\nProcessing: {lost_item.title}')
            
            try:
                matches = find_matches_for_lost_item(
                    lost_item, 
                    top_k=5, 
                    threshold=threshold
                )
                
                for match_data in matches:
                    found_item = match_data['found_item']
                    score = match_data['final_score']
                    
                    # Check if match already exists
                    existing = Match.objects.filter(
                        lost_item=lost_item,
                        found_item=found_item
                    ).first()
                    
                    if not existing:
                        # Create new match
                        Match.objects.create(
                            lost_item=lost_item,
                            found_item=found_item,
                            semantic_score=match_data.get('semantic_score', 0),
                            time_score=match_data.get('time_score', 0),
                            location_score=match_data.get('location_score', 0),
                            final_score=score,
                            status='POTENTIAL'
                        )
                        total_matches += 1
                        self.stdout.write(
                            self.style.SUCCESS(f'  ✓ New match with "{found_item.title}" (score: {score:.2f})')
                        )
                    else:
                        self.stdout.write(f'  - Match already exists with "{found_item.title}"')
                        
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  Error matching: {e}')
                )
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Created {total_matches} new matches'))
