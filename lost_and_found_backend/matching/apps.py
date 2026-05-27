from django.apps import AppConfig


class MatchingConfig(AppConfig):
    name = 'matching'

    def ready(self):
        # Ensure signal handlers are registered
        from . import signals  # noqa: F401
