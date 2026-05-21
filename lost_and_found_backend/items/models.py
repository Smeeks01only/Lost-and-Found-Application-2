"""
Lost and Found Item Models

This module defines the LostItem and FoundItem models, which are the core
entities for the semantic matching system.
"""

import uuid
from django.db import models
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from datetime import timedelta
import re

COLOR_NORMALISER = {
    'dark': 'black', 'navy blue': 'navy', 'maroon': 'red',
    'dark red': 'red', 'dark green': 'green', 'silver': 'grey',
    'off-white': 'white', 'cream': 'white', 'charcoal': 'grey',
}

def normalise_text_colors(text):
    if not text:
        return ''
    text = str(text)
    for old_color, new_color in COLOR_NORMALISER.items():
        # Use regex to replace whole words only, case-insensitive
        text = re.sub(rf'\b{old_color}\b', new_color, text, flags=re.IGNORECASE)
    return text


class ItemCategory(models.TextChoices):
    """Categories for lost and found items."""
    BAG = 'BAG', 'Bag/Backpack'
    PHONE = 'PHONE', 'Phone/Mobile Device'
    WALLET = 'WALLET', 'Wallet/Purse'
    KEYS = 'KEYS', 'Keys'
    LAPTOP = 'LAPTOP', 'Laptop/Computer'
    CLOTHING = 'CLOTHING', 'Clothing'
    JEWELRY = 'JEWELRY', 'Jewelry/Watch'
    DOCUMENTS = 'DOCUMENTS', 'Documents/ID'
    ELECTRONICS = 'ELECTRONICS', 'Electronics'
    GLASSES = 'GLASSES', 'Glasses/Sunglasses'
    HEADPHONES = 'HEADPHONES', 'Headphones/Earbuds'
    UMBRELLA = 'UMBRELLA', 'Umbrella'
    BOOKS = 'BOOKS', 'Books/Stationery'
    SPORTS = 'SPORTS', 'Sports Equipment'
    OTHER = 'OTHER', 'Other'


class LostItemStatus(models.TextChoices):
    """Status choices for lost items."""
    SEARCHING = 'SEARCHING', 'Searching'
    MATCHED = 'MATCHED', 'Potential Match Found'
    CLAIMED = 'CLAIMED', 'Claimed'
    EXPIRED = 'EXPIRED', 'Expired'


class FoundItemStatus(models.TextChoices):
    """Status choices for found items."""
    AVAILABLE = 'AVAILABLE', 'Available'
    CLAIMED = 'CLAIMED', 'Claimed'
    RETURNED = 'RETURNED', 'Returned to Owner'


