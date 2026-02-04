"""
Django config package.

This module makes sure the Celery app is loaded when Django starts.
Celery is optional for development - it will only be loaded if installed.
"""

try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    # Celery not installed, skip loading
    celery_app = None
    __all__ = ()
