"""
URL patterns for the matching app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import MatchViewSet, ClaimViewSet, RunMatchingView

router = DefaultRouter()
router.register(r'matches', MatchViewSet, basename='match')
router.register(r'claims', ClaimViewSet, basename='claim')

app_name = 'matching'

urlpatterns = [
    path('matches/run/', RunMatchingView.as_view({'post': 'run'}), name='run_matching'),
    path('', include(router.urls)),
]