class LostItem(models.Model):
    """Model for items reported as lost by users."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Owner relationship
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lost_items'
    )
    
    # Item details
    title = models.CharField(max_length=200)
    description = models.TextField(
        help_text='Provide a detailed description of the item'
    )
    category = models.CharField(
        max_length=20,
        choices=ItemCategory.choices,
        default=ItemCategory.OTHER
    )
    brand = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text='Brand of the item (if applicable)'
    )
    color = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        help_text='Primary color of the item'
    )
    
    # Location and time information
    location_lost = models.CharField(
        max_length=255,
        help_text='Where the item was lost'
    )
    date_lost = models.DateField(
        help_text='Date when the item was lost'
    )
    time_lost = models.TimeField(
        null=True,
        blank=True,
        help_text='Approximate time when the item was lost'
    )
    
    # Status and search settings
    status = models.CharField(
        max_length=20,
        choices=LostItemStatus.choices,
        default=LostItemStatus.SEARCHING
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this item is actively being searched for'
    )
    search_expiry_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Date when proactive searching expires'
    )
    
    # NLP/Vector store references
    embedding_id = models.IntegerField(
        null=True,
        blank=True,
        help_text='Reference to FAISS index position'
    )
    
    # Image (optional)
    image = models.ImageField(
        upload_to='lost_items/',
        blank=True,
        null=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Lost Item'
        verbose_name_plural = 'Lost Items'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.full_name}"
    
    def save(self, *args, **kwargs):
        """Set search expiry date on creation."""
        if not self.search_expiry_date:
            search_period_days = getattr(
                settings, 'LOST_ITEM_SEARCH_PERIOD_DAYS', 30
            )
            self.search_expiry_date = timezone.now() + timedelta(days=search_period_days)
        super().save(*args, **kwargs)
    
    @property
    def is_search_expired(self):
        """Check if the search period has expired."""
        if self.search_expiry_date:
            return timezone.now() > self.search_expiry_date
        return False
    
    def get_combined_text(self):
        """Get combined text for embedding generation."""
        def clean(text):
            return str(text).strip() if text else ''
            
        # Clean title and description
        title = clean(self.title)
        desc = clean(self.description)
        brand_val = clean(self.brand)
        color_val = clean(self.color)
        
        # If color field is populated, we can append it to title/desc for normalization,
        # but the prompt implies applying normalization directly to title/desc
        title = normalise_text_colors(title)
        desc = normalise_text_colors(desc)
        if color_val:
            # Also normalize the explicit color field
            color_val = normalise_text_colors(color_val)
            # Integrate color into description if it exists
            desc = f"Color: {color_val}. {desc}"
        
        parts = []
        if desc:
            # Put the description first so it carries the strongest semantic signal.
            parts.append(f'description: {desc[:500]}')
        if title:
            parts.append(f'title: {title}')
        if brand_val:
            parts.append(f'brand: {brand_val}')
        return ' '.join(parts) or 'unknown item'


class FoundItem(models.Model):
    """Model for items reported as found by office staff."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Staff who uploaded the item
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='found_items'
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(
        help_text='Provide a detailed description of the found item'
    )
    category = models.CharField(
        max_length=20,
        choices=ItemCategory.choices,
        default=ItemCategory.OTHER
    )
    brand = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text='Brand of the item (if applicable)'
    )
    color = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        help_text='Primary color of the item'
    )
    
    # Location and time information
    location_found = models.CharField(
        max_length=255,
        help_text='Where the item was found'
    )
    date_found = models.DateField(
        help_text='Date when the item was found'
    )
    time_found = models.TimeField(
        null=True,
        blank=True,
        help_text='Approximate time when the item was found'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=FoundItemStatus.choices,
        default=FoundItemStatus.AVAILABLE
    )
    
    # Verification - Secret question mechanism
    secret_question = models.CharField(
        max_length=255,
        blank=True,
        help_text='Secret question to verify ownership (e.g., "What\'s inside?")'
    )
    secret_answer_hash = models.CharField(
        max_length=255,
        blank=True,
        help_text='Hashed secret answer (Legacy)'
    )
    secret_answer_raw = models.CharField(
        max_length=255,
        blank=True,
        help_text='Raw secret answer for semantic matching'
    )
    
    # NLP/Vector store references
    embedding_id = models.IntegerField(
        null=True,
        blank=True,
        help_text='Reference to FAISS index position'
    )
    
    # Image (optional but recommended)
    image = models.ImageField(
        upload_to='found_items/',
        blank=True,
        null=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Found Item'
        verbose_name_plural = 'Found Items'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - Found at {self.location_found}"
    
    def set_secret_answer(self, answer):
        """Store the secret answer and its hash."""
        self.secret_answer_hash = make_password(answer.lower().strip())
        self.secret_answer_raw = answer.lower().strip()
    
    def check_secret_answer(self, answer):
        """Verify a provided answer using multi-layered semantic matching."""
        if not self.secret_answer_hash and not self.secret_answer_raw:
            return True  # No secret question set
            
        provided_answer = answer.lower().strip()
        
        # 1. Check Legacy Hash (if raw answer isn't available)
        if not self.secret_answer_raw and self.secret_answer_hash:
            return check_password(provided_answer, self.secret_answer_hash)
            
        stored_answer = self.secret_answer_raw
        
        # 2. Exact Match Check
        if provided_answer == stored_answer:
            return True
            
        # 3. Typo Tolerance (SequenceMatcher)
        from difflib import SequenceMatcher
        ratio = SequenceMatcher(None, provided_answer, stored_answer).ratio()
        if ratio > 0.8:
            return True
            
        # 4. Semantic Similarity (NLP Embeddings)
        try:
            from nlp_service.embeddings import EmbeddingGenerator
            import numpy as np
            
            generator = EmbeddingGenerator()
            emb1 = generator.generate_embedding(provided_answer)
            emb2 = generator.generate_embedding(stored_answer)
            
            if emb1 is not None and emb2 is not None:
                cosine_sim = generator.compute_similarity(emb1, emb2)
                if cosine_sim > 0.85:
                    return True
        except Exception as e:
            # Fallback if NLP service fails
            import logging
            logging.error(f"Error in semantic checking: {str(e)}")
            pass
            
        return False
    
    def get_combined_text(self):
        """Get combined text for embedding generation."""
        def clean(text):
            return str(text).strip() if text else ''
            
        # Clean title and description
        title = clean(self.title)
        desc = clean(self.description)
        brand_val = clean(self.brand)
        color_val = clean(self.color)
        
        # Normalize colors
        title = normalise_text_colors(title)
        desc = normalise_text_colors(desc)
        if color_val:
            color_val = normalise_text_colors(color_val)
            desc = f"Color: {color_val}. {desc}"
        
        parts = []
        if title: parts.append(f'item: {title}')
        if brand_val: parts.append(f'brand: {brand_val}')
        if desc:  parts.append(f'description: {desc[:300]}')
        return ' '.join(parts) or 'unknown item'
