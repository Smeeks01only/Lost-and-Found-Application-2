"""
URL patterns for the matching app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import MatchViewSet, ClaimViewSet

router = DefaultRouter()
router.register(r'matches', MatchViewSet, basename='match')
router.register(r'claims', ClaimViewSet, basename='claim')

app_name = 'matching'

urlpatterns = [
    path('', include(router.urls)),
]
