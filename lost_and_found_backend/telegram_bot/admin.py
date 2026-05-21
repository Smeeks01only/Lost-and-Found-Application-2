from django.contrib import admin

from .models import TelegramSession


@admin.register(TelegramSession)
class TelegramSessionAdmin(admin.ModelAdmin):
    list_display = ("chat_id", "state", "updated_at")
    search_fields = ("chat_id",)
