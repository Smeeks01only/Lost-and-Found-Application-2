"""
Semantic Matching Algorithm

This module implements the hybrid matching algorithm that combines:
- Semantic similarity (SBERT embeddings)
- Time proximity scoring
- Location matching

Final score: S_final = (W1 * S_semantic) + (W2 * S_time) + (W3 * S_location)
"""

import math
import logging
from datetime import datetime, date
from typing import List, Dict, Tuple, Optional, Any

logger = logging.getLogger(__name__)


class SemanticMatcher:
    """
    Semantic matching algorithm for lost and found items.
    
    Combines multiple scoring factors with configurable weights.
    """
    
    def __init__(
        self,
        w_semantic: float = 0.6,
        w_time: float = 0.2,
        w_location: float = 0.2
    ):
        """
        Initialize the matcher with scoring weights.
        
        Args:
            w_semantic: Weight for semantic similarity (default 0.6)
            w_time: Weight for time proximity (default 0.2)
            w_location: Weight for location match (default 0.2)
        """
        self.w_semantic = w_semantic
        self.w_time = w_time
        self.w_location = w_location
        
        # Normalize weights to sum to 1.0
        total = w_semantic + w_time + w_location
        if total != 1.0:
            self.w_semantic /= total
            self.w_time /= total
            self.w_location /= total
    
    def calculate_time_score(
        self,
        date_lost: Optional[date],
        date_found: Optional[date]
    ) -> float:
        """
        Calculate time proximity score.
        
        Uses exponential decay with a 7-day half-life.
        Items found close to when they were lost score higher.
        
        Args:
            date_lost: Date when item was reported lost
            date_found: Date when item was found
            
        Returns:
            Score between 0 and 1
        """
        if not date_lost or not date_found:
            return 0.5  # Neutral score for missing data
        
        # Convert to date objects if datetime
        if isinstance(date_lost, datetime):
            date_lost = date_lost.date()
        if isinstance(date_found, datetime):
            date_found = date_found.date()
        
        days_diff = abs((date_found - date_lost).days)
        
        # Exponential decay with 7-day half-life
        # score = e^(-days_diff / 7)
        # At 7 days: ~0.37, at 14 days: ~0.14, at 30 days: ~0.01
        time_score = math.exp(-days_diff / 7.0)
        
        return time_score
    
    def calculate_location_score(
        self,
        location_lost: Optional[str],
        location_found: Optional[str]
    ) -> float:
        """
        Calculate location matching score.
        
        Uses text matching with partial match support.
        
        Args:
            location_lost: Location where item was lost
            location_found: Location where item was found
            
        Returns:
            Score between 0 and 1
        """
        if not location_lost or not location_found:
            return 0.5  # Neutral score for missing data
        
        location_lost = location_lost.lower().strip()
        location_found = location_found.lower().strip()
        
        # Exact match
        if location_lost == location_found:
            return 1.0
        
        # Check if one location contains the other
        if location_lost in location_found or location_found in location_lost:
            return 0.8
        
        # Check for common words
        words_lost = set(location_lost.split())
        words_found = set(location_found.split())
        common_words = words_lost.intersection(words_found)
        
        if common_words:
            # Score based on overlap ratio
            overlap = len(common_words) / max(len(words_lost), len(words_found))
            return 0.4 + (overlap * 0.4)  # Range: 0.4 to 0.8
        
        return 0.0  # No match
    
    def calculate_final_score(
        self,
        semantic_score: float,
        time_score: float,
        location_score: float
    ) -> float:
        """
        Calculate weighted final score.
        
        Args:
            semantic_score: Semantic similarity (0 to 1)
            time_score: Time proximity score (0 to 1)
            location_score: Location match score (0 to 1)
            
        Returns:
            Final weighted score (0 to 1)
        """
        final_score = (
            self.w_semantic * semantic_score +
            self.w_time * time_score +
            self.w_location * location_score
        )
        return min(max(final_score, 0.0), 1.0)  # Clamp to [0, 1]
    
    def rank_matches(
        self,
        lost_item: Any,
        found_items_with_scores: List[Tuple[Any, float]]
    ) -> List[Dict]:
        """
        Rank found items for a lost item.
        
        Args:
            lost_item: LostItem model instance
            found_items_with_scores: List of (FoundItem, semantic_similarity) tuples
            
        Returns:
            List of dicts with full scoring breakdown, sorted by final score
        """
        ranked_matches = []
        
        for found_item, semantic_sim in found_items_with_scores:
            time_score = self.calculate_time_score(
                lost_item.date_lost,
                found_item.date_found
            )
            
            location_score = self.calculate_location_score(
                lost_item.location_lost,
                found_item.location_found
            )
            
            final_score = self.calculate_final_score(
                semantic_sim,
                time_score,
                location_score
            )
            
            ranked_matches.append({
                'found_item': found_item,
                'semantic_score': semantic_sim,
                'time_score': time_score,
                'location_score': location_score,
                'final_score': final_score
            })
        
        # Sort by final score (descending)
        ranked_matches.sort(key=lambda x: x['final_score'], reverse=True)
        
        # Add rank
        for i, match in enumerate(ranked_matches):
            match['rank'] = i + 1
        
        return ranked_matches


