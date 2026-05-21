"""
URL configuration for lost_and_found_backend project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 endpoints
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/', include('items.urls')),
    path('api/v1/', include('matching.urls')),
    path('api/v1/', include('notifications.urls')),
    path('api/v1/', include('nlp_service.urls')),
    path('api/v1/whatsapp/', include('whatsapp_bot.urls')),
    path('api/v1/telegram/', include('telegram_bot.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
