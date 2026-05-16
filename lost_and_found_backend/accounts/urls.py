"""
URL patterns for the accounts app.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    ProfileView,
    ChangePasswordView,
    LogoutView,
    AdminUserListView,
    AdminUserDetailView,
    AdminUserStatsView,
    DemoPasswordResetView,
)

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('demo-reset-password/', DemoPasswordResetView.as_view(), name='demo_reset_password'),
    
    # Profile
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),

    # Admin User Management
    path('users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('users/stats/', AdminUserStatsView.as_view(), name='admin_user_stats'),
    path('users/<uuid:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
]