def find_matches_for_lost_item(lost_item, top_k: int = 10, threshold: float = 0.5) -> List[Dict]:
    """
    Find matching found items for a lost item.
    
    This is the main entry point for the matching algorithm.
    
    Args:
        lost_item: LostItem model instance
        top_k: Maximum number of matches to return
        threshold: Minimum final score to include in results
        
    Returns:
        List of match data with scores
    """
    from .embeddings import embedding_generator
    from .vector_store import get_found_items_store
    from items.models import FoundItem
    from django.conf import settings
    
    # Get weights from settings
    w_semantic = getattr(settings, 'MATCHING_SEMANTIC_WEIGHT', 0.6)
    w_time = getattr(settings, 'MATCHING_TIME_WEIGHT', 0.2)
    w_location = getattr(settings, 'MATCHING_LOCATION_WEIGHT', 0.2)
    threshold = getattr(settings, 'MATCHING_THRESHOLD', threshold)
    
    matcher = SemanticMatcher(w_semantic, w_time, w_location)
    
    # Generate embedding for lost item
    lost_text = lost_item.get_combined_text()
    lost_embedding = embedding_generator.generate_embedding(lost_text)
    
    # Search FAISS vector store
    faiss_store = get_found_items_store()
    similar_items = faiss_store.search(lost_embedding, top_k=top_k * 2)
    
    if not similar_items:
        logger.info(f"No similar items found for lost item {lost_item.id}")
        return []
    
    # Get found items from database
    found_item_ids = [item['item_id'] for item in similar_items]
    found_items = FoundItem.objects.filter(
        id__in=found_item_ids,
        status='AVAILABLE'
    )
    
    # Create similarity mapping
    found_items_with_scores = []
    for found_item in found_items:
        sim_entry = next(
            (item for item in similar_items if str(item['item_id']) == str(found_item.id)),
            None
        )
        if sim_entry:
            found_items_with_scores.append((found_item, sim_entry['similarity']))
    
    # Rank matches
    ranked_matches = matcher.rank_matches(lost_item, found_items_with_scores)
    
    # Filter by threshold and limit
    filtered_matches = [
        match for match in ranked_matches
        if match['final_score'] >= threshold
    ]
    
    return filtered_matches[:top_k]

def execute_matching_algorithm(lost_item=None):
    """
    Executes the matching algorithm and creates/updates Match objects in the database.
    If lost_item is provided, only runs for that item.
    If lost_item is None, runs for all active SEARCHING items.
    """
    from items.models import LostItem
    from matching.models import Match, MatchStatus
    
    if lost_item is not None:
        if lost_item.status != 'SEARCHING':
            return
        items_to_process = [lost_item]
    else:
        items_to_process = list(LostItem.objects.filter(status='SEARCHING'))
        
    for item in items_to_process:
        try:
            matches = find_matches_for_lost_item(item, top_k=5, threshold=0.4)
            if matches:
                for match_data in matches:
                    found_item = match_data['found_item']
                    match, created = Match.objects.get_or_create(
                        lost_item=item,
                        found_item=found_item,
                        defaults={
                            'semantic_score': match_data['semantic_score'],
                            'time_score': match_data['time_score'],
                            'location_score': match_data['location_score'],
                            'final_score': match_data['final_score'],
                            'rank': match_data['rank'],
                            'status': MatchStatus.POTENTIAL
                        }
                    )
                    
                    if not created:
                        match.semantic_score = match_data['semantic_score']
                        match.time_score = match_data['time_score']
                        match.location_score = match_data['location_score']
                        match.final_score = match_data['final_score']
                        match.rank = match_data['rank']
                        match.save()
        except Exception as e:
            logger.error(f"Error during proactive matching for lost item {item.id}: {e}")
    
    logger.info("Proactive matching completed.")
