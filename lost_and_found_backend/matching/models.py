"""
Match and Claim Models

This module defines the Match and Claim models for handling:
- Semantic matches between lost and found items
- Claim submissions and verification workflow
"""

import uuid
from django.db import models
from django.conf import settings


class MatchStatus(models.TextChoices):
    """Status choices for matches."""
    POTENTIAL = 'POTENTIAL', 'Potential Match'
    CLAIMED = 'CLAIMED', 'Claim Submitted'
    VERIFIED = 'VERIFIED', 'Verified & Returned'
    REJECTED = 'REJECTED', 'Match Rejected'


class ClaimStatus(models.TextChoices):
    """Status choices for claims."""
    PENDING = 'PENDING', 'Pending Review'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'
    ADDITIONAL_PROOF_REQUIRED = 'PROOF_REQUIRED', 'Additional Proof Required'


class Match(models.Model):
    """
    Model for semantic matches between lost and found items.
    
    Stores the matching scores from the NLP algorithm:
    - semantic_score: Cosine similarity from SBERT embeddings
    - time_score: Proximity score based on date difference
    - location_score: Location matching score
    - final_score: Weighted combination of all scores
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Related items
    lost_item = models.ForeignKey(
        'items.LostItem',
        on_delete=models.CASCADE,
        related_name='matches'
    )
    found_item = models.ForeignKey(
        'items.FoundItem',
        on_delete=models.CASCADE,
        related_name='matches'
    )
    
    # Matching scores (all between 0 and 1)
    semantic_score = models.FloatField(
        default=0.0,
        help_text='Cosine similarity between text embeddings'
    )
    time_score = models.FloatField(
        default=0.0,
        help_text='Time proximity score'
    )
    location_score = models.FloatField(
        default=0.0,
        help_text='Location matching score'
    )
    metadata_score = models.FloatField(
        default=0.0,
        help_text='Composite metadata similarity (category, location, time, color)'
    )
    final_score = models.FloatField(
        default=0.0,
        help_text='Hybrid final score: alpha * semantic + (1-alpha) * metadata'
    )
    
    # Ranking
    rank = models.IntegerField(
        default=0,
        help_text='Ranking among matches for the lost item'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=MatchStatus.choices,
        default=MatchStatus.POTENTIAL
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Match'
        verbose_name_plural = 'Matches'
        ordering = ['-final_score', '-created_at']
        unique_together = ['lost_item', 'found_item']
    
    def __str__(self):
        return f"Match: {self.lost_item.title} <-> {self.found_item.title} ({self.final_score:.2f})"
    
    def get_score_breakdown(self):
        """Get a breakdown of all matching scores."""
        return {
            'semantic_score': self.semantic_score,
            'metadata_score': self.metadata_score,
            'time_score': self.time_score,
            'location_score': self.location_score,
            'final_score': self.final_score,
        }


class Claim(models.Model):
    """
    Model for claim submissions.
    
    Handles the verification workflow:
    1. User submits claim with secret answer
    2. System verifies answer
    3. Admin reviews if needed
    4. Claim approved or rejected
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Related match and claimant
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name='claims'
    )
    claimant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='claims'
    )
    
    # Verification
    secret_answer_provided = models.CharField(
        max_length=255,
        blank=True,
        help_text='The answer provided by the claimant'
    )
    is_correct_answer = models.BooleanField(
        default=False,
        help_text='Whether the secret answer was correct'
    )
    
    # Additional proof (if required)
    additional_proof = models.TextField(
        blank=True,
        help_text='Additional proof provided by claimant'
    )
    proof_image = models.ImageField(
        upload_to='claim_proofs/',
        blank=True,
        null=True,
        help_text='Proof image (e.g., receipt, photo of item)'
    )
    
    # Admin review
    admin_notes = models.TextField(
        blank=True,
        help_text='Notes from admin review'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_claims'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=ClaimStatus.choices,
        default=ClaimStatus.PENDING
    )
    
    # Attempt tracking (for fraud prevention)
    attempt_count = models.IntegerField(
        default=1,
        help_text='Number of claim attempts by this user'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Claim'
        verbose_name_plural = 'Claims'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Claim by {self.claimant.full_name} for {self.match.found_item.title}"
    
    @property
    def is_pending(self):
        """Check if claim is still pending review."""
        return self.status == ClaimStatus.PENDING
    
    @property
    def is_approved(self):
        """Check if claim has been approved."""
        return self.status == ClaimStatus.APPROVED
