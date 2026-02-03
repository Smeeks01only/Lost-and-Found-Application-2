from django.apps import AppConfig


class ItemsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'items'
    
    def ready(self):
        # Import signals to register them
        import items.signals  # noqa
