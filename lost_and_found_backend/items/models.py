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
        return f"{self.title} {self.description} {self.category} {self.location_lost}"


class FoundItem(models.Model):
    """Model for items reported as found by office staff."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Staff who uploaded the item
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='found_items'
    )
    
    # Item details
    title = models.CharField(max_length=200)
    description = models.TextField(
        help_text='Provide a detailed description of the found item'
    )
    category = models.CharField(
        max_length=20,
        choices=ItemCategory.choices,
        default=ItemCategory.OTHER
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
        help_text='Hashed secret answer'
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
        """Hash and store the secret answer."""
        self.secret_answer_hash = make_password(answer.lower().strip())
    
    def check_secret_answer(self, answer):
        """Verify a provided answer against the stored hash."""
        if not self.secret_answer_hash:
            return True  # No secret question set
        return check_password(answer.lower().strip(), self.secret_answer_hash)
    
    def get_combined_text(self):
        """Get combined text for embedding generation."""
        return f"{self.title} {self.description} {self.category} {self.location_found}"
