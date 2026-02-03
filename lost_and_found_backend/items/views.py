"""
Item Views for LostItem and FoundItem CRUD operations.
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import LostItem, FoundItem
from .serializers import (
    LostItemSerializer,
    LostItemCreateSerializer,
    FoundItemSerializer,
    FoundItemCreateSerializer,
    FoundItemPublicSerializer
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Permission to only allow owners to edit their items."""
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'uploaded_by'):
            return obj.uploaded_by == request.user
        return False


class IsStaffUser(permissions.BasePermission):
    """Permission to only allow staff and admin users."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_staff_permissions()


class LostItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Lost Items.
    
    Regular users can only see their own lost items.
    Staff and admins can see all lost items.
    """
    
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'category', 'location_lost']
    ordering_fields = ['created_at', 'date_lost', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.has_staff_permissions():
            return LostItem.objects.all()
        return LostItem.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action in ['create']:
            return LostItemCreateSerializer
        return LostItemSerializer
    
    @action(detail=True, methods=['get'])
    def matches(self, request, pk=None):
        """Get matches for a specific lost item."""
        lost_item = self.get_object()
        matches = lost_item.matches.filter(status='POTENTIAL')
        
        from matching.serializers import MatchListSerializer
        serializer = MatchListSerializer(matches, many=True)
        return Response(serializer.data)


class FoundItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Found Items.
    
    Only staff can create and manage found items.
    Regular users can view available found items.
    """
    
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'category', 'location_found']
    ordering_fields = ['created_at', 'date_found', 'status']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsStaffUser()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.has_staff_permissions():
            return FoundItem.objects.all()
        # Regular users can only see available items
        return FoundItem.objects.filter(status='AVAILABLE')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return FoundItemCreateSerializer
        if self.request.user.has_staff_permissions():
            return FoundItemSerializer
        return FoundItemPublicSerializer
