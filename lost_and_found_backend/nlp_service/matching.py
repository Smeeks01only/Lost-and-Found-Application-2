"""
Semantic Matching Algorithm

This module implements the hybrid matching algorithm that combines:
- Semantic similarity (SBERT embeddings)
- Metadata similarity (category, color, brand, location)

Final score: S_final = α * S_semantic + (1 - α) * S_metadata
Where S_metadata = weighted combination of category, location, time, and color matches
α is tunable (0.3 to 0.9) to balance semantic vs metadata emphasis
"""

import math
import logging
from datetime import datetime, date
from typing import List, Dict, Tuple, Optional, Any

logger = logging.getLogger(__name__)


class SemanticMatcher:
    """
    Hybrid semantic matching algorithm for lost and found items.
    
    Combines semantic embeddings with metadata context using a tunable alpha parameter.
    """
    
    def __init__(self, alpha: float = 0.6):
        """
        Initialize the matcher with hybrid scoring parameters.
        
        Args:
            alpha: Weight for semantic (0.3 to 0.9). 
                   1 - alpha is weight for metadata.
                   Default 0.6 means 60% semantic, 40% metadata.
        """
        # Clamp alpha to valid range
        self.alpha = max(0.3, min(0.9, alpha))
        self.metadata_weight = 1.0 - self.alpha
        
        # Sub-weights for metadata components (sum to 1.0)
        self.w_category = 0.4
        self.w_location = 0.3
        self.w_time = 0.2
        self.w_color = 0.1
    
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
    
    def calculate_category_score(self, category_lost: str, category_found: str) -> float:
        """
        Calculate category matching score.
        Exact match scores 1.0, mismatch scores 0.0.
        
        Args:
            category_lost: Category of lost item
            category_found: Category of found item
            
        Returns:
            Score between 0 and 1
        """
        if not category_lost or not category_found:
            return 0.5  # Neutral for missing data
        return 1.0 if str(category_lost).upper() == str(category_found).upper() else 0.0
    
    def calculate_color_score(self, color_lost: Optional[str], color_found: Optional[str]) -> float:
        """
        Calculate color matching score.
        Uses partial text matching for color names.
        
        Args:
            color_lost: Color of lost item
            color_found: Color of found item
            
        Returns:
            Score between 0 and 1
        """
        if not color_lost or not color_found:
            return 0.5  # Neutral for missing data
        
        color_lost = str(color_lost).lower().strip()
        color_found = str(color_found).lower().strip()
        
        # Exact match
        if color_lost == color_found:
            return 1.0
        
        # Partial match (e.g., "dark blue" contains "blue")
        if color_lost in color_found or color_found in color_lost:
            return 0.7
        
        return 0.0
    
    def calculate_metadata_score(
        self,
        lost_item: Any,
        found_item: Any
    ) -> float:
        """
        Calculate composite metadata similarity score.
        
        Combines category, location, time, and color matching.
        
        Args:
            lost_item: LostItem model instance
            found_item: FoundItem model instance
            
        Returns:
            Score between 0 and 1
        """
        category_score = self.calculate_category_score(
            lost_item.category,
            found_item.category
        )
        
        location_score = self.calculate_location_score(
            lost_item.location_lost,
            found_item.location_found
        )
        
        time_score = self.calculate_time_score(
            lost_item.date_lost,
            found_item.date_found
        )
        
        color_score = self.calculate_color_score(
            lost_item.color,
            found_item.color
        )
        
        # Weighted combination
        metadata_score = (
            self.w_category * category_score +
            self.w_location * location_score +
            self.w_time * time_score +
            self.w_color * color_score
        )
        
        return min(max(metadata_score, 0.0), 1.0)
    
    def calculate_final_score(
        self,
        semantic_score: float,
        metadata_score: float
    ) -> float:
        """
        Calculate final hybrid score combining semantic and metadata.
        
        Uses the formula: S_final = α * S_semantic + (1 - α) * S_metadata
        
        Args:
            semantic_score: Semantic similarity from embeddings (0 to 1)
            metadata_score: Composite metadata similarity (0 to 1)
            
        Returns:
            Final weighted score (0 to 1)
        """
        final_score = self.alpha * semantic_score + self.metadata_weight * metadata_score
        return min(max(final_score, 0.0), 1.0)  # Clamp to [0, 1]
    
    def rank_matches(
        self,
        lost_item: Any,
        found_items_with_scores: List[Tuple[Any, float]]
    ) -> List[Dict]:
        """
        Rank found items for a lost item using hybrid scoring.
        
        Args:
            lost_item: LostItem model instance
            found_items_with_scores: List of (FoundItem, semantic_similarity) tuples
            
        Returns:
            List of dicts with full scoring breakdown, sorted by final score
        """
        ranked_matches = []
        
        for found_item, semantic_sim in found_items_with_scores:
            # Calculate component scores
            metadata_score = self.calculate_metadata_score(lost_item, found_item)
            time_score = self.calculate_time_score(
                lost_item.date_lost,
                found_item.date_found
            )
            location_score = self.calculate_location_score(
                lost_item.location_lost,
                found_item.location_found
            )
            category_score = self.calculate_category_score(
                lost_item.category,
                found_item.category
            )
            color_score = self.calculate_color_score(
                lost_item.color,
                found_item.color
            )
            
            # Calculate final hybrid score
            final_score = self.calculate_final_score(semantic_sim, metadata_score)
            
            ranked_matches.append({
                'found_item': found_item,
                'semantic_score': semantic_sim,
                'metadata_score': metadata_score,
                'category_score': category_score,
                'location_score': location_score,
                'time_score': time_score,
                'color_score': color_score,
                'final_score': final_score
            })
        
        # Sort by final score (descending)
        ranked_matches.sort(key=lambda x: x['final_score'], reverse=True)
        
        # Add rank
        for i, match in enumerate(ranked_matches):
            match['rank'] = i + 1
        
        return ranked_matches


