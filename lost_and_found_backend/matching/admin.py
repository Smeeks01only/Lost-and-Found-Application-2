"""
Django Admin Configuration for the Matching app.
"""

from django.contrib import admin
from .models import Match, Claim


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    """Admin interface for Matches."""
    
    list_display = ['get_lost_item', 'get_found_item', 'final_score', 'status', 'rank', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['lost_item__title', 'found_item__title']
    ordering = ['-final_score', '-created_at']
    readonly_fields = ['semantic_score', 'time_score', 'location_score', 'final_score', 'created_at', 'updated_at']
    
    def get_lost_item(self, obj):
        return obj.lost_item.title
    get_lost_item.short_description = 'Lost Item'
    
    def get_found_item(self, obj):
        return obj.found_item.title
    get_found_item.short_description = 'Found Item'
    
    fieldsets = (
        ('Items', {'fields': ('lost_item', 'found_item')}),
        ('Scores', {'fields': ('semantic_score', 'time_score', 'location_score', 'final_score')}),
        ('Status', {'fields': ('status', 'rank')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    """Admin interface for Claims."""
    
    list_display = ['get_claimant', 'get_item', 'is_correct_answer', 'status', 'attempt_count', 'created_at']
    list_filter = ['status', 'is_correct_answer', 'created_at']
    search_fields = ['claimant__email', 'claimant__full_name', 'match__found_item__title']
    ordering = ['-created_at']
    readonly_fields = ['is_correct_answer', 'attempt_count', 'created_at', 'updated_at', 'reviewed_at']
    
    def get_claimant(self, obj):
        return obj.claimant.full_name or obj.claimant.email
    get_claimant.short_description = 'Claimant'
    
    def get_item(self, obj):
        return obj.match.found_item.title
    get_item.short_description = 'Item'
    
    fieldsets = (
        ('Claim Details', {'fields': ('match', 'claimant')}),
        ('Verification', {'fields': ('is_correct_answer', 'secret_answer_provided', 'attempt_count')}),
        ('Proof', {'fields': ('additional_proof', 'proof_image')}),
        ('Review', {'fields': ('status', 'admin_notes', 'reviewed_by', 'reviewed_at')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    
    actions = ['approve_claims', 'reject_claims']
    
    def approve_claims(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='APPROVED', reviewed_by=request.user, reviewed_at=timezone.now())
    approve_claims.short_description = "Approve selected claims"
    
    def reject_claims(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='REJECTED', reviewed_by=request.user, reviewed_at=timezone.now())
    reject_claims.short_description = "Reject selected claims"
