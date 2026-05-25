import logging
import os
import sys
import threading

from django.apps import AppConfig


logger = logging.getLogger(__name__)


_startup_ran = False


class NlpServiceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "nlp_service"

    def ready(self):
        """Optionally warm up NLP + run matching on backend startup.

        Guarded to avoid running twice under Django's auto-reloader.
        """
        global _startup_ran

        if _startup_ran:
            return

        # Only run these startup tasks when using the Django dev server.
        # (Avoid running on migrations, shell, celery, etc.)
        if "runserver" not in sys.argv:
            return

        # When using the auto-reloader, ready() runs twice; RUN_MAIN=true is the real process.
        if os.environ.get("RUN_MAIN") != "true":
            return

        from django.conf import settings

        do_warmup = bool(getattr(settings, "NLP_STARTUP_WARMUP", False))
        do_matching = bool(getattr(settings, "NLP_STARTUP_PROACTIVE_MATCHING", False))
        if not (do_warmup or do_matching):
            return

        _startup_ran = True

        def _run():
            try:
                if do_warmup:
                    from .embeddings import get_model, embedding_generator
                    from .vector_store import get_found_items_store

                    logger.info("NLP startup: warming up model + vector store...")
                    model = get_model()
                    store = get_found_items_store()
                    logger.info(
                        "NLP startup warmup complete: model=%s dim=%s vectors=%s",
                        getattr(settings, "NLP_MODEL_NAME", None),
                        int(getattr(embedding_generator, "dimension", 0)),
                        int(getattr(store, "total_vectors", 0)),
                    )

                if do_matching:
                    logger.info("NLP startup: kicking off proactive matching sweep...")

                    if getattr(settings, "USE_CELERY_MATCHING", False):
                        try:
                            from matching.tasks import proactive_matching_task

                            proactive_matching_task.delay()
                            logger.info("NLP startup: queued proactive matching via Celery")
                            return
                        except Exception as exc:
                            logger.warning(
                                "NLP startup: Celery not available, falling back to threaded sweep: %s",
                                exc,
                            )

                    from .matching import execute_matching_algorithm

                    execute_matching_algorithm(lost_item=None)
                    logger.info("NLP startup: proactive matching sweep completed")
            except Exception:
                logger.exception("NLP startup tasks failed")

        threading.Thread(target=_run, daemon=True).start()