def find_matches_for_lost_item(
    lost_item,
    top_k: int = 10,
    threshold: Optional[float] = None,
) -> List[Dict]:
    """
    Find matching found items for a lost item using hybrid scoring.
    
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
    
    # Get alpha and threshold from settings
    alpha = getattr(settings, 'MATCHING_ALPHA', 0.6)
    if threshold is None:
        threshold = float(getattr(settings, 'MATCHING_THRESHOLD', 0.5))
    
    matcher = SemanticMatcher(alpha=alpha)
    
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

    # First try: enforce category match (reduces false positives).
    found_items = FoundItem.objects.filter(
        id__in=found_item_ids,
        status='AVAILABLE',
        category=lost_item.category,
    )

    # Fallback: if category mismatch would otherwise hide real matches,
    # retry without category constraint.
    if not found_items.exists():
        logger.info(
            f"No AVAILABLE found items in same category for lost item {lost_item.id}. "
            "Retrying without category filter."
        )
        found_items = FoundItem.objects.filter(
            id__in=found_item_ids,
            status='AVAILABLE',
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
            matches = find_matches_for_lost_item(item, top_k=5)
            if matches:
                for match_data in matches:
                    found_item = match_data['found_item']
                    match, created = Match.objects.get_or_create(
                        lost_item=item,
                        found_item=found_item,
                        defaults={
                            'semantic_score': match_data['semantic_score'],
                            'metadata_score': match_data['metadata_score'],
                            'time_score': match_data['time_score'],
                            'location_score': match_data['location_score'],
                            'final_score': match_data['final_score'],
                            'rank': match_data['rank'],
                            'status': MatchStatus.POTENTIAL
                        }
                    )
                    
                    if not created:
                        match.semantic_score = match_data['semantic_score']
                        match.metadata_score = match_data['metadata_score']
                        match.time_score = match_data['time_score']
                        match.location_score = match_data['location_score']
                        match.final_score = match_data['final_score']
                        match.rank = match_data['rank']
                        match.save()
        except Exception as e:
            logger.error(f"Error during proactive matching for lost item {item.id}: {e}")
    
    logger.info("Proactive matching completed.")
