"""
Django Admin Configuration for the Items app.
"""

from django.contrib import admin
from .models import LostItem, FoundItem


@admin.register(LostItem)
class LostItemAdmin(admin.ModelAdmin):
    """Admin interface for Lost Items."""
    
    list_display = ['title', 'user', 'category', 'location_lost', 'date_lost', 'status', 'is_active', 'created_at']
    list_filter = ['status', 'category', 'is_active', 'created_at']
    search_fields = ['title', 'description', 'location_lost', 'user__email', 'user__full_name']
    ordering = ['-created_at']
    readonly_fields = ['embedding_id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Item Details', {'fields': ('title', 'description', 'category', 'image')}),
        ('Location & Time', {'fields': ('location_lost', 'date_lost', 'time_lost')}),
        ('Status', {'fields': ('status', 'is_active', 'search_expiry_date')}),
        ('Owner', {'fields': ('user',)}),
        ('System', {'fields': ('embedding_id', 'created_at', 'updated_at')}),
    )


@admin.register(FoundItem)
class FoundItemAdmin(admin.ModelAdmin):
    """Admin interface for Found Items."""
    
    list_display = ['title', 'uploaded_by', 'category', 'location_found', 'date_found', 'status', 'created_at']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['title', 'description', 'location_found', 'uploaded_by__email']
    ordering = ['-created_at']
    readonly_fields = ['secret_answer_hash', 'embedding_id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Item Details', {'fields': ('title', 'description', 'category', 'image')}),
        ('Location & Time', {'fields': ('location_found', 'date_found', 'time_found')}),
        ('Verification', {'fields': ('secret_question', 'secret_answer_hash')}),
        ('Status', {'fields': ('status',)}),
        ('Staff', {'fields': ('uploaded_by',)}),
        ('System', {'fields': ('embedding_id', 'created_at', 'updated_at')}),
    )
