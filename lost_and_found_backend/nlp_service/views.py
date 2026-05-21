"""NLP service API views.

Currently contains a lightweight warmup endpoint to preload the embedding model
and (optionally) the vector store in the backend process.
"""

from __future__ import annotations

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class WarmupView(APIView):
    """Warm up the NLP model and vector store.

    This is intended to be called once when the mobile app starts so the first
    real matching request doesn't pay the cold-start cost (model load).
    """

    permission_classes = [AllowAny]

    def get(self, request):
        from django.conf import settings

        from .embeddings import embedding_generator, get_model
        from .vector_store import get_found_items_store

        # Force model load.
        model = get_model()

        # Best-effort: ensure the vector store is initialized/loaded.
        store = get_found_items_store()

        return Response(
            {
                "ok": True,
                "model_name": getattr(settings, "NLP_MODEL_NAME", None),
                "embedding_dimension": int(embedding_generator.dimension),
                "vector_store_total_vectors": int(getattr(store, "total_vectors", 0)),
                "vector_store_path": str(getattr(settings, "VECTOR_STORE_PATH", "vector_stores")),
                "faiss_available": True,
                "note": "Warmup completed",
            }
        )
