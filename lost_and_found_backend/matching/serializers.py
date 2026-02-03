"""
Match and Claim Serializers for the matching and verification workflow.
"""

from rest_framework import serializers
from .models import Match, Claim, ClaimStatus
from items.serializers import LostItemSerializer, FoundItemPublicSerializer


class MatchSerializer(serializers.ModelSerializer):
    """Serializer for the Match model."""
    
    lost_item = LostItemSerializer(read_only=True)
    found_item = FoundItemPublicSerializer(read_only=True)
    score_breakdown = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_secret_question = serializers.SerializerMethodField()
    
    class Meta:
        model = Match
        fields = [
            'id', 'lost_item', 'found_item',
            'semantic_score', 'time_score', 'location_score', 'final_score',
            'score_breakdown', 'rank', 'status', 'status_display',
            'has_secret_question', 'created_at', 'updated_at'
        ]
        read_only_fields = '__all__'
    
    def get_score_breakdown(self, obj):
        """Get formatted score breakdown."""
        return {
            'semantic': f"{obj.semantic_score:.1%}",
            'time': f"{obj.time_score:.1%}",
            'location': f"{obj.location_score:.1%}",
            'final': f"{obj.final_score:.1%}",
        }
    
    def get_has_secret_question(self, obj):
        """Check if the found item has a secret question."""
        return bool(obj.found_item.secret_question)


class MatchListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for match listings."""
    
    lost_item_title = serializers.CharField(source='lost_item.title', read_only=True)
    found_item_title = serializers.CharField(source='found_item.title', read_only=True)
    found_item_location = serializers.CharField(source='found_item.location_found', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Match
        fields = [
            'id', 'lost_item_title', 'found_item_title', 'found_item_location',
            'final_score', 'rank', 'status', 'status_display', 'created_at'
        ]


class ClaimSerializer(serializers.ModelSerializer):
    """Serializer for the Claim model."""
    
    match = MatchSerializer(read_only=True)
    claimant_name = serializers.CharField(source='claimant.full_name', read_only=True)
    claimant_email = serializers.EmailField(source='claimant.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Claim
        fields = [
            'id', 'match', 'claimant', 'claimant_name', 'claimant_email',
            'is_correct_answer', 'additional_proof', 'proof_image',
            'admin_notes', 'reviewed_by', 'status', 'status_display',
            'attempt_count', 'created_at', 'updated_at', 'reviewed_at'
        ]
        read_only_fields = [
            'id', 'match', 'claimant', 'is_correct_answer', 'reviewed_by',
            'attempt_count', 'created_at', 'updated_at', 'reviewed_at'
        ]


class ClaimSubmitSerializer(serializers.Serializer):
    """Serializer for submitting a claim."""
    
    secret_answer = serializers.CharField(required=True)
    additional_proof = serializers.CharField(required=False, allow_blank=True)
    proof_image = serializers.ImageField(required=False)


class ClaimReviewSerializer(serializers.Serializer):
    """Serializer for admin review of claims."""
    
    status = serializers.ChoiceField(choices=[
        (ClaimStatus.APPROVED, 'Approved'),
        (ClaimStatus.REJECTED, 'Rejected'),
        (ClaimStatus.ADDITIONAL_PROOF_REQUIRED, 'Additional Proof Required'),
    ])
    admin_notes = serializers.CharField(required=False, allow_blank=True)
