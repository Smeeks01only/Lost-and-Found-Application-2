"""
Item Serializers for LostItem and FoundItem CRUD operations.
"""

from rest_framework import serializers
from .models import LostItem, FoundItem, ItemCategory


class LostItemSerializer(serializers.ModelSerializer):
    """Serializer for the LostItem model."""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    match_count = serializers.SerializerMethodField()
    
    class Meta:
        model = LostItem
        fields = [
            'id', 'user', 'user_name', 'user_email',
            'title', 'description', 'category', 'category_display',
            'location_lost', 'date_lost', 'time_lost',
            'status', 'status_display', 'is_active', 'search_expiry_date',
            'image', 'match_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'is_active', 'search_expiry_date',
            'embedding_id', 'created_at', 'updated_at'
        ]
    
    def get_match_count(self, obj):
        """Get the number of potential matches for this item."""
        return obj.matches.filter(status='POTENTIAL').count()


class LostItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a LostItem."""
    
    class Meta:
        model = LostItem
        fields = [
            'title', 'description', 'category',
            'location_lost', 'date_lost', 'time_lost', 'image'
        ]
    
    def create(self, validated_data):
        """Create lost item with current user as owner."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class FoundItemSerializer(serializers.ModelSerializer):
    """Serializer for the FoundItem model."""
    
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_secret_question = serializers.SerializerMethodField()
    
    class Meta:
        model = FoundItem
        fields = [
            'id', 'uploaded_by', 'uploaded_by_name',
            'title', 'description', 'category', 'category_display',
            'location_found', 'date_found', 'time_found',
            'status', 'status_display',
            'secret_question', 'has_secret_question',
            'image', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'uploaded_by', 'status', 'embedding_id',
            'created_at', 'updated_at'
        ]
    
    def get_has_secret_question(self, obj):
        """Check if a secret question has been set."""
        return bool(obj.secret_question)


class FoundItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a FoundItem (staff only)."""
    
    secret_answer = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = FoundItem
        fields = [
            'title', 'description', 'category',
            'location_found', 'date_found', 'time_found',
            'secret_question', 'secret_answer', 'image'
        ]
    
    def create(self, validated_data):
        """Create found item with secret answer hashing."""
        secret_answer = validated_data.pop('secret_answer', None)
        user = self.context['request'].user
        validated_data['uploaded_by'] = user
        
        found_item = super().create(validated_data)
        
        if secret_answer:
            found_item.set_secret_answer(secret_answer)
            found_item.save()
        
        return found_item


class FoundItemPublicSerializer(serializers.ModelSerializer):
    """Public serializer for FoundItem (hides sensitive info)."""
    
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = FoundItem
        fields = [
            'id', 'title', 'description', 'category', 'category_display',
            'location_found', 'date_found', 'image', 'created_at'
        ]
