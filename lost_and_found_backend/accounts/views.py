"""
Account Views for authentication and profile management.
"""

from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    AdminUserUpdateSerializer,
)

User = get_user_model()


# ==================== Permission Classes ====================

class IsAdminUser(permissions.BasePermission):
    """Only allow ADMIN role users."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )


# ==================== Auth Views ====================

class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'Registration successful',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login endpoint that returns user info with tokens."""
    
    serializer_class = CustomTokenObtainPairSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'message': 'Profile updated successfully',
            'user': UserSerializer(instance).data
        })


class ChangePasswordView(APIView):
    """Change user password."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Password changed successfully'
        })


class LogoutView(APIView):
    """Logout endpoint (client-side token deletion)."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Client should delete the tokens
        # Optionally implement token blacklisting here
        return Response({
            'message': 'Logout successful'
        })


# ==================== Admin User Management Views ====================

class AdminUserListView(generics.ListAPIView):
    """List all users (Admin only). Supports search and role filtering."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'full_name']
    ordering_fields = ['date_joined', 'full_name', 'role']
    ordering = ['-date_joined']

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role')
        is_active = self.request.query_params.get('is_active')

        if role:
            queryset = queryset.filter(role=role)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a specific user (Admin only)."""

    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AdminUserUpdateSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'message': 'User updated successfully',
            'user': UserSerializer(instance).data,
        })


class AdminUserStatsView(APIView):
    """Return user statistics (Admin only)."""

    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        total = User.objects.count()
        role_counts = User.objects.values('role').annotate(count=Count('id'))
        active_count = User.objects.filter(is_active=True).count()

        # Users who signed up in the last 7 days
        week_ago = timezone.now() - timedelta(days=7)
        recent_signups = User.objects.filter(date_joined__gte=week_ago).count()

        by_role = {item['role']: item['count'] for item in role_counts}

        return Response({
            'total_users': total,
            'active_users': active_count,
            'recent_signups': recent_signups,
            'by_role': {
                'LOSER': by_role.get('LOSER', 0),
                'STAFF': by_role.get('STAFF', 0),
                'ADMIN': by_role.get('ADMIN', 0),
            },
        })
