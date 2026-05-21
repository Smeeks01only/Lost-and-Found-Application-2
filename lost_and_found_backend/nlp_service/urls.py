"""URL patterns for the NLP service."""

from django.urls import path

from .views import WarmupView

app_name = "nlp_service"

urlpatterns = [
    path("nlp/warmup/", WarmupView.as_view(), name="nlp_warmup"),
]
